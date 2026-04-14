from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from backend.db.database import get_db
from backend.db.models import TrainingRun
from backend.ml.model import train_model
from backend.ml.evaluate import evaluate_model, get_feature_importance
from backend.ml.preprocess import load_and_clean
from backend.schemas import TrainResponse
from typing import List, Optional

router = APIRouter()

@router.post("", response_model=TrainResponse)
async def train(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        file_bytes = await file.read()
        df = load_and_clean(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV error: {str(e)}")

    try:
        pipeline, X_test, y_test, model_path, feature_cols = train_model(df)
        rmse, mae, r2 = evaluate_model(pipeline, X_test, y_test)
        importance     = get_feature_importance(pipeline, X_test, y_test, feature_cols)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

    # Save run to PostgreSQL
    stmt = insert(TrainingRun).values(
        features_used      = feature_cols,
        rmse               = rmse,
        mae                = mae,
        r2_score           = r2,
        feature_importance = importance,
        model_path         = model_path
    ).returning(TrainingRun.id)

    result = await db.execute(stmt)
    await db.commit()
    run_id = result.scalar()

    return TrainResponse(
        run_id             = run_id,
        rmse               = rmse,
        mae                = mae,
        r2_score           = r2,
        feature_importance = importance
    )