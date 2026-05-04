"""
backend/db/models.py — SQLAlchemy ORM table definitions.
"""

from sqlalchemy import Column, Integer, Float, Text, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(Text, nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    password   = Column(Text, nullable=False)           # bcrypt hash
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id                 = Column(Integer, primary_key=True, index=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    features_used      = Column(JSONB, nullable=False)
    rmse               = Column(Float)
    mae                = Column(Float)
    r2_score           = Column(Float)
    feature_importance = Column(JSONB)
    dataset_type       = Column(String(20), server_default="hourly")  # 'hourly' | 'daily'
    model_path         = Column(Text)
    # Success-metric pass/fail snapshot (Risk 5.2 ① benchmark validation)
    metrics_status     = Column(JSONB)
    # Top-3 demand drivers at training time
    top3_drivers       = Column(JSONB)
    # Dependency 5.2 ② — elasticity coefficients per continuous feature
    elasticity         = Column(JSONB)
    # Risk 5.1 ③ — wall-clock training time in seconds (efficiency tracking)
    elapsed_seconds    = Column(Float)
    # Risk 5.1 ① — split strategy used; always 'chronological' from v2 onward
    split_method       = Column(String(20), server_default="chronological")
    # Stretch Goal: SHAP-based feature importance
    shap_importance    = Column(JSONB)
    # Stretch Goal: TimeSeriesSplit cross-validation scores
    cv_scores          = Column(JSONB)
    # Stretch Goal: GridSearchCV best hyperparameters
    best_params        = Column(JSONB)
    # Stretch Goal: Multi-model comparison results
    comparison_results = Column(JSONB)
    # Whether this run used hyperparameter tuning
    tuned              = Column(String(5), server_default="false")  # 'true' | 'false'


class Prediction(Base):
    __tablename__ = "predictions"

    id               = Column(Integer, primary_key=True, index=True)
    run_id           = Column(Integer)
    input_features   = Column(JSONB, nullable=False)
    predicted_demand = Column(Integer)
    predicted_at     = Column(DateTime(timezone=True), server_default=func.now())