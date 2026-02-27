"""
Hybrid Risk Engine
==================
Production-ready module that combines the rule-based risk engine
(primary decision authority) with a trained ML model for probability
refinement.

Architecture Philosophy
-----------------------
- The **rule-based engine** is the primary authority.  Its classifications
  are never downgraded by the ML model.
- The **ML model** provides calibrated probabilities that can *escalate*
  a patient's risk (e.g. Low → High if ML probability ≥ 0.75) but can
  never *reduce* a classification made by the rule engine.

Dependencies
------------
- ``risk_engine.py``   – must already be accessible on ``sys.path``.
- ``diabetes_model.pkl``  – pre-trained scikit-learn classifier.
- ``diabetes_scaler.pkl`` – fitted StandardScaler for feature normalisation.

Functions
---------
- load_ml_components       : Load model + scaler from disk.
- predict_ml_probability   : Add ML-derived probability column.
- final_hybrid_decision    : Row-level hybrid classification logic.
- apply_hybrid_engine      : DataFrame-level orchestrator.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path
from typing import Any, Tuple

import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODULE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

_DEFAULT_MODEL_PATH = _MODULE_DIR / "models" / "diabetes_model.pkl"
_DEFAULT_SCALER_PATH = _MODULE_DIR / "models" / "diabetes_scaler.pkl"

_ML_FEATURES = ["Glucose", "BMI", "Age", "BloodPressure"]

# Mapping from the user's input DataFrame columns → model's expected names.
# Missing features get a population-median default so the model still works.
_COLUMN_MAP = {
    "fasting_glucose": "Glucose",
    "age": "Age",
}
_FEATURE_DEFAULTS = {
    "BMI": 28.0,            # population median fallback
    "BloodPressure": 72.0,  # population median fallback
}


# ---------------------------------------------------------------------------
# 1. Load ML Components
# ---------------------------------------------------------------------------

def load_ml_components(
    model_path: str | Path | None = None,
    scaler_path: str | Path | None = None,
) -> Tuple[Any, Any]:
    """Load the pre-trained ML model and its associated scaler.

    Parameters
    ----------
    model_path : str | Path | None
        Path to ``diabetes_model.pkl``.  Defaults to the project root.
    scaler_path : str | Path | None
        Path to ``diabetes_scaler.pkl``.  Defaults to the project root.

    Returns
    -------
    tuple[model, scaler]
        The deserialised scikit-learn model and ``StandardScaler``.

    Raises
    ------
    FileNotFoundError
        If either ``.pkl`` file does not exist at the specified path.
    """
    model_path = Path(model_path) if model_path else _DEFAULT_MODEL_PATH
    scaler_path = Path(scaler_path) if scaler_path else _DEFAULT_SCALER_PATH

    if not model_path.exists():
        raise FileNotFoundError(
            f"ML model not found at: {model_path}. "
            "Ensure 'diabetes_model.pkl' exists."
        )
    if not scaler_path.exists():
        raise FileNotFoundError(
            f"Scaler not found at: {scaler_path}. "
            "Ensure 'diabetes_scaler.pkl' exists."
        )

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


# ---------------------------------------------------------------------------
# 2. ML Probability Prediction
# ---------------------------------------------------------------------------

def predict_ml_probability(
    df: pd.DataFrame,
    model: Any | None = None,
    scaler: Any | None = None,
) -> pd.DataFrame:
    """Add an ``ml_probability`` column derived from the ML model.

    Workflow
    --------
    1. Map input columns to the model's expected feature names
       (e.g. ``fasting_glucose`` → ``Glucose``, ``age`` → ``Age``).
    2. Fill missing features (``BMI``, ``BloodPressure``) with
       population-median defaults.
    3. Scale features and compute class-1 probability.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain at least ``fasting_glucose`` and ``age``.
    model : sklearn estimator, optional
        Pre-trained classifier.  Loaded from disk if not supplied.
    scaler : sklearn transformer, optional
        Fitted scaler.  Loaded from disk if not supplied.

    Returns
    -------
    pd.DataFrame
        A **copy** of *df* with the ``ml_probability`` column added.
    """
    if model is None or scaler is None:
        model, scaler = load_ml_components()

    result = df.copy()

    # Build a temporary frame with model-expected column names
    feature_df = pd.DataFrame(index=result.index)
    for src_col, dst_col in _COLUMN_MAP.items():
        if src_col in result.columns:
            feature_df[dst_col] = result[src_col].values

    # Fill model features that are absent from the input
    for feat, default in _FEATURE_DEFAULTS.items():
        if feat not in feature_df.columns:
            if feat in result.columns:
                feature_df[feat] = result[feat].values
            else:
                feature_df[feat] = default

    # Ensure column order matches model expectation
    x_raw = feature_df[_ML_FEATURES].values
    x_scaled = scaler.transform(x_raw)

    # Probability of the positive (high-risk) class
    result["ml_probability"] = model.predict_proba(x_scaled)[:, 1]

    return result


# ---------------------------------------------------------------------------
# 3. Hybrid Decision Logic
# ---------------------------------------------------------------------------

def final_hybrid_decision(row: pd.Series) -> str:
    """Determine the final risk classification using hybrid logic.

    Decision matrix
    ---------------
    1. If the rule engine classified **High Risk** → stays ``"High Risk"``
       *(rule-based authority is never overridden)*.
    2. If ML probability ≥ 0.75 → escalate to ``"High Risk"``
       *(ML can raise risk, not lower it)*.
    3. If rule engine classified **Moderate Risk** → ``"Moderate Risk"``.
    4. Otherwise → ``"Low Risk"``.

    Parameters
    ----------
    row : pd.Series
        Must contain ``risk_category`` (from rule engine) and
        ``ml_probability`` (from ML model).

    Returns
    -------
    str
        ``"High Risk"``, ``"Moderate Risk"``, or ``"Low Risk"``.
    """
    # Rule-based system is the primary authority — never downgrade
    if row["risk_category"] == "High Risk":
        return "High Risk"

    # ML can escalate risk when probability is very high
    if row["ml_probability"] >= 0.75:
        return "High Risk"

    # Preserve rule engine's moderate classification
    if row["risk_category"] == "Moderate Risk":
        return "Moderate Risk"

    return "Low Risk"


# ---------------------------------------------------------------------------
# 4. DataFrame-Level Hybrid Engine
# ---------------------------------------------------------------------------

def apply_hybrid_engine(
    df: pd.DataFrame,
    model: Any | None = None,
    scaler: Any | None = None,
) -> pd.DataFrame:
    """Apply the full hybrid engine pipeline to an enriched DataFrame.

    Assumes the input *df* already contains:
    - ``rule_score``     (from ``apply_rule_engine``)
    - ``risk_category``  (from ``apply_rule_engine``)
    - ``risk_label``     (from ``apply_rule_engine``)

    Adds:
    - ``ml_probability`` – float, model-derived risk probability
    - ``final_risk``     – str, hybrid classification

    Parameters
    ----------
    df : pd.DataFrame
        Rule-engine-enriched DataFrame.
    model : sklearn estimator, optional
        Pre-trained classifier.  Loaded from disk if not supplied.
    scaler : sklearn transformer, optional
        Fitted scaler.  Loaded from disk if not supplied.

    Returns
    -------
    pd.DataFrame
        A **copy** of *df* with ``ml_probability`` and ``final_risk``.
    """
    # Step 1: Add ML probability column
    result = predict_ml_probability(df, model=model, scaler=scaler)

    # Step 2: Apply hybrid decision row-wise
    result["final_risk"] = result.apply(final_hybrid_decision, axis=1)

    return result
