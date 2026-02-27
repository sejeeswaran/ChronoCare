"""
Diabetes Risk Prediction
========================
Standalone prediction function for the Diabetes ML model.

Provides a single, clean function that loads a pre-trained model,
validates input, and returns calibrated risk
probabilities — ready to be called from any backend service.

Prerequisites
-------------
- ``diabetes_model.pkl`` must already exist on disk.
  No retraining occurs at runtime.
"""

from __future__ import annotations

import os
import pickle
from pathlib import Path
from typing import Any, List, Union

import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MODULE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

_DEFAULT_MODEL_PATH = _MODULE_DIR / "models" / "diabetes_model.pkl"

_REQUIRED_INPUT_COLUMNS = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness", 
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_model(model_path: Path) -> Any:
    """Deserialise the pre-trained model from disk.

    Raises
    ------
    FileNotFoundError
        If the ``.pkl`` file is missing.
    """
    if not model_path.exists():
        raise FileNotFoundError(
            f"ML model not found at: {model_path}. "
            "Ensure 'models/diabetes_model.pkl' exists."
        )

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    return model


def _validate_columns(df: pd.DataFrame) -> None:
    """Raise ``ValueError`` if any required column is missing."""
    missing = [c for c in _REQUIRED_INPUT_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Input DataFrame is missing required column(s): {missing}. "
            f"Expected columns: {_REQUIRED_INPUT_COLUMNS}."
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_diabetes_risk(
    df: pd.DataFrame,
    model_path: Union[str, Path, None] = None,
) -> Union[float, List[float]]:
    """Return diabetes risk probability for given patient data.

    This function loads the pre-trained ML model, validates
    the input columns, and returns the predicted
    probability of the high-risk (positive) class.

    Input Schema
    ------------
    The input DataFrame **must** contain:
    - Pregnancies
    - Glucose
    - BloodPressure
    - SkinThickness
    - Insulin
    - BMI
    - DiabetesPedigreeFunction
    - Age

    Parameters
    ----------
    df : pd.DataFrame
        Patient observations.  The original DataFrame is **never**
        modified.
    model_path : str | Path | None
        Override path to ``diabetes_model.pkl``.

    Returns
    -------
    float
        Risk probability (0.0–1.0) if a single row is passed.
    list[float]
        List of risk probabilities if multiple rows are passed.

    Raises
    ------
    FileNotFoundError
        If the model ``.pkl`` file cannot be found.
    ValueError
        If any required column is missing from the input.

    Notes
    -----
    - No retraining occurs.
    - The original DataFrame is not mutated.
    - No print statements, no file writes, no side effects.
    """
    # ── Resolve paths ────────────────────────────────────────────────
    m_path = Path(model_path) if model_path else _DEFAULT_MODEL_PATH

    # ── Load ─────────────────────────────────────────────────────────
    model = _load_model(m_path)

    # ── Validate ─────────────────────────────────────────────────────
    _validate_columns(df)

    # ── Prepare features (on a copy — never touch the original) ──────
    feature_matrix = df[_REQUIRED_INPUT_COLUMNS].copy()

    # ── Predict ──────────────────────────────────────────────────────
    probabilities = model.predict_proba(feature_matrix.values)[:, 1]

    # Return a single float for single-row input, list otherwise
    if len(probabilities) == 1:
        return float(probabilities[0])

    return [float(p) for p in probabilities]
