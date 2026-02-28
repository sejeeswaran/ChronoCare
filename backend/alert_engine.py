"""
Alert Engine
============
Maps a (risk_level, trend_status) pair to a clinical alert string.

Alert matrix
------------
- High Risk + Deteriorating  → ``"CRITICAL ALERT"``
- Moderate Risk              → ``"WARNING"``
- Everything else            → ``"STABLE"``
"""

from __future__ import annotations


def generate_alert(risk_level: str, trend_status: str) -> str:
    """Produce a clinical alert from risk level and trend.

    Parameters
    ----------
    risk_level : str
        ``"High Risk"``, ``"Moderate Risk"``, or ``"Low Risk"``.
    trend_status : str
        ``"Deteriorating"`` or ``"Stable"``.

    Returns
    -------
    str
        ``"CRITICAL ALERT"``, ``"WARNING"``, or ``"STABLE"``.
    """
    if risk_level == "High Risk" and trend_status == "Deteriorating":
        return "CRITICAL ALERT"

    if risk_level == "Moderate Risk":
        return "WARNING"

    return "STABLE"
