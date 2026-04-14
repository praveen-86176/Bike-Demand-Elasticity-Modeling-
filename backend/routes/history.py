from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.database import get_db
from backend.db.models import TrainingRun
from backend.schemas import RunSummary, RunDetail
from typing import List

router = APIRouter()

@router.get("", response_model=List[RunSummary])
async def get_runs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrainingRun).order_by(TrainingRun.created_at.desc()))
    runs = result.scalars().all()
    return [
        RunSummary(
            id            = r.id,
            created_at    = r.created_at,
            rmse          = r.rmse,
            mae           = r.mae,
            r2_score      = r.r2_score,
            features_used = r.features_used
        ) for r in runs
    ]

@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrainingRun).where(TrainingRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return RunDetail(
        id                 = run.id,
        created_at         = run.created_at,
        rmse               = run.rmse,
        mae                = run.mae,
        r2_score           = run.r2_score,
        features_used      = run.features_used,
        feature_importance = run.feature_importance,
        model_path         = run.model_path
    )