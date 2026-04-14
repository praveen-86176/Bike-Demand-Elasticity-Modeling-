import joblib
import os
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from .preprocess import build_preprocessor, ALL_FEATURES, TARGET

MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def train_model(df, feature_cols=None):
    if feature_cols is None:
        feature_cols = ALL_FEATURES

    # Filter only available columns
    feature_cols = [f for f in feature_cols if f in df.columns]

    X = df[feature_cols]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocessor = build_preprocessor()

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        ))
    ])

    pipeline.fit(X_train, y_train)

    # Save model with timestamp
    timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_path = os.path.join(MODELS_DIR, f"rf_model_{timestamp}.pkl")
    joblib.dump(pipeline, model_path)

    return pipeline, X_test, y_test, model_path, feature_cols