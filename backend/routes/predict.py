from fastapi import APIRouter, HTTPException
from backend.schemas import PredictRequest
import joblib
import os
import glob
import pandas as pd

router = APIRouter()

def load_latest_model():
    models = glob.glob("models/rf_model_*.pkl")
    if not models:
        raise HTTPException(status_code=404, detail="No trained model found. Train first.")
    latest = max(models, key=os.path.getctime)
    return joblib.load(latest)

@router.post("")
async def predict(request: PredictRequest):
    pipeline = load_latest_model()
    input_df = pd.DataFrame([request.model_dump()])
    prediction = pipeline.predict(input_df)
    return {"predicted_demand": int(prediction[0])}