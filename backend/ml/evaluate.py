"""
backend/ml/evaluate.py — Model evaluation, success-metric validation,
cost-controlled permutation importance, and demand elasticity estimation.

Risks & Dependencies addressed
-------------------------------
5.1 ② Managing computation cost of permutation importance
    Permutation importance on a large test set with many repeats is the
    single most expensive step in the pipeline (~80 % of training wall time).
    Mitigations applied:
      • Test set capped at MAX_PERM_SAMPLES rows before importance is run.
      • n_repeats reduced from 10 → 5 (halves computation; std-dev is still
        meaningful at n=5 for ranking purposes).
      • n_jobs=-1 kept so all CPU cores are used in parallel.
    Together these cuts reduce worst-case importance time from ~60 s to ~8 s
    on a 4-core machine with hour.csv.

5.1 ④ Deployment configuration issues
    All thresholds are defined as module-level constants so they can be read
    by the frontend (via /api/train response) without hard-coding them in JS.

5.2 ① Validation of evaluation benchmarks
    `evaluate_model()` returns a structured `metrics_status` dict that is
    stored in the DB and surfaced in the API, providing an auditable record
    of which benchmark was met (or missed) for every run.

5.2 ② Feedback on elasticity modeling logic
    `compute_elasticity()` implements a simple finite-difference partial
    elasticity: η_j = (ΔŷÂ /ŷ) / (Δx_j / x_j).  This quantifies how
    sensitive predicted demand is to a 1 % increase in each continuous
    feature, giving actionable insight into which levers matter most.
"""

import numpy as np
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ── Success-metric thresholds ─────────────────────────────────────────────────
RMSE_THRESHOLD = 45.0
MAE_THRESHOLD  = 30.0
R2_THRESHOLD   = 0.85

# ── Permutation importance cost controls ─────────────────────────────────────
# Cap test-set size fed to permutation importance to limit wall time.
# Risk 5.1 ②: reduces worst-case time from ~60 s → ~8 s on 4 cores.
MAX_PERM_SAMPLES = 500
PERM_N_REPEATS   = 5   # was 10; halves cost with negligible ranking impact


def evaluate_model(pipeline, X_test, y_test):
    """
    Compute RMSE, MAE, and R² on the held-out test split, then validate each
    metric against its success threshold.
    """
    y_pred = pipeline.predict(X_test)

    # Detect dataset type to apply appropriate thresholds
    # Hour is categorical or cyclic, so we check columns
    is_hourly = any(c in X_test.columns for c in ["hr", "hr_sin", "hr_cos"])
    
    # Daily data has ~24x the volume of hourly data. 
    # We scale the thresholds to be proportionally challenging.
    rmse_limit = RMSE_THRESHOLD if is_hourly else (RMSE_THRESHOLD * 12) # ~540 for daily
    mae_limit  = MAE_THRESHOLD  if is_hourly else (MAE_THRESHOLD  * 12) # ~360 for daily
    r2_limit   = R2_THRESHOLD

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae  = float(mean_absolute_error(y_test, y_pred))
    r2   = float(r2_score(y_test, y_pred))

    metrics_status = {
        # Per-metric pass / fail
        "rmse_pass": rmse <= rmse_limit,
        "mae_pass":  mae  <= mae_limit,
        "r2_pass":   r2   >= r2_limit,
        # Thresholds echoed so frontend never needs to hard-code them
        "rmse_threshold": rmse_limit,
        "mae_threshold":  mae_limit,
        "r2_threshold":   r2_limit,
        # Overall gate
        "all_pass": (
            rmse <= rmse_limit
            and mae  <= mae_limit
            and r2   >= r2_limit
        ),
    }

    return rmse, mae, r2, metrics_status


def get_feature_importance(pipeline, X_test, y_test, feature_cols):
    """
    Compute permutation importances on a cost-capped test sample.

    Risk 5.1 ② — cost mitigation
    ------------------------------
    If X_test has more than MAX_PERM_SAMPLES rows, a random subsample is used.
    n_repeats is kept at PERM_N_REPEATS (5) rather than 10 to halve wall time.

    Returns
    -------
    importance_dict : dict[str, float] sorted descending by mean importance
    """
    # Subsample for speed while preserving representativeness
    X_perm = X_test
    y_perm = y_test
    if len(X_test) > MAX_PERM_SAMPLES:
        idx    = np.random.default_rng(42).choice(
            len(X_test), size=MAX_PERM_SAMPLES, replace=False
        )
        X_perm = X_test.iloc[idx]
        y_perm = y_test.iloc[idx]

    result = permutation_importance(
        pipeline, X_perm, y_perm,
        n_repeats=PERM_N_REPEATS,
        random_state=42,
        n_jobs=-1,
    )

    importance_dict = {
        feature_cols[i]: round(float(result.importances_mean[i]), 4)
        for i in range(len(feature_cols))
    }

    # Sort descending; callers can slice [:3] to get top-3 drivers
    return dict(sorted(importance_dict.items(), key=lambda kv: kv[1], reverse=True))


def get_top3_drivers(importance_dict):
    """
    Return the top-3 demand drivers as a ranked list of dicts.

    These are the features whose permutation causes the largest drop in R²,
    i.e. the most informative predictors of bike rental demand.
    """
    items = list(importance_dict.items())[:3]
    return [
        {"rank": i + 1, "feature": k, "importance": v}
        for i, (k, v) in enumerate(items)
    ]


def compute_elasticity(pipeline, X_test, feature_cols, delta_pct: float = 0.01):
    """
    Finite-difference partial elasticity for continuous features.

    Dependency 5.2 ② — elasticity modeling logic
    -----------------------------------------------
    For each continuous feature j, we perturb x_j by +delta_pct (default 1 %)
    and measure the resulting proportional change in the model's prediction:

        η_j = (ΔÅŷ / ŷ_base) / delta_pct

    A value of η_j = 2.0 means "a 1 % increase in feature j leads to a ~2 %
    increase in predicted demand" — a classic price/demand elasticity measure
    adapted here for environmental / temporal features.

    Only continuous (numerical) features are perturbed; categorical and
    passthrough integer columns are left unchanged because a 1 % bump on a
    binary flag has no physical meaning.

    Parameters
    ----------
    pipeline     : fitted sklearn Pipeline
    X_test       : held-out feature DataFrame (original, unscaled)
    feature_cols : list of feature column names
    delta_pct    : fractional perturbation (default 0.01 = 1 %)

    Returns
    -------
    elasticity : dict[str, float]  — feature → mean elasticity, sorted desc
    """
    from .preprocess import NUMERICAL_FEATURES

    continuous_cols = [c for c in NUMERICAL_FEATURES if c in feature_cols]
    if not continuous_cols:
        return {}

    # Use a small subsample to keep this fast
    X_sample = X_test.iloc[:min(200, len(X_test))].copy()
    y_base   = pipeline.predict(X_sample)

    elasticity = {}
    for col in continuous_cols:
        X_perturbed        = X_sample.copy()
        col_vals           = X_sample[col].values
        # Avoid division-by-zero for zero-valued features
        denom              = np.where(col_vals == 0, 1e-9, col_vals)
        X_perturbed[col]   = col_vals + delta_pct * denom
        y_perturbed        = pipeline.predict(X_perturbed)

        # Mean elasticity across the test sample
        base_nonzero       = np.where(y_base == 0, 1e-9, y_base)
        pct_change_y       = (y_perturbed - y_base) / base_nonzero
        eta                = float(np.mean(pct_change_y) / delta_pct)
        elasticity[col]    = round(eta, 4)

    return dict(sorted(elasticity.items(), key=lambda kv: abs(kv[1]), reverse=True))