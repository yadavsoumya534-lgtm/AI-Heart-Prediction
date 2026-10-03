"""
=============================================================================
  HealthPredict AI — Heart Disease Model Training Pipeline
=============================================================================
  Dataset   : UCI Heart Disease (Cleveland) — 303 patients, 14 features
  Target    : 0 = No Disease, 1 = Disease Present
  Stack     : scikit-learn · pandas · imbalanced-learn · joblib
=============================================================================
"""

import os, warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier
)
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score, roc_curve,
    precision_recall_curve, average_precision_score
)
from imblearn.over_sampling import SMOTE
import joblib

# ─────────────────────────────────────────────
#  PALETTE & STYLE
# ─────────────────────────────────────────────
BLUE   = "#2563EB"
RED    = "#EF4444"
GREEN  = "#10B981"
PURPLE = "#8B5CF6"
ORANGE = "#F59E0B"
GRAY   = "#64748B"
BG     = "#F8FAFC"

plt.rcParams.update({
    "figure.facecolor": BG,
    "axes.facecolor":   BG,
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "font.family": "DejaVu Sans",
    "axes.titlesize": 13,
    "axes.labelsize": 11,
})

os.makedirs("models", exist_ok=True)
os.makedirs("reports", exist_ok=True)

print("=" * 60)
print("  HealthPredict AI — Training Pipeline")
print("=" * 60)

# ═══════════════════════════════════════════════════════
#  1.  DATA LOADING  (built-in UCI dataset — no file needed)
# ═══════════════════════════════════════════════════════
print("\n[1/6] Loading heart disease dataset …")

DATA_PATH = "heart_merged.csv"
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Could not find {DATA_PATH}. Place heart_merged.csv next to this script."
    )

df = pd.read_csv(DATA_PATH)

COLS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target"
]
missing_cols = [c for c in COLS if c not in df.columns]
if missing_cols:
    raise ValueError(f"heart_merged.csv is missing expected columns: {missing_cols}")

# Mark ? as NaN (in case of any raw string artifacts) and coerce to numeric
df.replace("?", np.nan, inplace=True)
df = df.apply(pd.to_numeric, errors='coerce')

# Convert multi-class target → binary  (0 = no disease, 1 = disease)
df["target"] = (df["target"] > 0).astype(int)

print(f"   ✓ Shape: {df.shape} | Positives: {df['target'].sum()} / {len(df)}")
print(f"   ✓ Missing values: {df.isnull().sum().sum()}")

# ═══════════════════════════════════════════════════════
#  2.  FEATURE ENGINEERING
# ═══════════════════════════════════════════════════════
print("\n[2/6] Feature engineering …")

df["age_thalach_ratio"]  = df["age"] / (df["thalach"] + 1)
df["bp_chol_product"]    = df["trestbps"] * df["chol"] / 10000
df["age_group"]          = pd.cut(df["age"], bins=[0,40,55,70,120],
                                  labels=[0,1,2,3]).astype(int)

FEATURES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
    "age_thalach_ratio", "bp_chol_product", "age_group"
]

X = df[FEATURES]
y = df["target"]

print(f"   ✓ Features: {len(FEATURES)} | Samples: {len(X)}")

# ═══════════════════════════════════════════════════════
#  3.  TRAIN / TEST SPLIT  +  SMOTE BALANCING
# ═══════════════════════════════════════════════════════
print("\n[3/6] Splitting + balancing …")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

imputer = SimpleImputer(strategy="median")
X_train_imp = imputer.fit_transform(X_train)
X_test_imp  = imputer.transform(X_test)

smote = SMOTE(random_state=42)
X_train_bal, y_train_bal = smote.fit_resample(X_train_imp, y_train)

print(f"   ✓ Train: {X_train_bal.shape[0]} (after SMOTE) | Test: {X_test_imp.shape[0]}")

# ═══════════════════════════════════════════════════════
#  4.  MODEL TRAINING & COMPARISON
# ═══════════════════════════════════════════════════════
print("\n[4/6] Training & comparing models …\n")

scaler = StandardScaler()
X_tr_sc = scaler.fit_transform(X_train_bal)
X_te_sc = scaler.transform(X_test_imp)

candidates = {
    "Logistic Regression": LogisticRegression(max_iter=1000, C=1.0, random_state=42),
    "Random Forest":       RandomForestClassifier(n_estimators=200, max_depth=8,
                                                   min_samples_split=4, random_state=42),
    "Gradient Boosting":   GradientBoostingClassifier(n_estimators=150, learning_rate=0.1,
                                                       max_depth=4, random_state=42),
    "SVM":                 SVC(kernel="rbf", C=1.5, probability=True, random_state=42),
    "KNN":                 KNeighborsClassifier(n_neighbors=7),
}

cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
results = {}

for name, model in candidates.items():
    cv_scores = cross_val_score(model, X_tr_sc, y_train_bal, cv=cv, scoring="roc_auc")
    model.fit(X_tr_sc, y_train_bal)
    y_pred  = model.predict(X_te_sc)
    y_proba = model.predict_proba(X_te_sc)[:, 1]
    
    results[name] = {
        "model":     model,
        "cv_auc":    cv_scores.mean(),
        "cv_std":    cv_scores.std(),
        "test_acc":  accuracy_score(y_test, y_pred),
        "test_auc":  roc_auc_score(y_test, y_proba),
        "y_pred":    y_pred,
        "y_proba":   y_proba,
        "cm":        confusion_matrix(y_test, y_pred),
    }
    print(f"   {name:<25} CV-AUC: {cv_scores.mean():.4f} ±{cv_scores.std():.4f}  "
          f"| Test-ACC: {accuracy_score(y_test, y_pred)*100:.1f}%  "
          f"| Test-AUC: {roc_auc_score(y_test, y_proba):.4f}")

best_name = max(results, key=lambda k: results[k]["test_auc"])
best      = results[best_name]
print(f"\n   🏆 Best model: {best_name}  (AUC={best['test_auc']:.4f})")

# ═══════════════════════════════════════════════════════
#  5.  SAVE MODEL & PIPELINE
# ═══════════════════════════════════════════════════════
print("\n[5/6] Saving model pipeline …")

pipeline_data = {
    "model":    best["model"],
    "scaler":   scaler,
    "imputer":  imputer,
    "features": FEATURES,
}
joblib.dump(pipeline_data, "heart_model.pkl")
joblib.dump(pipeline_data, "models/heart_model.pkl")
print("   ✓ Saved → heart_model.pkl (used by main.py)")
print("   ✓ Saved → models/heart_model.pkl (backup copy)")

# ═══════════════════════════════════════════════════════
#  6.  VISUALISE RESULTS
# ═══════════════════════════════════════════════════════
print("\n[6/6] Generating report charts …")

# ── Figure layout ──────────────────────────────────────
fig = plt.figure(figsize=(20, 22), facecolor=BG)
fig.suptitle("HealthPredict AI — Model Training Report", fontsize=18,
             fontweight="bold", color="#0F172A", y=0.98)
gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.35)

model_names  = list(results.keys())
test_accs    = [v["test_acc"]*100 for v in results.values()]
test_aucs    = [v["test_auc"] for v in results.values()]
cv_aucs      = [v["cv_auc"] for v in results.values()]

# ── A: Model Accuracy Bar ───────────────────────────────
ax1 = fig.add_subplot(gs[0, 0])
colors_bar = [RED if n == best_name else BLUE for n in model_names]
bars = ax1.bar([n.replace(" ", "\n") for n in model_names], test_accs, color=colors_bar, width=0.6)
ax1.set_ylim(60, 100)
ax1.set_title("Test Accuracy (%)", fontweight="bold")
ax1.set_ylabel("Accuracy (%)")
for bar, val in zip(bars, test_accs):
    ax1.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.3,
             f"{val:.1f}%", ha="center", va="bottom", fontsize=9, fontweight="bold")

# ── B: ROC-AUC bar ────────────────────────────────────
ax2 = fig.add_subplot(gs[0, 1])
bars2 = ax2.bar([n.replace(" ", "\n") for n in model_names], test_aucs,
                color=[GREEN if n == best_name else PURPLE for n in model_names], width=0.6)
ax2.set_ylim(0.6, 1.0)
ax2.set_title("Test ROC-AUC Score", fontweight="bold")
ax2.set_ylabel("AUC")
for bar, val in zip(bars2, test_aucs):
    ax2.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.005,
             f"{val:.3f}", ha="center", va="bottom", fontsize=9, fontweight="bold")

# ── C: CV-AUC with error bars ─────────────────────────
ax3 = fig.add_subplot(gs[0, 2])
cv_stds = [v["cv_std"] for v in results.values()]
ax3.errorbar(range(len(model_names)), cv_aucs, yerr=cv_stds,
             fmt='o-', color=BLUE, ecolor=RED, capsize=5, linewidth=2, markersize=8)
ax3.set_xticks(range(len(model_names)))
ax3.set_xticklabels([n.replace(" ", "\n") for n in model_names], fontsize=9)
ax3.set_ylim(0.6, 1.05)
ax3.set_title("10-Fold CV AUC ± Std Dev", fontweight="bold")
ax3.set_ylabel("AUC")
ax3.axhline(y=max(cv_aucs), color=GREEN, linestyle="--", alpha=0.4)

# ── D: ROC Curves all models ──────────────────────────
ax4 = fig.add_subplot(gs[1, :2])
curve_colors = [BLUE, GREEN, ORANGE, RED, PURPLE]
for (name, res), col in zip(results.items(), curve_colors):
    fpr, tpr, _ = roc_curve(y_test, res["y_proba"])
    lw = 3 if name == best_name else 1.5
    ax4.plot(fpr, tpr, lw=lw, color=col, label=f"{name} (AUC={res['test_auc']:.3f})")
ax4.plot([0,1],[0,1],"k--",lw=1,alpha=0.4,label="Random (0.500)")
ax4.set_xlabel("False Positive Rate")
ax4.set_ylabel("True Positive Rate")
ax4.set_title("ROC Curves — All Models", fontweight="bold")
ax4.legend(fontsize=9, loc="lower right")

# ── E: Confusion matrix (best model) ─────────────────
ax5 = fig.add_subplot(gs[1, 2])
cm = best["cm"]
im = ax5.imshow(cm, cmap="Blues")
ax5.set_xticks([0,1]); ax5.set_yticks([0,1])
ax5.set_xticklabels(["Pred: No Disease","Pred: Disease"], fontsize=9)
ax5.set_yticklabels(["True: No Disease","True: Disease"], fontsize=9, rotation=90, va="center")
ax5.set_title(f"Confusion Matrix\n({best_name})", fontweight="bold")
for i in range(2):
    for j in range(2):
        ax5.text(j, i, str(cm[i,j]), ha="center", va="center",
                 fontsize=18, fontweight="bold",
                 color="white" if cm[i,j] > cm.max()/2 else "#0F172A")

# ── F: Feature importance (if RF/GB) or coef (LR) ────
ax6 = fig.add_subplot(gs[2, :2])
model_obj = best["model"]
feat_names = FEATURES
if hasattr(model_obj, "feature_importances_"):
    importances = model_obj.feature_importances_
elif hasattr(model_obj, "coef_"):
    importances = np.abs(model_obj.coef_[0])
else:
    importances = np.ones(len(feat_names))

sorted_idx = np.argsort(importances)[::-1]
top_n = min(12, len(feat_names))
idx_top = sorted_idx[:top_n]
bar_colors = [RED if i == idx_top[0] else BLUE for i in idx_top]

ax6.barh([feat_names[i] for i in idx_top[::-1]],
         [importances[i] for i in idx_top[::-1]], color=bar_colors[::-1])
ax6.set_title(f"Top Feature Importances ({best_name})", fontweight="bold")
ax6.set_xlabel("Importance Score")

# ── G: Precision-Recall curve ─────────────────────────
ax7 = fig.add_subplot(gs[2, 2])
prec, rec, _ = precision_recall_curve(y_test, best["y_proba"])
ap = average_precision_score(y_test, best["y_proba"])
ax7.fill_between(rec, prec, alpha=0.3, color=BLUE)
ax7.plot(rec, prec, color=BLUE, lw=2)
ax7.set_xlabel("Recall")
ax7.set_ylabel("Precision")
ax7.set_title(f"Precision-Recall Curve\nAP = {ap:.3f}", fontweight="bold")

plt.savefig("reports/training_report.png", dpi=150, bbox_inches="tight",
            facecolor=BG)
print("   ✓ Saved → reports/training_report.png")

# ── Text summary ──────────────────────────────────────
print("\n" + "="*60)
print("  FINAL SUMMARY")
print("="*60)
print(f"  Best Model  : {best_name}")
print(f"  Test Acc    : {best['test_acc']*100:.1f}%")
print(f"  Test AUC    : {best['test_auc']:.4f}")
print(f"  CV-AUC      : {best['cv_auc']:.4f} ± {best['cv_std']:.4f}")
print("\n  Classification Report:")
print(classification_report(y_test, best["y_pred"],
                             target_names=["No Disease","Disease"]))
print("="*60)
print("\n  Files saved:")
print("  • models/heart_model.pkl   ← load this in your Flask app")
print("  • reports/training_report.png ← full visual report")
print("\n  Done! ✓")
