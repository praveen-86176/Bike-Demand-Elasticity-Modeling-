"""
backend/routes/train.py — Full automated end-to-end training pipeline.

Pipeline steps (all stretch goals are optional — enabled via form params)
--------------------------------------------------------------------------
1.  Parse & validate the uploaded CSV
2.  Automated preprocessing (preprocess.py)
3.  Chronological train/test split (no leakage)
4.  [Optional] GridSearchCV + TimeSeriesSplit hyperparameter tuning (tune.py)
    — enabled when form field  tune="true"
5.  Train Random Forest Regression model (model.py / tune.py)
6.  Evaluate RMSE / MAE / R² vs success thresholds (evaluate.py)
7.  Permutation feature importance → top-3 demand drivers (evaluate.py)
8.  Demand elasticity estimation (evaluate.py)
9.  [Stretch] SHAP-based explainability (shap_explain.py)
10. [Optional] Multi-model comparison — RF vs GB vs ExtraTrees (compare.py)
    — enabled when form field  compare="true"
11. Persist all results to PostgreSQL (db/models.py)
12. Return rich TrainResponse
"""

import json
import time
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.db.models import TrainingRun
from backend.ml.compare import compare_models
from backend.ml.evaluate import (
    compute_elasticity,
    evaluate_model,
    get_feature_importance,
    get_top3_drivers,
)
from backend.ml.model import train_model
from backend.ml.preprocess import build_preprocessor, chronological_split, load_and_clean
from backend.ml.shap_explain import compute_shap_importance
from backend.ml.tune import tune_hyperparameters
from backend.schemas import TrainResponse

router = APIRouter()

MAX_TRAINING_ROWS = 20_000   # Use full dataset for maximum precision
SPLIT_METHOD      = "chronological"


@router.post("", response_model=TrainResponse)
async def train(
    file:    UploadFile       = File(...),
    features: Optional[str]  = Form(None),   # JSON array of feature names
    tune:     Optional[str]  = Form("false"), # "true" → GridSearchCV + TimeSeriesSplit
    compare:  Optional[str]  = Form("false"), # "true" → multi-model comparison
    db:       AsyncSession    = Depends(get_db),
):
    """
    POST /api/train

    Accepts
    -------
    file     : CSV file (hour.csv or day.csv from UCI Bike Sharing dataset)
    features : optional JSON array of feature names to use
    tune     : "true" to enable GridSearchCV hyperparameter tuning (slower)
    compare  : "true" to run multi-model comparison (RF / GB / ExtraTrees)
    """
    enable_tune    = (tune    or "").lower() == "true"
    enable_compare = (compare or "").lower() == "true"

    # ── 1. Parse optional feature list ────────────────────────────────────────
    selected_features = None
    if features:
        try:
            selected_features = json.loads(features)
        except (json.JSONDecodeError, ValueError):
            pass  # fall back to auto-detect all features

    # ── 2. Load & clean CSV ───────────────────────────────────────────────────
    try:
        file_bytes = await file.read()
        df = load_and_clean(file_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV error: {exc}") from exc

    # Ensure engineered features (lags) are included if they exist
    engineered_feats = ["cnt_lag1", "cnt_lag2", "cnt_lag7", "cnt_lag24", "cnt_lag168", "cnt_roll_mean"]
    if selected_features:
        # Keep selected features + any engineered lags present in df
        selected_features = [f for f in selected_features if f in df.columns]
        for ef in engineered_feats:
            if ef in df.columns and ef not in selected_features:
                selected_features.append(ef)
        
        if not selected_features:
            selected_features = None

    # Cap dataset size — keep the most recent rows (preserves chronological order)
    if len(df) > MAX_TRAINING_ROWS:
        df = df.iloc[-MAX_TRAINING_ROWS:]

    # ── 3. Train Model ────────────────────────────────────────────────────────
    t_start     = time.perf_counter()
    cv_scores   = {}
    best_params = {}

    try:
        if enable_tune:
            # GridSearchCV + TimeSeriesSplit — finds best hyperparameters
            from backend.ml.model import get_pipeline
            preprocessor, feature_cols = build_preprocessor(df, selected_features)
            X_train, X_test, y_train, y_test = chronological_split(df, feature_cols, test_frac=0.2)

            base_pipeline = get_pipeline(preprocessor)
            pipeline, best_params, cv_scores = tune_hyperparameters(
                base_pipeline, X_train, y_train
            )
        else:
            # train_model now handles splitting and return X_test/y_test internally
            pipeline, X_test, y_test, model_path, feature_cols = train_model(
                df, feature_cols=selected_features
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Training error: {exc}") from exc
    dataset_type = "hourly" if "hr" in df.columns else "daily"

    # Save model artefact when tuning was used (train_model already saves for default path)
    if enable_tune:
        import os, joblib
        from datetime import datetime
        os.makedirs("models", exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = os.path.join("models", f"rf_model_{ts}.joblib")
        joblib.dump(pipeline, model_path)
        joblib.dump(pipeline, os.path.join("models", "best_model.joblib"))

    # ── 4. Evaluate metrics ───────────────────────────────────────────────────
    try:
        # X_test contains only the original df columns (hr_sin/hr_cos are added
        # inside the pipeline by cyclic_transform). Use actual column list for
        # permutation importance labeling to avoid index mismatches.
        eval_feature_cols = X_test.columns.tolist()
        rmse, mae, r2, metrics_status = evaluate_model(pipeline, X_test, y_test)
        importance   = get_feature_importance(pipeline, X_test, y_test, eval_feature_cols)
        top3_drivers = get_top3_drivers(importance)
        elasticity   = compute_elasticity(pipeline, X_test, eval_feature_cols)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {exc}") from exc

    elapsed = round(time.perf_counter() - t_start, 2)

    # ── 7. SHAP explainability (always attempted, fails gracefully) ───────────
    shap_importance = compute_shap_importance(pipeline, X_test, eval_feature_cols)

    # ── 8. Multi-model comparison (optional) ──────────────────────────────────
    comparison_results = {}
    if enable_compare:
        try:
            comparison_results = compare_models(
                preprocessor, X_train, X_test, y_train, y_test
            )
        except Exception:
            comparison_results = {}   # non-fatal

    # ── 9. Persist to PostgreSQL ──────────────────────────────────────────────
    stmt = (
        insert(TrainingRun)
        .values(
            features_used      = eval_feature_cols,
            rmse               = rmse,
            mae                = mae,
            r2_score           = r2,
            feature_importance = importance,
            dataset_type       = dataset_type,
            model_path         = model_path,
            metrics_status     = metrics_status,
            top3_drivers       = top3_drivers,
            elasticity         = elasticity,
            elapsed_seconds    = elapsed,
            split_method       = SPLIT_METHOD,
            shap_importance    = shap_importance,
            cv_scores          = cv_scores,
            best_params        = best_params,
            comparison_results = comparison_results,
            tuned              = "true" if enable_tune else "false",
        )
        .returning(TrainingRun.id)
    )
    result = await db.execute(stmt)
    await db.commit()
    run_id = result.scalar()

    # ── 10. Return response ───────────────────────────────────────────────────
    return TrainResponse(
        run_id             = run_id,
        rmse               = rmse,
        mae                = mae,
        r2_score           = r2,
        feature_importance = importance,
        metrics_status     = metrics_status,
        top3_drivers       = top3_drivers,
        model_path         = model_path,
        elapsed_seconds    = elapsed,
        elasticity         = elasticity,
        split_method       = SPLIT_METHOD,
        shap_importance    = shap_importance,
        cv_scores          = cv_scores,
        best_params        = best_params,
        comparison_results = comparison_results,
        tuned              = enable_tune,
    )