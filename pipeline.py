"""
Pipeline — Hybrid Chronic Risk Intelligence System
===================================================
Single entry-point integration layer for the frontend team.

Usage
-----
::

    from pipeline import run_pipeline

    result_df = run_pipeline(patient_dataframe)

This is the **only** function external consumers need to call.
All internal orchestration (rule engine → hybrid engine) is handled
transparently.

Prerequisites
-------------
- ``diabetes_model.pkl`` and ``diabetes_scaler.pkl`` must already
  exist on disk (the ML model is **not** retrained at runtime).
"""

from __future__ import annotations

from typing import List

import pandas as pd

from hybrid_engine import apply_hybrid_engine
from risk_engine import apply_rule_engine

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_REQUIRED_COLUMNS: List[str] = [
    "patient_id",
    "date",
    "age",
    "fasting_glucose",
    "hba1c",
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_pipeline(df: pd.DataFrame) -> pd.DataFrame:
    """Run the full chronic-risk intelligence pipeline.

    This is the **single entry-point** for the frontend team.
    It validates input, applies the rule-based engine, then layers
    on the hybrid (rule + ML) engine, and returns the enriched
    DataFrame.

    Input Schema
    ------------
    The input DataFrame **must** contain the following columns:

    ============== ===== ==========================================
    Column         Type  Description
    ============== ===== ==========================================
    patient_id     str   Unique patient identifier
    date           str   Observation date (parseable by pandas)
    age            int   Patient age in years
    fasting_glucose float Fasting blood glucose (mg/dL)
    hba1c          float Glycated haemoglobin (%)
    ============== ===== ==========================================

    Output Schema
    -------------
    The returned DataFrame contains **all original columns** plus:

    ============== ===== ==========================================
    Column         Type  Source
    ============== ===== ==========================================
    rule_score     int   Rule-based engine
    risk_category  str   Rule-based engine
    risk_label     int   1 if High Risk, else 0
    ml_probability float ML model probability (0–1)
    final_risk     str   Hybrid decision (rule + ML)
    ============== ===== ==========================================

    Parameters
    ----------
    df : pd.DataFrame
        Raw patient observations.

    Returns
    -------
    pd.DataFrame
        Enriched copy of the input — the original is never mutated.

    Raises
    ------
    TypeError
        If *df* is not a ``pd.DataFrame``.
    ValueError
        If any required column is missing from the input.

    Notes
    -----
    - The ML model (``diabetes_model.pkl``) must already be trained
      and present on disk.  No training occurs inside this function.
    - The input DataFrame is **never** modified; all work is done on
      an internal copy.
    - This function produces **no** side effects (no prints, no file
      writes, no network calls).
    """
    # ── Guard: type check ────────────────────────────────────────────
    if not isinstance(df, pd.DataFrame):
        raise TypeError(
            f"Expected a pandas DataFrame, got {type(df).__name__}."
        )

    # ── Guard: required columns ──────────────────────────────────────
    missing = [col for col in _REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(
            f"Input DataFrame is missing required column(s): {missing}. "
            f"Expected columns: {_REQUIRED_COLUMNS}."
        )

    # ── Step 1: Rule-based engine ────────────────────────────────────
    result = apply_rule_engine(df)

    # ── Step 2: Hybrid engine (rule + ML) ────────────────────────────
    result = apply_hybrid_engine(result)

    return result
