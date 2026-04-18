import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

CATEGORICAL_FEATURES = ["season", "weathersit"]
NUMERICAL_FEATURES   = ["temp", "atemp", "hum", "windspeed"]
PASSTHROUGH_FEATURES = ["hr", "mnth", "holiday", "workingday", "weekday", "yr"]

ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES + PASSTHROUGH_FEATURES
TARGET       = "cnt"

def build_preprocessor():
    return ColumnTransformer(transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ("num", StandardScaler(),                       NUMERICAL_FEATURES),
        ("pas", "passthrough",                          PASSTHROUGH_FEATURES),
    ])

def load_and_clean(file_bytes: bytes) -> pd.DataFrame:
    from io import BytesIO
    df = pd.read_csv(BytesIO(file_bytes))

    # Drop columns not needed
    drop_cols = ["instant", "dteday", "casual", "registered"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # Drop rows with missing target
    df = df.dropna(subset=[TARGET])

    return df