"""
Rule Engine
===========
Per-disease rule-based scoring functions.

Each function accepts a single row (pd.Series or dict-like) and returns
a numeric ``rule_score``.  The ``RULE_FUNCTIONS`` dictionary enables
dynamic dispatch — the orchestrator selects the correct function at
runtime based on the disease name.

To add rules for a new disease:
1. Define a function ``new_disease_rule(row) -> int``.
2. Add an entry to ``RULE_FUNCTIONS``.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Diabetes
# ---------------------------------------------------------------------------

def diabetes_rule(row) -> int:
    """Score diabetes risk from Glucose and BMI.

    Logic
    -----
    - Glucose > 180  -> +40
    - Glucose > 140  -> +20  (mutually exclusive)
    - BMI     > 35   -> +30

    Returns
    -------
    int
        Rule score (0-70).
    """
    score = 0
    glucose = row.get("Glucose", 0)

    if glucose > 180:
        score += 40
    elif glucose > 140:
        score += 20

    if row.get("BMI", 0) > 35:
        score += 30

    return score


# ---------------------------------------------------------------------------
# Hypertension
# ---------------------------------------------------------------------------

def hypertension_rule(row) -> int:
    """Score hypertension risk from categorical BP_History and Stress_Score.

    Logic
    -----
    - BP_History == "Hypertension"     -> +40
    - BP_History == "Prehypertension"  -> +20
    - Stress_Score > 7                 -> +30

    Returns
    -------
    int
        Rule score (0-70).
    """
    score = 0
    bp = row.get("BP_History", "Normal")

    if bp == "Hypertension":
        score += 40
    elif bp == "Prehypertension":
        score += 20

    if row.get("Stress_Score", 0) > 7:
        score += 30

    return score


# ---------------------------------------------------------------------------
# Chronic Kidney Disease (CKD)
# ---------------------------------------------------------------------------

def ckd_rule(row) -> int:
    """Score CKD risk from serum creatinine (Sc) and haemoglobin (Hemo).

    Logic
    -----
    - Sc (serum creatinine) > 1.4  -> +40
    - Hemo (haemoglobin)   < 12    -> +30

    Returns
    -------
    int
        Rule score (0-70).
    """
    score = 0

    if row.get("Sc", 0) > 1.4:
        score += 40

    if row.get("Hemo", 15) < 12:
        score += 30

    return score


# ---------------------------------------------------------------------------
# Cardiovascular Disease (Cardio)
# ---------------------------------------------------------------------------

def cardio_rule(row) -> int:
    """Score cardiovascular risk from resting blood pressure and cholesterol.

    Logic
    -----
    - trestbps > 160  -> +40
    - trestbps > 140  -> +20  (mutually exclusive)
    - chol     > 240  -> +30

    Returns
    -------
    int
        Rule score (0-70).
    """
    score = 0
    bp = row.get("trestbps", 0)

    if bp > 160:
        score += 40
    elif bp > 140:
        score += 20

    if row.get("chol", 0) > 240:
        score += 30

    return score


# ---------------------------------------------------------------------------
# Dynamic dispatch registry
# ---------------------------------------------------------------------------

RULE_FUNCTIONS: dict[str, callable] = {
    "diabetes": diabetes_rule,
    "hypertension": hypertension_rule,
    "ckd": ckd_rule,
    "cardio": cardio_rule,
}
