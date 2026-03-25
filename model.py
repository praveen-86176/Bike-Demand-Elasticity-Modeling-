"""
================================================================================
  BIKE DEMAND ELASTICITY MODELING
  -----------------------------------------------------------------------
  Author  : Praveen Kumar
  Date    : 2026-03-24
  Purpose : End-to-end data science pipeline for bike-sharing demand
            analysis and elasticity modeling using the UCI Bike Sharing Dataset.
  Sections:
    1.  Imports & Configuration
    2.  Data Loading
    3.  Basic Inspection
    4.  Data Cleaning & Preprocessing
    5.  Feature Engineering
    6.  Exploratory Data Analysis (EDA)
    7.  Correlation & Multicollinearity Check
    8.  Outlier Detection
    9.  Train / Test Split & Scaling
    10. Model Training   — Linear, Ridge, Lasso, Random Forest, Gradient Boost
    11. Model Evaluation — R², RMSE, MAE, MAPE + CV scores
    12. Feature Importance
    13. Demand Elasticity Analysis
    14. Residual Analysis
    15. Pipeline Summary
================================================================================
"""

# ============================================================
# SECTION 1 — IMPORTS & CONFIGURATION
# ============================================================
import os
import sys
import warnings

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # Non-interactive backend — no display windows
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.inspection import permutation_importance

warnings.filterwarnings("ignore")

# ── Visual theme ──────────────────────────────────────────────
PALETTE   = "muted"
FIG_DPI   = 130
BG_COLOR  = "#F9F9FB"
BLUE      = "#4C72B0"
ORANGE    = "#DD8452"
GREEN     = "#55A868"
RED       = "#C44E52"

sns.set_theme(style="whitegrid", palette=PALETTE, font_scale=1.05)
plt.rcParams.update({
    "figure.dpi"       : FIG_DPI,
    "figure.facecolor" : BG_COLOR,
    "axes.facecolor"   : BG_COLOR,
    "savefig.facecolor": BG_COLOR,
    "font.family"      : "DejaVu Sans",
})

# ── Output directory for all saved plots ──────────────────────
EDA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eda_plots")
os.makedirs(EDA_DIR, exist_ok=True)

# ── Helper: save figure ───────────────────────────────────────
def save_fig(filename: str, label: str) -> None:
    """Save the current figure and close it cleanly."""
    path = os.path.join(EDA_DIR, filename)
    plt.savefig(path, dpi=FIG_DPI, bbox_inches="tight")
    plt.close()
    print(f"  ✔ {label} → saved: {os.path.basename(path)}")

# ── Helper: separator ────────────────────────────────────────
def section_header(title: str) -> None:
    print(f"\n{'─' * 65}")
    print(f"  {title}")
    print(f"{'─' * 65}")


print("=" * 65)
print("  BIKE DEMAND ELASTICITY MODELING — Pipeline Started")
print("=" * 65)


# ============================================================
# SECTION 2 — DATA LOADING
# ============================================================
section_header("SECTION 2 — DATA LOADING")

# ── Resolve dataset path ──────────────────────────────────────
# Searches common locations so the script is portable.
_SEARCH_DIRS = [
    os.path.expanduser("~/Downloads/bike+sharing+dataset (1)"),
    os.path.expanduser("~/Downloads/bike+sharing+dataset"),
    os.path.expanduser("~/Downloads/BikeSharing"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"),
]

def _find_dataset() -> str:
    for d in _SEARCH_DIRS:
        p = os.path.join(d, "hour.csv")
        if os.path.exists(p):
            return p
    raise FileNotFoundError(
        "Cannot locate 'hour.csv'. Please place it in one of:\n"
        + "\n".join(f"  {d}" for d in _SEARCH_DIRS)
    )

HOUR_PATH = _find_dataset()
df_raw    = pd.read_csv(HOUR_PATH)
print(f"  ✅ Dataset loaded from: {HOUR_PATH}")
print(f"     Rows: {df_raw.shape[0]:,}   |   Columns: {df_raw.shape[1]}")


# ============================================================
# SECTION 3 — BASIC INSPECTION
# ============================================================
section_header("SECTION 3 — BASIC INSPECTION")

print("\n  ── First 5 rows ──")
print(df_raw.head().to_string())

print("\n  ── Data Types ──")
print(df_raw.dtypes.to_string())

print("\n  ── Descriptive Statistics ──")
print(df_raw.describe().round(3).to_string())


# ============================================================
# SECTION 4 — DATA CLEANING & PREPROCESSING
# ============================================================
section_header("SECTION 4 — DATA CLEANING & PREPROCESSING")

df = df_raw.copy()

# 4a. Parse date column
df["dteday"] = pd.to_datetime(df["dteday"])

# 4b. Drop leakage columns (casual + registered sum to cnt)
LEAKAGE_COLS = ["instant", "casual", "registered"]
df.drop(columns=LEAKAGE_COLS, inplace=True)
print(f"  Dropped leakage columns : {LEAKAGE_COLS}")

# 4c. Missing-value audit
missing      = df.isnull().sum()
missing_cols = missing[missing > 0]
if missing_cols.empty:
    print("  Missing values          : None — dataset is clean ✅")
else:
    print(f"  Missing values detected:\n{missing_cols.to_string()}")
    df.dropna(inplace=True)
    print("  Rows with NaN dropped.")

# 4d. Duplicate audit
dup_count = df.duplicated().sum()
print(f"  Duplicate rows          : {dup_count}")
if dup_count > 0:
    df.drop_duplicates(inplace=True)
    print(f"  Removed {dup_count} duplicate(s).")

print(f"\n  Dataset shape after cleaning: {df.shape}")


# ============================================================
# SECTION 5 — FEATURE ENGINEERING
# ============================================================
section_header("SECTION 5 — FEATURE ENGINEERING")

# 5a. Temporal features from the date column
df["year"]        = df["dteday"].dt.year
df["month"]       = df["dteday"].dt.month
df["day"]         = df["dteday"].dt.day
df["day_of_week"] = df["dteday"].dt.dayofweek   # 0 = Monday, 6 = Sunday

# 5b. Cyclic (sine/cosine) encoding — preserves periodicity
if "hr" in df.columns:
    df["hr_sin"]  = np.sin(2 * np.pi * df["hr"]  / 24)
    df["hr_cos"]  = np.cos(2 * np.pi * df["hr"]  / 24)

df["month_sin"]       = np.sin(2 * np.pi * df["month"]       / 12)
df["month_cos"]       = np.cos(2 * np.pi * df["month"]       / 12)
df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] /  7)
df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] /  7)

# 5c. Rush-hour flag  (7–9 AM  and  5–7 PM on weekdays)
if "hr" in df.columns:
    df["is_rush_hour"] = (
        df["hr"].isin(range(7, 10)) | df["hr"].isin(range(17, 20))
    ).astype(int)

# 5d. Weekend flag
df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

# 5e. Interaction features
df["temp_x_workday"]  = df["temp"]      * df["workingday"]
df["temp_x_humidity"] = df["temp"]      * df["hum"]
df["wind_x_weather"]  = df["windspeed"] * df["weathersit"]

# 5f. Binned temperature (comfort zones)
df["temp_bin"] = pd.cut(
    df["temp"],
    bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
    labels=["Freezing", "Cold", "Mild", "Warm", "Hot"],
    include_lowest=True,
)
df["temp_bin_encoded"] = df["temp_bin"].cat.codes  # ordinal int encoding

# 5g. Binned humidity (comfort zones)
df["hum_bin"] = pd.cut(
    df["hum"],
    bins=[0, 0.3, 0.6, 0.8, 1.0],
    labels=["Dry", "Comfortable", "Humid", "Very Humid"],
    include_lowest=True,
)
df["hum_bin_encoded"] = df["hum_bin"].cat.codes

# 5h. Drop raw date column (all information extracted above)
df.drop(columns=["dteday"], inplace=True)

# 5i. Drop intermediate helper columns before correlation / modeling
_HELPER_COLS = ["temp_bin", "hum_bin"]
df.drop(columns=_HELPER_COLS, errors="ignore", inplace=True)

print(f"  Feature engineering complete.  New shape: {df.shape}")
print(f"  Columns: {list(df.columns)}")


# ============================================================
# SECTION 6 — EXPLORATORY DATA ANALYSIS (EDA)
# ============================================================
section_header("SECTION 6 — EXPLORATORY DATA ANALYSIS (EDA)")

# ── 6.1 Target variable distribution ─────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle("Target Variable Analysis", fontsize=15, fontweight="bold")

sns.histplot(df["cnt"], kde=True, ax=axes[0], color=BLUE, bins=40)
axes[0].set_title("Raw Distribution (cnt)", fontsize=13)
axes[0].set_xlabel("Bike Rentals per Hour")
axes[0].set_ylabel("Frequency")

sns.histplot(np.log1p(df["cnt"]), kde=True, ax=axes[1], color=ORANGE, bins=40)
axes[1].set_title("Log-Transformed Target  [log1p(cnt)]", fontsize=13)
axes[1].set_xlabel("log1p(cnt)")
axes[1].set_ylabel("Frequency")

plt.tight_layout()
save_fig("01_target_distribution.png", "6.1 Target distribution")

# ── 6.2 Hourly demand pattern ─────────────────────────────────
if "hr" in df.columns:
    hourly_avg = df.groupby("hr")["cnt"].mean().reset_index()

    fig, ax = plt.subplots(figsize=(13, 5))
    sns.lineplot(data=hourly_avg, x="hr", y="cnt", marker="o", color=BLUE, ax=ax, linewidth=2)
    ax.axvspan(7,  9.5, alpha=0.12, color=RED,    label="Morning Rush (7–9 AM)")
    ax.axvspan(17, 19.5, alpha=0.12, color=ORANGE, label="Evening Rush (5–7 PM)")
    ax.set_title("Average Bike Demand by Hour of Day", fontsize=13, fontweight="bold")
    ax.set_xlabel("Hour of Day")
    ax.set_ylabel("Average Rentals")
    ax.set_xticks(range(0, 24))
    ax.legend()
    plt.tight_layout()
    save_fig("02_hourly_demand.png", "6.2 Hourly demand pattern")

# ── 6.3 Monthly demand pattern ────────────────────────────────
monthly_avg = df.groupby("month")["cnt"].mean().reset_index()
MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

fig, ax = plt.subplots(figsize=(13, 5))
sns.barplot(data=monthly_avg, x="month", y="cnt", palette="Blues_d", ax=ax)
ax.set_xticklabels(MONTH_LABELS)
ax.set_title("Average Bike Demand by Month", fontsize=13, fontweight="bold")
ax.set_xlabel("Month")
ax.set_ylabel("Average Rentals")
plt.tight_layout()
save_fig("03_monthly_demand.png", "6.3 Monthly demand pattern")

# ── 6.4 Day-of-week demand pattern ───────────────────────────
DOW_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
dow_avg    = df.groupby("day_of_week")["cnt"].mean().reset_index()

fig, ax = plt.subplots(figsize=(10, 5))
bars = ax.bar(dow_avg["day_of_week"], dow_avg["cnt"],
              color=[GREEN if i < 5 else ORANGE for i in range(7)], edgecolor="white")
ax.set_xticks(range(7))
ax.set_xticklabels(DOW_LABELS)
ax.set_title("Average Bike Demand by Day of Week", fontsize=13, fontweight="bold")
ax.set_xlabel("Day of Week")
ax.set_ylabel("Average Rentals")
ax.bar_label(bars, fmt="%.0f", padding=3, fontsize=9)
plt.tight_layout()
save_fig("04_dow_demand.png", "6.4 Day-of-week demand pattern")

# ── 6.5 Season vs demand ──────────────────────────────────────
SEASON_MAP  = {1: "Spring", 2: "Summer", 3: "Fall", 4: "Winter"}
df["season_label"] = df["season"].map(SEASON_MAP)

fig, ax = plt.subplots(figsize=(10, 5))
sns.boxplot(data=df, x="season_label", y="cnt",
            order=["Spring", "Summer", "Fall", "Winter"], palette="Set2", ax=ax)
ax.set_title("Bike Demand Distribution by Season", fontsize=13, fontweight="bold")
ax.set_xlabel("Season")
ax.set_ylabel("Rentals per Hour")
plt.tight_layout()
save_fig("05_season_demand.png", "6.5 Season vs demand")

# ── 6.6 Weather situation vs demand ───────────────────────────
WEATHER_MAP = {1: "Clear", 2: "Mist/Cloudy", 3: "Light Rain/Snow", 4: "Heavy Rain"}
df["weather_label"] = df["weathersit"].map(WEATHER_MAP)

fig, ax = plt.subplots(figsize=(12, 5))
sns.boxplot(data=df, x="weather_label", y="cnt", palette="coolwarm", ax=ax)
ax.set_title("Bike Demand by Weather Situation", fontsize=13, fontweight="bold")
ax.set_xlabel("Weather Condition")
ax.set_ylabel("Rentals per Hour")
plt.tight_layout()
save_fig("06_weather_demand.png", "6.6 Weather vs demand")

# ── 6.7 Working day vs Holiday demand ────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle("Working Day & Holiday Analysis", fontsize=14, fontweight="bold")

sns.boxplot(data=df, x="workingday", y="cnt", palette="pastel", ax=axes[0])
axes[0].set_xticks([0, 1])
axes[0].set_xticklabels(["Non-Working", "Working"])
axes[0].set_title("Working Day vs Demand", fontsize=12)
axes[0].set_xlabel("")
axes[0].set_ylabel("Rentals per Hour")

sns.boxplot(data=df, x="holiday", y="cnt", palette="Set3", ax=axes[1])
axes[1].set_xticks([0, 1])
axes[1].set_xticklabels(["Regular Day", "Holiday"])
axes[1].set_title("Holiday vs Demand", fontsize=12)
axes[1].set_xlabel("")
axes[1].set_ylabel("Rentals per Hour")

plt.tight_layout()
save_fig("07_workday_holiday_demand.png", "6.7 Working day / holiday demand")

# ── 6.8 Continuous features vs target ────────────────────────
_SAMPLE = df.sample(min(3000, len(df)), random_state=42)
continuous_features = ["temp", "atemp", "hum", "windspeed"]

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("Continuous Features vs Bike Demand", fontsize=14, fontweight="bold")

for ax, feat in zip(axes.flatten(), continuous_features):
    sns.regplot(data=_SAMPLE, x=feat, y="cnt", ax=ax,
                scatter_kws={"alpha": 0.3, "s": 8, "color": BLUE},
                line_kws={"color": RED, "linewidth": 1.5})
    ax.set_title(f"{feat} vs Demand", fontsize=12)

plt.tight_layout()
save_fig("08_continuous_vs_demand.png", "6.8 Continuous features vs demand")

# ── 6.9 Feature distributions ────────────────────────────────
fig, axes = plt.subplots(1, 4, figsize=(18, 4))
fig.suptitle("Feature Distributions", fontsize=14, fontweight="bold")

for ax, feat in zip(axes, continuous_features):
    sns.histplot(df[feat], kde=True, ax=ax, color=BLUE, bins=30)
    ax.set_title(feat, fontsize=12)
    ax.set_xlabel("")

plt.tight_layout()
save_fig("09_feature_distributions.png", "6.9 Feature distributions")

# Drop helper label columns before modeling
df.drop(columns=["season_label", "weather_label"], errors="ignore", inplace=True)

print(f"\n  EDA complete ✅  |  9 plots saved → {EDA_DIR}")


# ============================================================
# SECTION 7 — CORRELATION & MULTICOLLINEARITY CHECK
# ============================================================
section_header("SECTION 7 — CORRELATION & MULTICOLLINEARITY CHECK")

numeric_df  = df.select_dtypes(include=[np.number])
corr_matrix = numeric_df.corr()

fig, ax = plt.subplots(figsize=(18, 14))
mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
sns.heatmap(
    corr_matrix, mask=mask, annot=True, fmt=".2f",
    cmap="coolwarm", linewidths=0.4, ax=ax,
    annot_kws={"size": 7}, vmin=-1, vmax=1,
)
ax.set_title("Feature Correlation Matrix", fontsize=15, fontweight="bold")
plt.tight_layout()
save_fig("10_correlation_matrix.png", "7.1 Correlation matrix")

top_corr = corr_matrix["cnt"].drop("cnt").abs().sort_values(ascending=False)
print(f"\n  Top 10 features correlated with 'cnt':")
print(top_corr.head(10).round(4).to_string())

# Flag highly correlated feature pairs (multicollinearity)
print("\n  Highly correlated feature pairs (|r| > 0.85) — potential multicollinearity:")
_found = False
for i in range(len(corr_matrix.columns)):
    for j in range(i + 1, len(corr_matrix.columns)):
        val = abs(corr_matrix.iloc[i, j])
        if val > 0.85:
            c1, c2 = corr_matrix.columns[i], corr_matrix.columns[j]
            if c1 != "cnt" and c2 != "cnt":
                print(f"   • {c1}  ↔  {c2}  |r| = {val:.3f}")
                _found = True
if not _found:
    print("   None found above threshold ✅")


# ============================================================
# SECTION 8 — OUTLIER DETECTION
# ============================================================
section_header("SECTION 8 — OUTLIER DETECTION (IQR Method)")

outlier_cols = ["temp", "hum", "windspeed", "cnt"]
fig, axes    = plt.subplots(1, len(outlier_cols), figsize=(17, 5))
fig.suptitle("Outlier Detection (IQR Method)", fontsize=13, fontweight="bold")

outlier_summary = []
for ax, col in zip(axes, outlier_cols):
    Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    IQR    = Q3 - Q1
    lower  = Q1 - 1.5 * IQR
    upper  = Q3 + 1.5 * IQR
    n_out  = ((df[col] < lower) | (df[col] > upper)).sum()
    pct    = 100 * n_out / len(df)

    sns.boxplot(y=df[col], ax=ax, color=BLUE,
                flierprops={"marker": "o", "markersize": 3, "alpha": 0.4})
    ax.set_title(f"{col}\n{n_out:,} outliers ({pct:.1f}%)", fontsize=11)
    ax.set_ylabel(col)
    outlier_summary.append({"Column": col, "Outliers": n_out, "Pct (%)": round(pct, 2)})

plt.tight_layout()
save_fig("11_outlier_detection.png", "8.1 Outlier detection")

print("\n  Outlier Summary (IQR method):")
print(pd.DataFrame(outlier_summary).to_string(index=False))
print(f"\n  📁 All EDA / analysis plots saved → {EDA_DIR}")


# ============================================================
# SECTION 9 — TRAIN / TEST SPLIT & FEATURE SCALING
# ============================================================
section_header("SECTION 9 — TRAIN / TEST SPLIT & SCALING")

TARGET = "cnt"

# Columns to exclude from model features
_EXCLUDE = [
    "yr",    # already encoded in 'year'
    "year",  # redundant with 'yr'
]

feature_cols = [
    c for c in df.select_dtypes(include=[np.number]).columns
    if c != TARGET and c not in _EXCLUDE
]

X = df[feature_cols]
y = df[TARGET]

print(f"  Features used ({len(feature_cols)}):")
for i, fc in enumerate(feature_cols, 1):
    print(f"    {i:>2}. {fc}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, shuffle=True
)
print(f"\n  Train: {X_train.shape[0]:,} rows  |  Test: {X_test.shape[0]:,} rows")
print(f"  Split ratio: 80 / 20  |  random_state=42")

scaler     = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)
print("  StandardScaler fitted on train, applied to test ✅")


# ============================================================
# SECTION 10 — MODEL TRAINING
# ============================================================
section_header("SECTION 10 — MODEL TRAINING")

# Tree-based models work well without scaling; linear models need it
_TREE_MODELS = {"Random Forest", "Gradient Boosting"}

models = {
    "Linear Regression" : LinearRegression(),
    "Ridge Regression"  : Ridge(alpha=1.0),
    "Lasso Regression"  : Lasso(alpha=0.1, max_iter=10_000),
    "Random Forest"     : RandomForestRegressor(
                              n_estimators=100,        # fast yet accurate
                              max_depth=None,
                              min_samples_split=5,
                              min_samples_leaf=2,
                              max_features="sqrt",
                              random_state=42,
                              n_jobs=-1,
                          ),
    "Gradient Boosting" : GradientBoostingRegressor(
                              n_estimators=100,        # fast yet accurate
                              learning_rate=0.1,
                              max_depth=4,
                              subsample=0.8,
                              min_samples_split=5,
                              random_state=42,
                          ),
}

kf = KFold(n_splits=3, shuffle=True, random_state=42)   # 3-fold for speed

trained_models = {}
cv_results     = {}  # {name: {"mean": float, "std": float}}

print(f"\n  {'Model':<25} {'CV-RMSE (mean)':>16}  {'CV-Std':>10}", flush=True)
print(f"  {'─' * 58}", flush=True)

for name, model in models.items():
    print(f"  Training: {name} …", end=" ", flush=True)
    X_fit = X_train if name in _TREE_MODELS else X_train_sc
    model.fit(X_fit, y_train)
    trained_models[name] = model

    X_cv    = X_train if name in _TREE_MODELS else X_train_sc
    cv_rmse = np.sqrt(-cross_val_score(
        model, X_cv, y_train, cv=kf, scoring="neg_mean_squared_error", n_jobs=-1
    ))
    cv_results[name] = {"mean": cv_rmse.mean(), "std": cv_rmse.std()}
    print(f"done  →  CV-RMSE = {cv_rmse.mean():.2f} ± {cv_rmse.std():.2f}", flush=True)


# ============================================================
# SECTION 11 — MODEL EVALUATION
# ============================================================
section_header("SECTION 11 — MODEL EVALUATION (Test Set)")

def mape(y_true, y_pred, epsilon=1e-10):
    """Mean Absolute Percentage Error — avoids division by zero."""
    return np.mean(np.abs((y_true - y_pred) / (y_true + epsilon))) * 100

rows = []
for name, model in trained_models.items():
    X_input = X_test if name in _TREE_MODELS else X_test_sc
    y_pred  = model.predict(X_input)
    y_pred  = np.clip(y_pred, 0, None)   # Bike rentals cannot be negative

    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae  = mean_absolute_error(y_test, y_pred)
    _mape = mape(y_test.values, y_pred)

    rows.append({
        "Model"     : name,
        "R²"        : round(r2,    4),
        "RMSE"      : round(rmse,  2),
        "MAE"       : round(mae,   2),
        "MAPE (%)"  : round(_mape, 2),
        "CV-RMSE"   : round(cv_results[name]["mean"], 2),
        "CV-Std"    : round(cv_results[name]["std"],  2),
    })

results_df = (
    pd.DataFrame(rows)
    .sort_values("R²", ascending=False)
    .reset_index(drop=True)
)

print(f"\n  {'─' * 80}")
print(f"  Model Performance Summary (sorted by R² ↓)")
print(f"  {'─' * 80}")
print(results_df.to_string(index=False))

# ── Comparison bar chart — all 3 metrics ─────────────────────
fig, axes = plt.subplots(1, 3, figsize=(20, 6))
fig.suptitle("Model Performance Comparison", fontsize=15, fontweight="bold")

_colors = sns.color_palette("muted", len(results_df))
metrics_cfg = [
    ("R²",       "higher is better", True),
    ("RMSE",     "lower is better",  False),
    ("MAE",      "lower is better",  False),
]

for ax, (metric, note, best_high) in zip(axes, metrics_cfg):
    sorted_df = results_df.sort_values(metric, ascending=not best_high)
    bars = ax.barh(sorted_df["Model"], sorted_df[metric], color=_colors)
    ax.set_xlabel(metric)
    ax.set_title(f"{metric}\n({note})", fontsize=12)
    ax.bar_label(bars, padding=3,
                 labels=[f"{v:.3f}" if metric == "R²" else f"{v:.1f}"
                         for v in sorted_df[metric]],
                 fontsize=9)
    ax.invert_yaxis()

plt.tight_layout()
save_fig("12_model_comparison.png", "11.1 Model performance comparison")

# ── CV-RMSE comparison ────────────────────────────────────────
fig, ax = plt.subplots(figsize=(11, 5))
ax.bar(
    results_df["Model"], results_df["CV-RMSE"],
    yerr=results_df["CV-Std"], capsize=5,
    color=sns.color_palette("muted", len(results_df)),
    error_kw={"elinewidth": 1.5, "ecolor": "gray"},
)
ax.set_title("5-Fold Cross-Validation RMSE (mean ± std)", fontsize=13, fontweight="bold")
ax.set_ylabel("CV-RMSE")
ax.set_xlabel("Model")
plt.xticks(rotation=15, ha="right")
plt.tight_layout()
save_fig("13_cv_rmse_comparison.png", "11.2 CV-RMSE comparison")

# ── Pick best model ───────────────────────────────────────────
best_model_name = results_df.iloc[0]["Model"]
best_model      = trained_models[best_model_name]

print(f"\n  🏆 Best Model : {best_model_name}")
print(f"     R²         : {results_df.iloc[0]['R²']}")
print(f"     RMSE       : {results_df.iloc[0]['RMSE']}")
print(f"     MAE        : {results_df.iloc[0]['MAE']}")
print(f"     MAPE (%)   : {results_df.iloc[0]['MAPE (%)']}")
print(f"     CV-RMSE    : {results_df.iloc[0]['CV-RMSE']} ± {results_df.iloc[0]['CV-Std']}")


# ============================================================
# SECTION 12 — FEATURE IMPORTANCE
# ============================================================
section_header("SECTION 12 — FEATURE IMPORTANCE")

if best_model_name in _TREE_MODELS:
    # Native tree-based importances (mean decrease in impurity)
    importances = pd.Series(best_model.feature_importances_, index=feature_cols)
    imp_type    = "Gini / MDI Importance"
else:
    # Permutation importance (model-agnostic)
    X_eval   = X_test_sc
    perm_res = permutation_importance(
        best_model, X_eval, y_test, n_repeats=15, random_state=42, n_jobs=-1
    )
    importances = pd.Series(perm_res.importances_mean, index=feature_cols)
    imp_type    = "Permutation Importance"

importances = importances.sort_values(ascending=False)
top_n       = min(15, len(importances))

fig, ax = plt.subplots(figsize=(11, 7))
palette_imp = sns.color_palette("Blues_r", top_n)
importances.head(top_n).plot(kind="barh", ax=ax, color=palette_imp, edgecolor="white")
ax.invert_yaxis()
ax.set_title(f"Top {top_n} Feature Importances\n{best_model_name}  [{imp_type}]",
             fontsize=13, fontweight="bold")
ax.set_xlabel("Importance Score")
for i, (val, name_feat) in enumerate(
        zip(importances.head(top_n), importances.head(top_n).index)):
    ax.text(val + 0.001, i, f"{val:.4f}", va="center", fontsize=9)
plt.tight_layout()
save_fig("14_feature_importance.png", "12.1 Feature importance")

print(f"\n  [{imp_type}] — Top 10 features:")
print(importances.head(10).round(5).to_string())


# ============================================================
# SECTION 13 — DEMAND ELASTICITY ANALYSIS
# ============================================================
section_header("SECTION 13 — DEMAND ELASTICITY ANALYSIS")

print("""
  Methodology
  ───────────
  Point-elasticity at the feature mean:

      E_i = β_i  ×  (mean(X_i) / mean(y))

  where β_i are OLS coefficients from a Linear Regression fit
  on scaled data, then de-scaled back to raw units.
  A value of E_i = 0.5 means:
      "A 1 % increase in X_i is associated with a 0.5 % increase in demand."
""")

# Fit a fresh OLS model (scaled) for interpretable coefficients
lr_elast = LinearRegression()
lr_elast.fit(X_train_sc, y_train)

mean_y  = y_train.mean()
mean_X  = X_train.mean()
std_X   = X_train.std()

# De-scale: β_raw = β_scaled / σ_X
coef_raw = lr_elast.coef_ / std_X.values

elasticity_df = pd.DataFrame({
    "Feature"     : feature_cols,
    "β (raw)"     : coef_raw.round(4),
    "Mean(X)"     : mean_X.values.round(4),
    "Elasticity"  : (coef_raw * mean_X.values / mean_y).round(4),
}).sort_values("Elasticity", key=abs, ascending=False).reset_index(drop=True)

print("  Demand Elasticity Table (sorted by |elasticity|):")
print(elasticity_df.to_string(index=False))

# ── Elasticity bar chart ──────────────────────────────────────
top_k   = elasticity_df.head(14)
c_elast = [RED if v < 0 else GREEN for v in top_k["Elasticity"]]

fig, ax = plt.subplots(figsize=(13, 7))
bars = ax.barh(top_k["Feature"], top_k["Elasticity"], color=c_elast, edgecolor="white")
ax.axvline(0, color="black", linewidth=1.0, linestyle="--")
ax.set_xlabel("Elasticity Coefficient\n( % change in demand per 1 % change in feature )",
              fontsize=11)
ax.set_title("Demand Elasticity — Top Features", fontsize=14, fontweight="bold")
ax.bar_label(bars, fmt="%.3f", padding=3, fontsize=9)
ax.invert_yaxis()
# Add legend patch manually
from matplotlib.patches import Patch
legend_elements = [Patch(facecolor=GREEN, label="Positive effect on demand"),
                   Patch(facecolor=RED,   label="Negative effect on demand")]
ax.legend(handles=legend_elements, loc="lower right", fontsize=10)
plt.tight_layout()
save_fig("15_demand_elasticity.png", "13.1 Demand elasticity chart")

print("\n  Key Interpretation:")
for _, row in elasticity_df.head(6).iterrows():
    direction = "⬆ increases" if row["Elasticity"] > 0 else "⬇ decreases"
    print(f"   • 1 % ↑ in '{row['Feature']}' {direction} demand "
          f"by {abs(row['Elasticity']):.3f}%")


# ============================================================
# SECTION 14 — RESIDUAL ANALYSIS
# ============================================================
section_header("SECTION 14 — RESIDUAL ANALYSIS")

X_best       = X_test if best_model_name in _TREE_MODELS else X_test_sc
y_pred_best  = np.clip(best_model.predict(X_best), 0, None)
residuals    = y_test.values - y_pred_best

# Summary statistics
res_mean = residuals.mean()
res_std  = residuals.std()
res_max  = np.abs(residuals).max()
print(f"  Residual Statistics:")
print(f"   Mean        : {res_mean:.4f}  (≈ 0 implies no systematic bias)")
print(f"   Std Dev     : {res_std:.4f}")
print(f"   Max |Error| : {res_max:.2f}")
print(f"   Skewness    : {pd.Series(residuals).skew():.4f}")
print(f"   Kurtosis    : {pd.Series(residuals).kurtosis():.4f}")

fig, axes = plt.subplots(1, 3, figsize=(19, 5))
fig.suptitle(f"Residual Analysis — {best_model_name}", fontsize=14, fontweight="bold")

# Plot A — Residuals vs Fitted
axes[0].scatter(y_pred_best, residuals, alpha=0.25, color=BLUE, s=8)
axes[0].axhline(0, color=RED, linestyle="--", linewidth=1.2)
axes[0].set_xlabel("Fitted Values")
axes[0].set_ylabel("Residuals")
axes[0].set_title("Residuals vs Fitted", fontsize=12)

# Plot B — Residual distribution
sns.histplot(residuals, kde=True, ax=axes[1], color=ORANGE, bins=50)
axes[1].axvline(0,   color=RED, linestyle="--", linewidth=1.2, label="Zero")
axes[1].axvline(res_mean, color=GREEN, linestyle=":", linewidth=1.2,
                label=f"Mean={res_mean:.1f}")
axes[1].set_title("Residual Distribution", fontsize=12)
axes[1].set_xlabel("Residual")
axes[1].legend(fontsize=9)

# Plot C — Actual vs Predicted
rng         = np.random.default_rng(42)
sample_idx  = rng.choice(len(y_test), size=min(500, len(y_test)), replace=False)
max_val     = max(float(y_test.max()), float(y_pred_best.max()))
axes[2].scatter(y_test.values[sample_idx], y_pred_best[sample_idx],
                alpha=0.4, color=GREEN, s=10)
axes[2].plot([0, max_val], [0, max_val], color=RED, linestyle="--",
             linewidth=1.2, label="Perfect Fit (y=x)")
axes[2].set_xlabel("Actual Values")
axes[2].set_ylabel("Predicted Values")
axes[2].set_title("Actual vs Predicted  (500 samples)", fontsize=12)
axes[2].legend(fontsize=9)

plt.tight_layout()
save_fig("16_residual_analysis.png", "14.1 Residual analysis")


# ============================================================
# SECTION 15 — PIPELINE SUMMARY
# ============================================================
print("\n" + "=" * 65)
print("  ✅  PIPELINE COMPLETE")
print("=" * 65)

print(f"""
  Dataset          : UCI Bike Sharing (hourly)
  Rows processed   : {len(df):,}
  Features used    : {len(feature_cols)}

  Best Model       : {best_model_name}
  ─────────────────────────────────────────
  R²   (test)      : {results_df.iloc[0]['R²']}
  RMSE (test)      : {results_df.iloc[0]['RMSE']}
  MAE  (test)      : {results_df.iloc[0]['MAE']}
  MAPE (test)      : {results_df.iloc[0]['MAPE (%)']} %
  CV-RMSE  (5-fold): {results_df.iloc[0]['CV-RMSE']} ± {results_df.iloc[0]['CV-Std']}

  Plots saved to   : {EDA_DIR}
  Total plots      : 16
""")

print(f"{'=' * 65}")