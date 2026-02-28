"""
Timeline Engine
===============
Simple rolling-window deterioration detector.

Compares recent 7-day average against the previous 7-day average
of a given numeric column to determine whether the patient's
condition is deteriorating.
"""

from __future__ import annotations
import os
import sys

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
if _MODULE_DIR not in sys.path:
    sys.path.insert(0, _MODULE_DIR)

import pandas as pd


def detect_trend(patient_df: pd.DataFrame, column_name: str) -> str:
    """Detect whether a patient metric is deteriorating over time.

    Algorithm
    ---------
    1. Sort by ``date`` column.
    2. Split into recent 7 rows and previous 7 rows.
    3. Compare averages.

    Parameters
    ----------
    patient_df : pd.DataFrame
        Timeline data for a single patient.  Must contain a ``date``
        column and the target *column_name*.
    column_name : str
        Numeric column to monitor (e.g. ``"Glucose"``).

    Returns
    -------
    str
        ``"Deteriorating"`` if recent average > previous average,
        else ``"Stable"``.
    """
    if "date" not in patient_df.columns:
        return "Stable"

    if column_name not in patient_df.columns:
        return "Stable"

    if len(patient_df) < 14:
        return "Stable"

    sorted_df = patient_df.sort_values("date").reset_index(drop=True)

    previous_avg = sorted_df[column_name].iloc[-14:-7].mean()
    recent_avg = sorted_df[column_name].iloc[-7:].mean()

    if recent_avg > previous_avg:
        return "Deteriorating"

    return "Stable"
