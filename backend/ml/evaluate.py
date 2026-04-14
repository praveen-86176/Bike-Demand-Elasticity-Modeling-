import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.inspection import permutation_importance

def evaluate_model(pipeline, X_test, y_test):
    y_pred = pipeline.predict(X_test)

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae  = float(mean_absolute_error(y_test, y_pred))
    r2   = float(r2_score(y_test, y_pred))

    return rmse, mae, r2

def get_feature_importance(pipeline, X_test, y_test, feature_cols):
    result = permutation_importance(
        pipeline, X_test, y_test,
        n_repeats=10,
        random_state=42,
        n_jobs=-1
    )

    importance_dict = {
        feature_cols[i]: round(float(result.importances_mean[i]), 4)
        for i in range(len(feature_cols))
    }

    # Sort by importance descending
    importance_dict = dict(
        sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
    )

    return importance_dict