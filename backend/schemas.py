from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

class PredictRequest(BaseModel):
    season: int
    hr: int
    holiday: int
    workingday: int
    weathersit: int
    temp: float
    atemp: float
    hum: float
    windspeed: float
    mnth: int
    weekday: int
    yr: int = 1

class PredictResponse(BaseModel):
    predicted_demand: int
    model_used: Optional[str] = None

class TrainResponse(BaseModel):
    run_id: int
    rmse: float
    mae: float
    r2_score: float
    feature_importance: Dict[str, float]

class RunSummary(BaseModel):
    id: int
    created_at: datetime
    rmse: float
    mae: float
    r2_score: float
    features_used: List[str]

class RunDetail(BaseModel):
    id: int
    created_at: datetime
    rmse: float
    mae: float
    r2_score: float
    features_used: List[str]
    feature_importance: Dict[str, float]
    model_path: str