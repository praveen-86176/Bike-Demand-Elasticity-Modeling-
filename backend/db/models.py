from sqlalchemy import Column, Integer, Float, Text, DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(Text, nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    password   = Column(Text, nullable=False)          # bcrypt hash
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
    dataset_type       = Column(String(20), server_default='hourly') # 'hourly' or 'daily'
    model_path         = Column(Text)


class Prediction(Base):
    __tablename__ = "predictions"

    id               = Column(Integer, primary_key=True, index=True)
    run_id           = Column(Integer)
    input_features   = Column(JSONB, nullable=False)
    predicted_demand = Column(Integer)
    predicted_at     = Column(DateTime(timezone=True), server_default=func.now())