"""
backend/schemas.py — Pydantic request/response models for all API endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


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


# ── ML – Training ─────────────────────────────────────────────────────────────

class MetricThreshold(BaseModel):
    """Per-metric pass/fail status against defined success thresholds."""
    rmse_pass: bool
    mae_pass: bool
    r2_pass: bool
    rmse_threshold: float
    mae_threshold: float
    r2_threshold: float
    all_pass: bool


class TopDriver(BaseModel):
    """One entry in the top-3 demand drivers list."""
    rank: int
    feature: str
    importance: float


class TrainResponse(BaseModel):
    run_id: int
    rmse: float
    mae: float
    r2_score: float
    feature_importance: Dict[str, float]
    metrics_status: MetricThreshold
    top3_drivers: List[TopDriver]
    model_path: str
    elapsed_seconds: Optional[float] = None
    elasticity: Optional[Dict[str, float]] = None
    split_method: str = "chronological"
    # Stretch Goals
    shap_importance: Optional[Dict[str, float]] = None
    cv_scores: Optional[Dict[str, Any]] = None
    best_params: Optional[Dict[str, Any]] = None
    comparison_results: Optional[Dict[str, Any]] = None
    tuned: bool = False


# ── ML – Prediction ───────────────────────────────────────────────────────────

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
    input_features: Dict[str, Any]
    predicted_demand: int
    predicted_at: datetime

    class Config:
        from_attributes = True


# ── ML – Run history ─────────────────────────────────────────────────────────

class RunSummary(BaseModel):
    id: int
    created_at: datetime
    rmse: float
    mae: float
    r2_score: float
    features_used: List[str]
    dataset_type: Optional[str] = "hourly"
    metrics_status: Optional[Dict[str, Any]] = None
    top3_drivers: Optional[List[Dict[str, Any]]] = None
    split_method: Optional[str] = "chronological"
    elapsed_seconds: Optional[float] = None


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
    metrics_status: Optional[Dict[str, Any]] = None
    top3_drivers: Optional[List[Dict[str, Any]]] = None
    split_method: Optional[str] = "chronological"
    elapsed_seconds: Optional[float] = None
    elasticity: Optional[Dict[str, float]] = None
    # Stretch Goals
    shap_importance: Optional[Dict[str, float]] = None
    cv_scores: Optional[Dict[str, Any]] = None
    best_params: Optional[Dict[str, Any]] = None
    comparison_results: Optional[Dict[str, Any]] = None
    tuned: Optional[bool] = False


# ── Dashboard stats ───────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_predictions: int
    latest_prediction: Optional[int]
    total_training_runs: int
    best_r2: Optional[float]
    runs_meeting_all_thresholds: int = 0