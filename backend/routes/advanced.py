"""
backend/routes/advanced.py — Report export and model comparison endpoints.

Stretch Goals
-------------
• GET /api/runs/{id}/report?format=json|csv  → Exportable model performance report
• GET /api/runs/{id}/comparison               → Multi-model comparison results for a run
"""

import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.db.models import TrainingRun

router = APIRouter()


# ── Report export ─────────────────────────────────────────────────────────────

@router.get("/{run_id}/report")
async def export_report(
    run_id: int,
    format: str = "json",          # "json" | "csv"
    db: AsyncSession = Depends(get_db),
):
    """
    Export a full model performance report for a training run.

    Formats
    -------
    json  : structured JSON (default) — good for programmatic use
    csv   : flat CSV — good for spreadsheets / stakeholder sharing

    Stretch Goal: Exportable model performance reports
    """
    result = await db.execute(select(TrainingRun).where(TrainingRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Training run #{run_id} not found")

    # ── Build report dict ──────────────────────────────────────────────────────
    report = {
        "run_id":         run.id,
        "generated_at":   datetime.utcnow().isoformat() + "Z",
        "dataset_type":   run.dataset_type or "hourly",
        "split_method":   run.split_method or "chronological",
        "features_used":  run.features_used or [],
        "metrics": {
            "rmse":     run.rmse,
            "mae":      run.mae,
            "r2_score": run.r2_score,
        },
        "success_targets": {
            "rmse_target": "≤ 45",
            "mae_target":  "≤ 30",
            "r2_target":   "≥ 0.85",
        },
        "metrics_status":     run.metrics_status or {},
        "top3_drivers":       run.top3_drivers or [],
        "feature_importance": run.feature_importance or {},
        "elasticity":         run.elasticity or {},
        "shap_importance":    run.shap_importance or {},
        "cv_scores":          run.cv_scores or {},
        "best_params":        run.best_params or {},
        "comparison_results": run.comparison_results or {},
        "elapsed_seconds":    run.elapsed_seconds,
        "model_path":         run.model_path,
        "created_at":         run.created_at.isoformat() if run.created_at else None,
    }

    if format.lower() == "csv":
        return _report_as_csv(report, run_id)

    # Default: JSON download
    content = json.dumps(report, indent=2)
    return Response(
        content    = content,
        media_type = "application/json",
        headers    = {
            "Content-Disposition": f'attachment; filename="run_{run_id}_report.json"'
        },
    )


def _report_as_csv(report: dict, run_id: int) -> StreamingResponse:
    """Flatten the report into a CSV with key/value rows."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Field", "Value"])
    writer.writerow(["run_id",         report["run_id"]])
    writer.writerow(["generated_at",   report["generated_at"]])
    writer.writerow(["dataset_type",   report["dataset_type"]])
    writer.writerow(["split_method",   report["split_method"]])
    writer.writerow(["features_used",  ", ".join(report["features_used"])])
    writer.writerow([])

    writer.writerow(["--- METRICS ---", ""])
    writer.writerow(["RMSE",     report["metrics"]["rmse"]])
    writer.writerow(["MAE",      report["metrics"]["mae"]])
    writer.writerow(["R²",       report["metrics"]["r2_score"]])
    writer.writerow([])

    writer.writerow(["--- SUCCESS TARGETS ---", ""])
    for k, v in report["success_targets"].items():
        writer.writerow([k, v])
    writer.writerow([])

    writer.writerow(["--- TOP 3 DEMAND DRIVERS ---", ""])
    for d in report["top3_drivers"]:
        writer.writerow([f"#{d.get('rank')} {d.get('feature')}", d.get("importance")])
    writer.writerow([])

    writer.writerow(["--- FEATURE IMPORTANCE ---", ""])
    for feat, imp in report["feature_importance"].items():
        writer.writerow([feat, imp])
    writer.writerow([])

    if report["shap_importance"]:
        writer.writerow(["--- SHAP IMPORTANCE ---", ""])
        for feat, val in report["shap_importance"].items():
            writer.writerow([feat, val])
        writer.writerow([])

    if report["cv_scores"]:
        writer.writerow(["--- CV SCORES (TimeSeriesSplit) ---", ""])
        for k, v in report["cv_scores"].items():
            writer.writerow([k, v])
        writer.writerow([])

    if report["best_params"]:
        writer.writerow(["--- BEST HYPERPARAMETERS ---", ""])
        for k, v in report["best_params"].items():
            writer.writerow([k, v])
        writer.writerow([])

    if report["comparison_results"]:
        writer.writerow(["--- MODEL COMPARISON ---", "RMSE", "MAE", "R²", "Time(s)"])
        for model_name, res in report["comparison_results"].items():
            writer.writerow([model_name, res["rmse"], res["mae"], res["r2"], res["elapsed_s"]])
        writer.writerow([])

    writer.writerow(["elapsed_seconds", report["elapsed_seconds"]])
    writer.writerow(["model_path",      report["model_path"]])
    writer.writerow(["created_at",      report["created_at"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type = "text/csv",
        headers    = {
            "Content-Disposition": f'attachment; filename="run_{run_id}_report.csv"'
        },
    )


# ── Model comparison retrieval ────────────────────────────────────────────────

@router.get("/{run_id}/comparison")
async def get_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    """Return the stored multi-model comparison results for a training run."""
    result = await db.execute(select(TrainingRun).where(TrainingRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail=f"Training run #{run_id} not found")

    return {
        "run_id":             run.id,
        "comparison_results": run.comparison_results or {},
        "shap_importance":    run.shap_importance or {},
        "cv_scores":          run.cv_scores or {},
        "best_params":        run.best_params or {},
        "tuned":              run.tuned or False,
    }
