"""
backend/routes/predict.py — Predict demand and persist result to DB
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, func
from backend.db.database import get_db
from backend.db.models import Prediction, TrainingRun
from backend.schemas import PredictRequest, PredictResponse, DashboardStats
import joblib
import os
import glob
import pandas as pd

router = APIRouter()


def load_latest_model():
    """Load the most recently trained model from disk."""
    models = glob.glob("models/rf_model_*.pkl")
    if not models:
        # Fall back to best_model.pkl in project root
        if os.path.exists("best_model.pkl"):
            return joblib.load("best_model.pkl"), "best_model.pkl"
        raise HTTPException(
            status_code=404,
            detail="No trained model found. Please train the model first via POST /train"
        )
    latest = max(models, key=os.path.getctime)
    return joblib.load(latest), latest


@router.post("", response_model=PredictResponse)
async def predict(request: PredictRequest, db: AsyncSession = Depends(get_db)):
    pipeline, model_path = load_latest_model()

    input_df = pd.DataFrame([request.model_dump()])
    prediction = int(pipeline.predict(input_df)[0])

    # Find latest training run id for FK reference
    run_result = await db.execute(
        select(TrainingRun.id).order_by(TrainingRun.created_at.desc()).limit(1)
    )
    latest_run_id = run_result.scalar_one_or_none()

    # Persist prediction to DB
    stmt = (
        insert(Prediction)
        .values(
            run_id=latest_run_id,
            input_features=request.model_dump(),
            predicted_demand=prediction,
        )
        .returning(Prediction.id)
    )
    result = await db.execute(stmt)
    await db.commit()
    pred_id = result.scalar()

    return PredictResponse(
        predicted_demand=prediction,
        prediction_id=pred_id,
        model_used=os.path.basename(model_path),
    )


@router.get("/history")
async def prediction_history(db: AsyncSession = Depends(get_db)):
    """Return the 50 most recent predictions."""
    result = await db.execute(
        select(Prediction).order_by(Prediction.predicted_at.desc()).limit(50)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "run_id": r.run_id,
            "input_features": r.input_features,
            "predicted_demand": r.predicted_demand,
            "predicted_at": r.predicted_at,
        }
        for r in rows
    ]


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate stats for the dashboard."""
    total_preds = (await db.execute(select(func.count()).select_from(Prediction))).scalar()
    latest_pred = (
        await db.execute(
            select(Prediction.predicted_demand)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    total_runs = (await db.execute(select(func.count()).select_from(TrainingRun))).scalar()
    best_r2 = (await db.execute(select(func.max(TrainingRun.r2_score)))).scalar_one_or_none()

    return DashboardStats(
        total_predictions=total_preds or 0,
        latest_prediction=latest_pred,
        total_training_runs=total_runs or 0,
        best_r2=best_r2,
    )