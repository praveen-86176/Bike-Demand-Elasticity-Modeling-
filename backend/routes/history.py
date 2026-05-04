"""
backend/routes/history.py — Training run history endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.db.models import TrainingRun
from backend.schemas import RunDetail, RunSummary

router = APIRouter()


@router.get("", response_model=List[RunSummary])
async def get_runs(db: AsyncSession = Depends(get_db)):
    """GET /api/runs — Return all training runs newest-first."""
    result = await db.execute(
        select(TrainingRun).order_by(TrainingRun.created_at.desc())
    )
    runs = result.scalars().all()
    return [
        RunSummary(
            id              = r.id,
            created_at      = r.created_at,
            rmse            = r.rmse,
            mae             = r.mae,
            r2_score        = r.r2_score,
            features_used   = r.features_used,
            dataset_type    = r.dataset_type,
            metrics_status  = r.metrics_status,
            top3_drivers    = r.top3_drivers,
            split_method    = r.split_method or "chronological",
            elapsed_seconds = r.elapsed_seconds,
        )
        for r in runs
    ]


@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: int, db: AsyncSession = Depends(get_db)):
    """GET /api/runs/{run_id} — Return full detail for a single training run."""
    result = await db.execute(
        select(TrainingRun).where(TrainingRun.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Training run #{run_id} not found")

    return RunDetail(
        id                 = run.id,
        created_at         = run.created_at,
        rmse               = run.rmse,
        mae                = run.mae,
        r2_score           = run.r2_score,
        features_used      = run.features_used,
        feature_importance = run.feature_importance,
        dataset_type       = run.dataset_type,
        model_path         = run.model_path,
        metrics_status     = run.metrics_status,
        top3_drivers       = run.top3_drivers,
        split_method       = run.split_method or "chronological",
        elapsed_seconds    = run.elapsed_seconds,
        elasticity         = run.elasticity,
    )