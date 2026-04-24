import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

CATEGORICAL_FEATURES = ["season", "weathersit"]
NUMERICAL_FEATURES   = ["temp", "atemp", "hum", "windspeed"]
# "hr" is optional and will be added only if present in the dataset
PASSTHROUGH_FEATURES = ["mnth", "holiday", "workingday", "weekday", "yr"]

TARGET = "cnt"

def build_preprocessor(df: pd.DataFrame, feature_cols=None):
    """
    Dynamically build preprocessor based on available columns in the dataframe
    or requested feature columns.
    """
    if feature_cols is None:
        feature_cols = [c for c in (CATEGORICAL_FEATURES + NUMERICAL_FEATURES + PASSTHROUGH_FEATURES + ["hr"]) if c in df.columns]

    cat_cols = [c for c in CATEGORICAL_FEATURES if c in feature_cols]
    num_cols = [c for c in NUMERICAL_FEATURES if c in feature_cols]
    pas_cols = [c for c in (PASSTHROUGH_FEATURES + ["hr"]) if c in feature_cols]

    transformers = []
    if cat_cols:
        transformers.append(("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols))
    if num_cols:
        transformers.append(("num", StandardScaler(), num_cols))
    if pas_cols:
        transformers.append(("pas", "passthrough", pas_cols))

    return ColumnTransformer(transformers=transformers), feature_cols

def load_and_clean(file_bytes: bytes) -> pd.DataFrame:
    from io import BytesIO
    df = pd.read_csv(BytesIO(file_bytes))

    # Drop columns not needed
    drop_cols = ["instant", "dteday", "casual", "registered"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # Drop rows with missing target
    df = df.dropna(subset=[TARGET])

    return df