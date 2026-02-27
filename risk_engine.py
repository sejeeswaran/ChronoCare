"""
Rule-Based Risk Engine
======================
Production-ready, modular risk scoring engine for chronic disease
risk intelligence. Currently configured for diabetes risk assessment.

Functions
---------
- rule_based_risk      : Score a single patient observation.
- classify_risk        : Map a numeric score to a risk category.
- apply_rule_engine    : Enrich an entire DataFrame with risk scores.
- detect_deterioration : Detect worsening glucose trends over time.
- generate_alert       : Produce an alert string from risk + trend data.
"""

from __future__ import annotations

import pandas as pd


# ---------------------------------------------------------------------------
# 1. Rule-Based Scoring
# ---------------------------------------------------------------------------

def rule_based_risk(row: pd.Series) -> int:
    """Score a single patient observation using diabetes-specific rules.

    Scoring logic
    -------------
    - fasting_glucose > 180  → +40
    - fasting_glucose > 140  → +20  (mutually exclusive with the above)
    - hba1c > 6.5            → +40

    Parameters
    ----------
    row : pd.Series
        Must contain ``fasting_glucose`` and ``hba1c`` fields.

    Returns
    -------
    int
        Cumulative risk score (0–80).
    """
    score: int = 0

    glucose = row["fasting_glucose"]
    if glucose > 180:
        score += 40
    elif glucose > 140:
        score += 20

    if row["hba1c"] > 6.5:
        score += 40

    return score


# ---------------------------------------------------------------------------
# 2. Risk Classification
# ---------------------------------------------------------------------------

def classify_risk(score: int) -> str:
    """Map a numeric risk score to a human-readable category.

    Thresholds
    ----------
    - score >= 60 → ``"High Risk"``
    - score >= 30 → ``"Moderate Risk"``
    - otherwise   → ``"Low Risk"``

    Parameters
    ----------
    score : int
        Risk score produced by :func:`rule_based_risk`.

    Returns
    -------
    str
        One of ``"High Risk"``, ``"Moderate Risk"``, or ``"Low Risk"``.
    """
    if score >= 60:
        return "High Risk"
    if score >= 30:
        return "Moderate Risk"
    return "Low Risk"


# ---------------------------------------------------------------------------
# 3. DataFrame-Level Engine
# ---------------------------------------------------------------------------

def apply_rule_engine(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the rule engine to every row and enrich the DataFrame.

    Adds the following columns:

    - ``rule_score``    – integer risk score
    - ``risk_category`` – human-readable risk tier
    - ``risk_label``    – binary label (1 = High Risk, 0 = otherwise)

    Parameters
    ----------
    df : pd.DataFrame
        Must contain at least ``fasting_glucose`` and ``hba1c`` columns.

    Returns
    -------
    pd.DataFrame
        A **copy** of the input DataFrame with the three new columns.
    """
    result = df.copy()
    result["rule_score"] = result.apply(rule_based_risk, axis=1)
    result["risk_category"] = result["rule_score"].apply(classify_risk)
    result["risk_label"] = (result["risk_category"] == "High Risk").astype(int)
    return result


# ---------------------------------------------------------------------------
# 4. Trend / Deterioration Detection
# ---------------------------------------------------------------------------

def detect_deterioration(patient_df: pd.DataFrame) -> str:
    """Detect whether a single patient's glucose trend is worsening.

    Algorithm
    ---------
    1. Sort records by ``date``.
    2. Compute a 7-day rolling mean of ``fasting_glucose``.
    3. Compare the **latest** valid rolling-mean value against the
       **previous** valid rolling-mean value.
    4. If the latest value is greater → ``"Deteriorating"``; otherwise
       ``"Stable"``.

    If fewer than 2 valid rolling-mean values exist, the patient is
    considered ``"Stable"`` (insufficient data to judge).

    Parameters
    ----------
    patient_df : pd.DataFrame
        Timeline rows for a **single** patient.  Must contain ``date``
        and ``fasting_glucose`` columns.

    Returns
    -------
    str
        ``"Deteriorating"`` or ``"Stable"``.
    """
    # Safety: require at least 14 data points for a meaningful
    # 7-day vs previous 7-day rolling comparison.
    if len(patient_df) < 14:
        return "Stable"

    sorted_df = patient_df.sort_values("date").copy()
    sorted_df["date"] = pd.to_datetime(sorted_df["date"])
    sorted_df = sorted_df.set_index("date")

    rolling_avg = (
        sorted_df["fasting_glucose"]
        .rolling("7D")
        .mean()
        .dropna()
    )

    # Fallback if rolling window still yields < 2 valid values
    if len(rolling_avg) < 2:
        return "Stable"

    latest = rolling_avg.iloc[-1]
    previous = rolling_avg.iloc[-2]

    return "Deteriorating" if latest > previous else "Stable"


# ---------------------------------------------------------------------------
# 5. Alert Generation
# ---------------------------------------------------------------------------

def generate_alert(risk_category: str, trend_status: str) -> str:
    """Generate a clinical alert string from risk category and trend.

    Alert matrix
    ------------
    - High Risk (any trend)              → ``"CRITICAL ALERT"``
    - Moderate Risk + Deteriorating      → ``"WARNING"``
    - Everything else                    → ``"STABLE"``

    Parameters
    ----------
    risk_category : str
        One of ``"High Risk"``, ``"Moderate Risk"``, ``"Low Risk"``.
    trend_status : str
        ``"Deteriorating"`` or ``"Stable"``.

    Returns
    -------
    str
        ``"CRITICAL ALERT"``, ``"WARNING"``, or ``"STABLE"``.
    """
    if risk_category == "High Risk":
        return "CRITICAL ALERT"
    if risk_category == "Moderate Risk" and trend_status == "Deteriorating":
        return "WARNING"
    return "STABLE"
