"""
Multi-Disease Engine (Orchestrator)
====================================
Main entry point for the Hybrid Chronic Risk Intelligence Engine.

The engine is **fully registry-driven** — adding a new disease requires
only a new entry in ``disease_registry.DISEASE_REGISTRY`` and a
corresponding rule function in ``rule_engine.RULE_FUNCTIONS``.

No disease-specific logic exists in this file.
"""

from __future__ import annotations

import warnings
from typing import Any

import numpy as np
import pandas as pd

import sys
import os
_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
if _MODULE_DIR not in sys.path:
    sys.path.insert(0, _MODULE_DIR)

from disease_registry import DISEASE_REGISTRY
from model_cache import load_model
from rule_engine import RULE_FUNCTIONS
from hybrid_logic import hybrid_decision
from timeline_engine import detect_trend
from alert_engine import generate_alert


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ml_probability(model: Any, row_features: np.ndarray) -> float:
    """Return the positive-class probability from the ML model.

    Handles both classifiers with ``predict_proba`` and simple
    regressors / pipelines that return a single value.
    """
    try:
        proba = model.predict_proba(row_features)
        return float(proba[0][1])
    except AttributeError:
        # Fallback for regressors
        pred = model.predict(row_features)
        return float(pred[0])
    except IndexError:
        # Binary classifier with single output
        pred = model.predict(row_features)
        return float(pred[0])


# ---------------------------------------------------------------------------
# Feature detection — which diseases can this DataFrame support?
# ---------------------------------------------------------------------------

def detect_matching_diseases(df: pd.DataFrame) -> list[str]:
    """Return disease names whose required columns are all present.

    Parameters
    ----------
    df : pd.DataFrame
        Input patient data.

    Returns
    -------
    list[str]
        Disease names that the DataFrame can support.
    """
    matches = []
    for disease, config in DISEASE_REGISTRY.items():
        required = config["required_columns"]
        if all(col in df.columns for col in required):
            matches.append(disease)
    return matches


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def predict_risks(
    df: pd.DataFrame,
    selected_diseases: str | list[str] | None = None,
) -> dict[str, dict[str, Any]]:
    """Run hybrid risk prediction for one or more diseases.

    Parameters
    ----------
    df : pd.DataFrame
        Patient data.  Must contain the required columns for each
        disease to be evaluated.
    selected_diseases : str | list | None
        ``None`` or ``"all"`` → evaluate all diseases whose required
        columns are present.  A list (e.g. ``["diabetes"]``) → evaluate
        only those diseases.

    Returns
    -------
    dict
        Structured results keyed by disease name::

            {
                "diabetes": {
                    "probability": 0.82,
                    "rule_score": 60,
                    "risk_level": "High Risk",
                    "trend": "Deteriorating",
                    "alert": "CRITICAL ALERT"
                },
                ...
            }
    """
    results: dict[str, dict[str, Any]] = {}

    # ── Determine which diseases to run ──────────────────────────────
    matched = detect_matching_diseases(df)

    if selected_diseases is None or selected_diseases == "all":
        diseases_to_run = matched
    elif isinstance(selected_diseases, list):
        diseases_to_run = [
            d for d in selected_diseases
            if d in matched
        ]
        # Warn about diseases the user asked for but cannot be evaluated
        skipped = set(selected_diseases) - set(diseases_to_run)
        for s in skipped:
            reason = (
                "not in registry"
                if s not in DISEASE_REGISTRY
                else "missing required columns"
            )
            warnings.warn(
                f"Skipping '{s}': {reason}.",
                stacklevel=2,
            )
    else:
        diseases_to_run = matched

    # ── Iterate diseases ─────────────────────────────────────────────
    for disease in diseases_to_run:
        config = DISEASE_REGISTRY[disease]
        required_cols = config["required_columns"]
        threshold = config["threshold"]

        try:
            # 1. Load model (cached)
            model = load_model(config["model_path"])

            # 2. Prepare feature DataFrame for the LAST row (most recent)
            #    Pass DataFrame (not .values) — Pipeline ColumnTransformers
            #    need named columns.
            feature_row = df[required_cols].iloc[[-1]]
            ml_prob = _get_ml_probability(model, feature_row)

            # 3. Rule-based score
            rule_fn = RULE_FUNCTIONS.get(disease)
            rule_score = rule_fn(df.iloc[-1]) if rule_fn else 0

            # 4. Hybrid decision
            risk_level = hybrid_decision(rule_score, ml_prob, threshold)

            # 5. Trend detection (uses first required column as metric)
            trend = detect_trend(df, required_cols[0])

            # 6. Alert
            alert = generate_alert(risk_level, trend)

            results[disease] = {
                "probability": round(ml_prob, 4),
                "rule_score": rule_score,
                "risk_level": risk_level,
                "trend": trend,
                "alert": alert,
            }

        except Exception as exc:  # noqa: BLE001
            results[disease] = {
                "error": str(exc),
                "probability": None,
                "rule_score": None,
                "risk_level": "Unknown",
                "trend": "Unknown",
                "alert": "ERROR",
            }

    return results
