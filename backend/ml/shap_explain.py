"""
backend/ml/shap_explain.py — SHAP-based feature explainability.

Stretch Goal: SHAP-based explainability
----------------------------------------
Uses shap.TreeExplainer (fast, exact for Random Forests) on transformed data,
then maps SHAP values back to original feature names by parsing the
ColumnTransformer's output feature names.

Gracefully returns {} if the `shap` package is not installed, so the
rest of the pipeline never fails.
"""

import numpy as np


def compute_shap_importance(pipeline, X_test, feature_cols):
    """
    Compute mean |SHAP| values per original feature using TreeExplainer.

    Parameters
    ----------
    pipeline     : fitted sklearn Pipeline (preprocessor + RandomForest)
    X_test       : held-out feature DataFrame (original, unscaled)
    feature_cols : list of original feature column names

    Returns
    -------
    shap_dict : dict[str, float] — feature → normalised mean |SHAP|, sorted
                descending.  Empty dict if shap is unavailable.
    """
    try:
        import shap

        preprocessor = pipeline.named_steps["preprocessor"]
        rf_model     = pipeline.named_steps["model"]

        # Subsample for speed (TreeExplainer is O(n_samples) for RF)
        n_samples = min(300, len(X_test))
        X_sample  = X_test.iloc[:n_samples]

        # Transform to the space the RF model operates in
        X_transformed = preprocessor.transform(X_sample)

        # tree_path_dependent avoids needing a background dataset
        explainer  = shap.TreeExplainer(
            rf_model, feature_perturbation="tree_path_dependent"
        )
        shap_vals  = explainer.shap_values(X_transformed)

        mean_abs   = np.mean(np.abs(shap_vals), axis=0)

        # Get transformed feature names (sklearn prepends "cat__", "num__", "pas__")
        try:
            tf_names = list(preprocessor.get_feature_names_out())
        except Exception:
            return {}

        # Aggregate transformed features back to original feature names
        orig_shap = {col: 0.0 for col in feature_cols}
        for i, tf_name in enumerate(tf_names):
            if i >= len(mean_abs):
                break
            orig = _original_feature(tf_name, feature_cols)
            if orig in orig_shap:
                orig_shap[orig] += float(mean_abs[i])

        # Normalise so values sum to 1 (interpretable as % contribution)
        total = sum(orig_shap.values()) or 1.0
        orig_shap = {k: round(v / total, 4) for k, v in orig_shap.items()}

        return dict(sorted(orig_shap.items(), key=lambda kv: kv[1], reverse=True))

    except Exception:
        return {}


def _original_feature(tf_name: str, feature_cols: list) -> str:
    """
    Map a ColumnTransformer output name back to the original feature column.

    Examples
    --------
    "cat__season_1"  → "season"
    "num__temp"      → "temp"
    "pas__mnth"      → "mnth"
    """
    if "__" not in tf_name:
        return tf_name

    prefix, rest = tf_name.split("__", 1)

    if prefix == "cat":
        # OHE appends "_<category>" — find the matching original column
        for col in feature_cols:
            if rest == col or rest.startswith(col + "_"):
                return col
        return rest

    # "num" and "pas" use the exact original column name
    return rest
