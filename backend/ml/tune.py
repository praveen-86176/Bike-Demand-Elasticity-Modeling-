"""
backend/ml/tune.py — Hyperparameter tuning with GridSearchCV + TimeSeriesSplit.

Stretch Goal: Hyperparameter tuning + TimeSeries cross-validation
------------------------------------------------------------------
Uses a compact parameter grid so tuning completes in ≈ 15-30 s on 5 000 rows.
TimeSeriesSplit is used instead of random K-Fold to respect temporal order and
prevent data leakage between CV folds (same rationale as chronological_split).

Tuning is *optional* — the user can enable it via the Training form.
"""

import numpy as np
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

# ── Compact search grid — 24 combos × 3 folds = 72 fits (parallelised) ───────
PARAM_GRID = {
    "model__regressor__n_estimators":      [150, 200, 300],
    "model__regressor__max_depth":         [20, 25, None],
    "model__regressor__min_samples_split": [2, 3],
    "model__regressor__min_samples_leaf":  [1, 2],
}
N_CV_SPLITS = 3   # TimeSeriesSplit — no leakage; 3 folds balances fold-size vs speed


def tune_hyperparameters(pipeline, X_train, y_train):
    """
    Run GridSearchCV with TimeSeriesSplit to find the best RF hyperparameters.

    Parameters
    ----------
    pipeline : unfitted sklearn Pipeline (preprocessor + RandomForest)
    X_train  : training features (chronologically ordered)
    y_train  : training target

    Returns
    -------
    best_pipeline : fitted Pipeline with best hyperparameters
    best_params   : dict — winning hyperparameter values
    cv_scores     : dict — per-split RMSE and mean RMSE across folds
    """
    tscv = TimeSeriesSplit(n_splits=N_CV_SPLITS)

    search = GridSearchCV(
        estimator  = pipeline,
        param_grid = PARAM_GRID,
        cv         = tscv,
        scoring    = "neg_root_mean_squared_error",
        n_jobs     = -1,   # use all CPU cores
        refit      = True, # refit best params on full training set
        verbose    = 0,
    )
    search.fit(X_train, y_train)

    # Extract per-split RMSE for the best parameter combination
    best_idx     = search.best_index_
    split_scores = []
    for i in range(N_CV_SPLITS):
        key = f"split{i}_test_score"
        if key in search.cv_results_:
            split_scores.append(round(float(-search.cv_results_[key][best_idx]), 2))

    cv_scores = {
        "mean_rmse":    round(float(-search.best_score_), 2),
        "split_rmse":   split_scores,
        "n_splits":     N_CV_SPLITS,
        "scoring":      "RMSE (neg_root_mean_squared_error)",
    }

    # Strip the "model__regressor__" prefix so params are human-readable
    best_params = {
        k.replace("model__regressor__", ""): v
        for k, v in search.best_params_.items()
    }

    return search.best_estimator_, best_params, cv_scores
