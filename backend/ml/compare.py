"""
backend/ml/compare.py — Multi-model comparison (Stretch Goal).

Aligned with BikeRentalModel.ipynb Cell 26-28
----------------------------------------------
Notebook results (random split, no lags, n_estimators=150):
  RF   : R²=0.878, RMSE=62.08, MAE=40.40
  GB   : R²=0.827, RMSE=74.04, MAE=51.25
  Ridge: R²=0.589, RMSE=114.1, MAE=82.37

With our pipeline (chronological split + lag features + tuning),
all tree models are expected to significantly outperform these baselines.

Trains RandomForest, GradientBoosting, and ExtraTrees on the same
preprocessed train/test split and reports RMSE / MAE / R² for each.
"""

import time
from sklearn.base import clone
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.compose import TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
import numpy as np

from .evaluate import evaluate_model
from .model import cyclic_transform

# ── Candidate models ──────────────────────────────────────────────────────────
# All use consistent settings for a fair comparison.
# Wrapped in TransformedTargetRegressor with log1p for consistency with main RF.
CANDIDATE_MODELS = {
    "Random Forest":    RandomForestRegressor(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=200, max_depth=5, random_state=42),
    "Extra Trees":      ExtraTreesRegressor(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1),
}


def compare_models(preprocessor, X_train, X_test, y_train, y_test):
    """
    Train each candidate model on the same preprocessed data and compare metrics.

    Parameters
    ----------
    preprocessor : unfitted sklearn ColumnTransformer (cloned per model)
    X_train, X_test : raw feature DataFrames (pre-cyclic-transform)
    y_train, y_test : target Series

    Returns
    -------
    results : dict[str, dict] — model name → {rmse, mae, r2, elapsed_s, all_pass}
              sorted by R² descending (best model first).
    """
    results = {}

    for name, model in CANDIDATE_MODELS.items():
        # Each model gets its own clone of the full pipeline
        pipe = Pipeline([
            ("cyclic",       FunctionTransformer(cyclic_transform)),
            ("preprocessor", clone(preprocessor)),
            ("model",        TransformedTargetRegressor(
                regressor    = clone(model),
                func         = np.log1p,
                inverse_func = np.expm1,
            )),
        ])

        t0 = time.perf_counter()
        pipe.fit(X_train, y_train)
        elapsed = round(time.perf_counter() - t0, 2)

        rmse, mae, r2, ms = evaluate_model(pipe, X_test, y_test)

        results[name] = {
            "rmse":      round(rmse, 2),
            "mae":       round(mae, 2),
            "r2":        round(r2, 4),
            "elapsed_s": elapsed,
            "all_pass":  ms["all_pass"],
        }

    # Sort best → worst by R²
    return dict(sorted(results.items(), key=lambda kv: kv[1]["r2"], reverse=True))
