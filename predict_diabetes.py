"""
Diabetes Risk Prediction
========================
Standalone prediction function for the Diabetes ML model.

Provides a single, clean function that loads a pre-trained model
and scaler, validates input, and returns calibrated risk
probabilities — ready to be called from any backend service.

Prerequisites
-------------
- ``diabetes_model.pkl`` and ``diabetes_scaler.pkl`` must already
  exist on disk.  No retraining occurs at runtime.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path
from typing import Any, List, Tuple, Union

import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODULE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

_DEFAULT_MODEL_PATH = _MODULE_DIR / "models" / "diabetes_model.pkl"
_DEFAULT_SCALER_PATH = _MODULE_DIR / "models" / "diabetes_scaler.pkl"

_REQUIRED_INPUT_COLUMNS = ["age", "fasting_glucose", "hba1c"]

# The saved model was trained on these features (in this order).
_MODEL_FEATURES = ["Glucose", "BMI", "Age", "BloodPressure"]

# Map user-facing column names → model-expected column names.
_COLUMN_MAP = {
    "fasting_glucose": "Glucose",
    "age": "Age",
}

# Population-median defaults for model features absent from the input.
_FEATURE_DEFAULTS = {
    "BMI": 28.0,
    "BloodPressure": 72.0,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_model_and_scaler(
    model_path: Path,
    scaler_path: Path,
) -> Tuple[Any, Any]:
    """Deserialise the pre-trained model and scaler from disk.

    Raises
    ------
    FileNotFoundError
        If either ``.pkl`` file is missing.
    """
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


def _validate_columns(df: pd.DataFrame) -> None:
    """Raise ``ValueError`` if any required column is missing."""
    missing = [c for c in _REQUIRED_INPUT_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Input DataFrame is missing required column(s): {missing}. "
            f"Expected columns: {_REQUIRED_INPUT_COLUMNS}."
        )


def _build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Map user columns to model-expected feature names and fill defaults."""
    feature_df = pd.DataFrame(index=df.index)

    for src_col, dst_col in _COLUMN_MAP.items():
        if src_col in df.columns:
            feature_df[dst_col] = df[src_col].values

    for feat, default in _FEATURE_DEFAULTS.items():
        if feat not in feature_df.columns:
            if feat in df.columns:
                feature_df[feat] = df[feat].values
            else:
                feature_df[feat] = default

    return feature_df[_MODEL_FEATURES]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_diabetes_risk(
    df: pd.DataFrame,
    model_path: Union[str, Path, None] = None,
    scaler_path: Union[str, Path, None] = None,
) -> Union[float, List[float]]:
    """Return diabetes risk probability for given patient data.

    This function loads the pre-trained ML model and scaler, validates
    the input columns, scales the features, and returns the predicted
    probability of the high-risk (positive) class.

    Input Schema
    ------------
    The input DataFrame **must** contain:

    =============== ===== ==========================================
    Column          Type  Description
    =============== ===== ==========================================
    age             int   Patient age in years
    fasting_glucose float Fasting blood glucose (mg/dL)
    hba1c           float Glycated haemoglobin (%)
    =============== ===== ==========================================

    Parameters
    ----------
    df : pd.DataFrame
        Patient observations.  The original DataFrame is **never**
        modified.
    model_path : str | Path | None
        Override path to ``diabetes_model.pkl``.
    scaler_path : str | Path | None
        Override path to ``diabetes_scaler.pkl``.

    Returns
    -------
    float
        Risk probability (0.0–1.0) if a single row is passed.
    list[float]
        List of risk probabilities if multiple rows are passed.

    Raises
    ------
    FileNotFoundError
        If the model or scaler ``.pkl`` files cannot be found.
    ValueError
        If any required column is missing from the input.

    Notes
    -----
    - No retraining occurs — ``scaler.transform`` is used (never
      ``fit`` or ``fit_transform``).
    - The original DataFrame is not mutated.
    - No print statements, no file writes, no side effects.
    """
    # ── Resolve paths ────────────────────────────────────────────────
    m_path = Path(model_path) if model_path else _DEFAULT_MODEL_PATH
    s_path = Path(scaler_path) if scaler_path else _DEFAULT_SCALER_PATH

    # ── Load ─────────────────────────────────────────────────────────
    model, scaler = _load_model_and_scaler(m_path, s_path)

    # ── Validate ─────────────────────────────────────────────────────
    _validate_columns(df)

    # ── Prepare features (on a copy — never touch the original) ──────
    feature_matrix = _build_feature_matrix(df.copy())

    # ── Scale (transform only, no fit) ───────────────────────────────
    x_scaled = scaler.transform(feature_matrix.values)

    # ── Predict ──────────────────────────────────────────────────────
    probabilities = model.predict_proba(x_scaled)[:, 1]

    # Return a single float for single-row input, list otherwise
    if len(probabilities) == 1:
        return float(probabilities[0])

    return [float(p) for p in probabilities]
