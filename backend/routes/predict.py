"""
backend/routes/predict.py — Demand prediction and dashboard aggregates.

Model loading priority
----------------------
1. Latest timestamped rf_model_*.joblib in the models/ directory.
2. Fall back to models/best_model.joblib (written on every training run).
3. Legacy: models/rf_model_*.pkl (migrated from older .pkl era).
"""

import glob
import os

import joblib
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.db.models import Prediction, TrainingRun
from backend.schemas import DashboardStats, PredictRequest, PredictResponse

router = APIRouter()

# ── Model loading ─────────────────────────────────────────────────────────────

def load_latest_model():
    """
    Locate and load the most recently saved model from disk.

    Prefers .joblib files; falls back to legacy .pkl files so old runs
    still work without re-training.

    Returns
    -------
    pipeline   : fitted sklearn Pipeline
    model_path : str — path of the loaded file
    """
    # 1. Check for timestamped .joblib files (current format)
    joblib_models = glob.glob("models/rf_model_*.joblib")
    if joblib_models:
        latest = max(joblib_models, key=os.path.getctime)
        return joblib.load(latest), latest

    # 2. Check for best_model.joblib symlink/copy
    best_joblib = "models/best_model.joblib"
    if os.path.exists(best_joblib):
        return joblib.load(best_joblib), best_joblib

    # 3. Legacy .pkl support
    pkl_models = glob.glob("models/rf_model_*.pkl")
    if pkl_models:
        latest = max(pkl_models, key=os.path.getctime)
        return joblib.load(latest), latest

    if os.path.exists("best_model.pkl"):
        return joblib.load("best_model.pkl"), "best_model.pkl"

    raise HTTPException(
        status_code=404,
        detail=(
            "No trained model found on disk. "
            "Please train a model first via POST /api/train."
        ),
    )


# ── Prediction endpoint ───────────────────────────────────────────────────────

@router.post("", response_model=PredictResponse)
async def predict(request: PredictRequest, db: AsyncSession = Depends(get_db)):
    """POST /api/predict — Run inference with the latest trained model."""
    pipeline, model_path = load_latest_model()

    # ── Build input DataFrame with all engineered features ────────────────────
    # The model was trained with additional features that must be computed here:
    #   is_rush_hour    — computed from hr
    #   temp_x_workday  — computed from temp × workingday
    #   lag features    — unknowable for a single point; imputed with the
    #                     dataset mean (~190 rides/hr), the same cold-start
    #                     fill used during training for the first rows.
    LAG_FILL = 190.0   # ≈ global hourly mean of the UCI hour.csv dataset

    raw = request.model_dump()
    hr  = raw["hr"]
    engineered = {
        "is_rush_hour":   1 if hr in (7, 8, 9, 17, 18, 19) else 0,
        "temp_x_workday": raw["temp"] * raw["workingday"],
        # Lag features — unknown at single-point prediction time.
        # Imputed with the dataset mean (same cold-start strategy used in training).
        # cnt_lag7 included for backward compat with models trained on daily data.
        "cnt_lag1":      LAG_FILL,
        "cnt_lag2":      LAG_FILL,
        "cnt_lag7":      LAG_FILL,
        "cnt_lag24":     LAG_FILL,
        "cnt_lag168":    LAG_FILL,
        "cnt_roll_mean": LAG_FILL,
    }

    input_df   = pd.DataFrame([{**raw, **engineered}])
    prediction = max(0, int(round(pipeline.predict(input_df)[0])))

    # Find the most recent training run for FK reference
    run_result = await db.execute(
        select(TrainingRun.id).order_by(TrainingRun.created_at.desc()).limit(1)
    )
    latest_run_id = run_result.scalar_one_or_none()

    # Persist prediction
    stmt = (
        insert(Prediction)
        .values(
            run_id           = latest_run_id,
            input_features   = request.model_dump(),
            predicted_demand = prediction,
        )
        .returning(Prediction.id)
    )
    result = await db.execute(stmt)
    await db.commit()
    pred_id = result.scalar()

    return PredictResponse(
        predicted_demand = prediction,
        prediction_id    = pred_id,
        model_used       = os.path.basename(model_path),
    )


# ── Prediction history ────────────────────────────────────────────────────────

@router.get("/history")
async def prediction_history(db: AsyncSession = Depends(get_db)):
    """GET /api/predict/history — Return the 50 most recent predictions."""
    result = await db.execute(
        select(Prediction).order_by(Prediction.predicted_at.desc()).limit(50)
    )
    rows = result.scalars().all()
    return [
        {
            "id":               r.id,
            "run_id":           r.run_id,
            "input_features":   r.input_features,
            "predicted_demand": r.predicted_demand,
            "predicted_at":     r.predicted_at,
        }
        for r in rows
    ]


# ── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """GET /api/predict/stats — Aggregated KPIs for the overview dashboard."""
    total_preds = (
        await db.execute(select(func.count()).select_from(Prediction))
    ).scalar()

    latest_pred = (
        await db.execute(
            select(Prediction.predicted_demand)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    total_runs = (
        await db.execute(select(func.count()).select_from(TrainingRun))
    ).scalar()

    best_r2 = (
        await db.execute(select(func.max(TrainingRun.r2_score)))
    ).scalar_one_or_none()

    # Count runs where all three metrics meet their thresholds
    # (stored as metrics_status->>'all_pass' == 'true' in JSONB)
    from sqlalchemy import cast, Boolean
    from sqlalchemy.dialects.postgresql import JSONB
    from sqlalchemy import text

    passing_runs = (
        await db.execute(
            select(func.count())
            .select_from(TrainingRun)
            .where(
                TrainingRun.metrics_status["all_pass"].as_boolean() == True  # noqa: E712
            )
        )
    ).scalar() or 0

    return DashboardStats(
        total_predictions             = total_preds or 0,
        latest_prediction             = latest_pred,
        total_training_runs           = total_runs or 0,
        best_r2                       = best_r2,
        runs_meeting_all_thresholds   = passing_runs,
    )