"""
backend/ml/model.py — Random Forest Regressor Pipeline (Fixed Optimized Parameters).

Aligned with BikeRentalModel.ipynb
------------------------------------
Notebook baseline (n_estimators=150, random split, no lags):
  RMSE = 62.08,  MAE = 40.40,  R² = 0.878

This pipeline targets RMSE ≤ 45, MAE ≤ 30, R² ≥ 0.85 by adding:
  1. Chronological split (correct for time-series, no leakage)
  2. Lag features: cnt_lag1/2/24/168, cnt_roll_mean  (huge signal boost)
  3. Notebook features: month_sin/cos, is_rush_hour, temp_x_workday
  4. Pre-optimized fixed hyperparameters (replaces costly GridSearchCV)
  5. log1p target transform to stabilise heavy-tailed bike-count distribution

Pipeline steps
--------------
  cyclic_transform → ColumnTransformer → TransformedTargetRegressor(RF, log1p)

cyclic_transform adds hr_sin, hr_cos, month_sin, month_cos BEFORE the
ColumnTransformer runs, so they are StandardScaled correctly.
(These columns are pre-registered in NUMERICAL_FEATURES via build_preprocessor.)

Pre-optimized Random Forest hyperparameters for hour.csv hourly bike sharing data.
----------------------------------------------------------------------------------
  n_estimators=200     : Sufficient trees for stable predictions without overfitting
  max_depth=25         : Allows model to capture hourly demand patterns
  min_samples_split=3  : Fine-grained decision boundaries
  min_samples_leaf=1   : Leaf nodes can have single samples (hourly patterns are distinct)
  n_jobs=-1            : Parallelizes tree building across all CPU cores for speed
Training time: 30-60 seconds (previously 4-5 minutes with GridSearchCV)
"""

import os
import joblib
import numpy as np
from datetime import datetime

from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer

from .preprocess import build_preprocessor, chronological_split, TARGET

# ── Storage config ────────────────────────────────────────────────────────────
MODELS_DIR      = "models"
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── Fixed optimized hyperparameters ──────────────────────────────────────────
# These values were the consistent winners from prior grid searches on hour.csv.
# Fixing them removes the need for repeated CV fitting (~108 fits → 1 fit).
# Training time: 30-60 s  (down from 4-5 min with GridSearchCV).
FIXED_RF_PARAMS = {
    "n_estimators":      200,   # Sufficient trees for stable predictions
    "max_depth":         25,    # Captures hourly demand patterns without over-deepening
    "min_samples_split": 3,     # Fine-grained decision boundaries
    "min_samples_leaf":  1,     # Pure leaves safe with log1p target transform
    "random_state":      42,    # Reproducibility
    "n_jobs":            -1,    # Parallelise across all CPU cores
    "verbose":           0,     # Suppress per-tree output
}


def cyclic_transform(X):
    """
    Add cyclic (sin/cos) encodings for hour and month columns.

    This matches the feature engineering in BikeRentalModel.ipynb Cell 13:
      hr_sin    = sin(2π × hr / 24)   — captures the circular day pattern
      hr_cos    = cos(2π × hr / 24)
      month_sin = sin(2π × mnth / 12) — captures annual seasonality
      month_cos = cos(2π × mnth / 12)

    These four columns are registered in NUMERICAL_FEATURES (preprocess.py)
    so they survive ColumnTransformer(remainder='drop') and are StandardScaled.
    """
    X_out = X.copy()
    if "hr" in X_out.columns:
        X_out["hr_sin"]    = np.sin(2 * np.pi * X_out["hr"] / 24)
        X_out["hr_cos"]    = np.cos(2 * np.pi * X_out["hr"] / 24)
    if "mnth" in X_out.columns:
        X_out["month_sin"] = np.sin(2 * np.pi * X_out["mnth"] / 12)
        X_out["month_cos"] = np.cos(2 * np.pi * X_out["mnth"] / 12)
    return X_out


def get_pipeline(preprocessor, model=None):
    """
    Assemble the full sklearn Pipeline:
        cyclic_transform → ColumnTransformer → TransformedTargetRegressor(RF, log1p)

    Used by both train_model() (default path) and any advanced callers.
    """
    if model is None:
        # Pre-optimized parameters — fastest path, no grid search needed.
        model = RandomForestRegressor(**FIXED_RF_PARAMS)

    return Pipeline(steps=[
        ("cyclic",       FunctionTransformer(cyclic_transform)),
        ("preprocessor", preprocessor),
        ("model",        TransformedTargetRegressor(
            regressor    = model,
            func         = np.log1p,   # stabilise heavy-tailed cnt distribution
            inverse_func = np.expm1,   # inverse back to raw bike counts
        )),
    ])


def train_model(df, feature_cols=None):
    """
    End-to-end Random Forest training using pre-optimized fixed hyperparameters.

    GridSearchCV has been intentionally removed.  The parameters in FIXED_RF_PARAMS
    were the consistent winners from prior searches on hour.csv and are hardcoded
    here so every training run completes in 30-60 s instead of 4-5 minutes.

    Steps
    -----
    1. Build ColumnTransformer from available features
    2. Chronological 80/20 train-test split (no temporal leakage)
    3. Fit Pipeline with pre-optimized RandomForestRegressor (single fit)
    4. Persist .joblib artefacts and return results

    Returns
    -------
    pipeline       : fitted sklearn Pipeline
    X_test         : held-out feature DataFrame (pre-pipeline, no cyclic cols)
    y_test         : held-out target Series
    model_path     : str — path of the timestamped .joblib file
    effective_feats: list[str] — feature columns as seen by the pipeline input
    """
    # ── 1. Resolve features & build preprocessor ──────────────────────────────
    preprocessor, effective_feats = build_preprocessor(df, feature_cols)

    # ── 2. Chronological train / test split ───────────────────────────────────
    X_train, X_test, y_train, y_test = chronological_split(
        df, effective_feats, test_frac=0.20
    )

    # ── 3. Build & fit pipeline with pre-optimized parameters ─────────────────
    print("\n[Training] Fitting RandomForestRegressor with pre-optimized parameters …")
    print(f"  Parameters   : {FIXED_RF_PARAMS}")
    print(f"  Training rows: {len(X_train)}  |  Test rows: {len(X_test)}")
    print(f"  Expected time: 30-60 seconds (no grid search)")

    pipeline = get_pipeline(preprocessor)  # uses FIXED_RF_PARAMS internally
    pipeline.fit(X_train, y_train)

    print("[Training] ✅ Fit complete")

    # ── 4. Persist artefact ───────────────────────────────────────────────────
    timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = os.path.join(MODELS_DIR, f"rf_model_{timestamp}.joblib")
    joblib.dump(pipeline, model_path)
    joblib.dump(pipeline, BEST_MODEL_PATH)
    print(f"  Saved to     : {model_path}\n")

    return pipeline, X_test, y_test, model_path, effective_feats
