from sqlalchemy import Column, Integer, Float, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .database import Base

class TrainingRun(Base):
    __tablename__ = "training_runs"

    id                 = Column(Integer, primary_key=True, index=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    features_used      = Column(JSONB, nullable=False)
    rmse               = Column(Float)
    mae                = Column(Float)
    r2_score           = Column(Float)
    feature_importance = Column(JSONB)
    model_path         = Column(Text)

class Prediction(Base):
    __tablename__ = "predictions"

    id               = Column(Integer, primary_key=True, index=True)
    run_id           = Column(Integer)
    input_features   = Column(JSONB, nullable=False)
    predicted_demand = Column(Integer)
    predicted_at     = Column(DateTime(timezone=True), server_default=func.now())