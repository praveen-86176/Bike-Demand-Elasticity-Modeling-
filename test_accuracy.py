import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, FunctionTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

df = pd.read_csv('hour.csv')

CATEGORICAL_FEATURES = ["season", "weathersit"]
NUMERICAL_FEATURES   = ["temp", "atemp", "hum", "windspeed", "hr_sin", "hr_cos", "month_sin", "month_cos", "day_of_week_sin", "day_of_week_cos", "temp_x_workday", "temp_x_humidity", "wind_x_weather", "is_rush_hour", "is_weekend"]
PASSTHROUGH_FEATURES = ["holiday", "workingday", "hr", "mnth", "weekday"]

def feature_engineering(X):
    df = X.copy()
    if "hr" in df.columns:
        df["hr_sin"] = np.sin(2 * np.pi * df["hr"] / 24)
        df["hr_cos"] = np.cos(2 * np.pi * df["hr"] / 24)
        df["is_rush_hour"] = (df["hr"].isin(range(7, 10)) | df["hr"].isin(range(17, 20))).astype(int)

    if "mnth" in df.columns:
        df["month_sin"] = np.sin(2 * np.pi * df["mnth"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["mnth"] / 12)

    if "weekday" in df.columns:
        df["day_of_week_sin"] = np.sin(2 * np.pi * df["weekday"] / 7)
        df["day_of_week_cos"] = np.cos(2 * np.pi * df["weekday"] / 7)
        df["is_weekend"] = (df["weekday"] >= 5).astype(int)

    df["temp_x_workday"]  = df["temp"] * df["workingday"]
    df["temp_x_humidity"] = df["temp"] * df["hum"]
    df["wind_x_weather"]  = df["windspeed"] * df["weathersit"]
    
    return df

ALL_FEATURES = CATEGORICAL_FEATURES + ["temp", "atemp", "hum", "windspeed"] + PASSTHROUGH_FEATURES

X = df[ALL_FEATURES]
y = df['cnt']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

fe_transformer = FunctionTransformer(feature_engineering, validate=False)
col_trans = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ("num", StandardScaler(), NUMERICAL_FEATURES),
    ("pas", "passthrough", PASSTHROUGH_FEATURES),
])

preprocessor = Pipeline([
    ('fe', fe_transformer),
    ('col', col_trans)
])

# Random Forest
rf = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
])

rf.fit(X_train, y_train)
preds = rf.predict(X_test)

print(f"R2: {r2_score(y_test, preds):.4f}")
print(f"RMSE: {mean_squared_error(y_test, preds)**0.5:.4f}")
print(f"MAE: {mean_absolute_error(y_test, preds):.4f}")
