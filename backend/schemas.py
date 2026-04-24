from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str


# ── ML ────────────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    season: int
    hr: Optional[int] = 0
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
    prediction_id: Optional[int] = None
    model_used: Optional[str] = None

class PredictionRecord(BaseModel):
    id: int
    input_features: Dict
    predicted_demand: int
    predicted_at: datetime

    class Config:
        from_attributes = True

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
    dataset_type: Optional[str] = "hourly"

class RunDetail(BaseModel):
    id: int
    created_at: datetime
    rmse: float
    mae: float
    r2_score: float
    features_used: List[str]
    feature_importance: Dict[str, float]
    dataset_type: Optional[str] = "hourly"
    model_path: str

class DashboardStats(BaseModel):
    total_predictions: int
    latest_prediction: Optional[int]
    total_training_runs: int
    best_r2: Optional[float]