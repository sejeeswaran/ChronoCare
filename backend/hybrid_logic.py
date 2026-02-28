"""
Hybrid Logic
=============
Combines rule-based scoring and ML probability into a single risk
classification.

Decision matrix
---------------
1. rule_score >= 60            → "High Risk"
2. ml_prob    >= threshold      → "High Risk"
3. ml_prob    >= 0.3            → "Moderate Risk"
4. Otherwise                    → "Low Risk"
"""

from __future__ import annotations


def hybrid_decision(
    rule_score: int | float,
    ml_prob: float,
    threshold: float = 0.5,
) -> str:
    """Return a risk-level string from rule score and ML probability.

    Parameters
    ----------
    rule_score : int | float
        Numeric score from the rule engine.
    ml_prob : float
        Probability (0–1) returned by the ML model.
    threshold : float
        Disease-specific probability threshold (default 0.5).

    Returns
    -------
    str
        ``"High Risk"``, ``"Moderate Risk"``, or ``"Low Risk"``.
    """
    if rule_score >= 60:
        return "High Risk"

    if ml_prob >= threshold:
        return "High Risk"

    if ml_prob >= 0.3:
        return "Moderate Risk"

    return "Low Risk"
