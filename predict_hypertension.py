"""
Hypertension Risk Prediction
=============================
Standalone prediction function for the Hypertension ML model.

Usage
-----
::

    from predict_hypertension import predict_hypertension_risk

    prob = predict_hypertension_risk(patient_df)

Prerequisites
-------------
- ``models/hypertension_model.pkl`` and ``models/hypertension_scaler.pkl``
  must already exist on disk.  No retraining occurs at runtime.
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

_DEFAULT_MODEL_PATH = _MODULE_DIR / "models" / "hypertension_model.pkl"
_DEFAULT_SCALER_PATH = _MODULE_DIR / "models" / "hypertension_scaler.pkl"

_REQUIRED_COLUMNS = ["age", "systolic_bp", "diastolic_bp"]


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
            f"Hypertension model not found at: {model_path}. "
            "Ensure 'models/hypertension_model.pkl' exists."
        )
    if not scaler_path.exists():
        raise FileNotFoundError(
            f"Hypertension scaler not found at: {scaler_path}. "
            "Ensure 'models/hypertension_scaler.pkl' exists."
        )

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


def _validate_columns(df: pd.DataFrame) -> None:
    """Raise ``ValueError`` if any required column is missing."""
    missing = [c for c in _REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Input DataFrame is missing required column(s): {missing}. "
            f"Expected columns: {_REQUIRED_COLUMNS}."
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_hypertension_risk(
    df: pd.DataFrame,
    model_path: Union[str, Path, None] = None,
    scaler_path: Union[str, Path, None] = None,
) -> Union[float, List[float]]:
    """Return hypertension risk probability for given patient data.

    This function loads the pre-trained hypertension ML model and
    scaler, validates input, scales features, and returns the
    predicted probability of the high-risk (positive) class.

    Input Schema
    ------------
    The input DataFrame **must** contain:

    ============ ===== ==========================================
    Column       Type  Description
    ============ ===== ==========================================
    age          int   Patient age in years
    systolic_bp  float Systolic blood pressure (mmHg)
    diastolic_bp float Diastolic blood pressure (mmHg)
    ============ ===== ==========================================

    Parameters
    ----------
    df : pd.DataFrame
        Patient observations.  The original is **never** modified.
    model_path : str | Path | None
        Override path to ``hypertension_model.pkl``.
    scaler_path : str | Path | None
        Override path to ``hypertension_scaler.pkl``.

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
    - No retraining occurs — only ``scaler.transform`` is used.
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

    # ── Prepare features (copy — never touch original) ───────────────
    features = df[_REQUIRED_COLUMNS].copy()

    # ── Scale (transform only, no fit) ───────────────────────────────
    x_scaled = scaler.transform(features.values)

    # ── Predict ──────────────────────────────────────────────────────
    probabilities = model.predict_proba(x_scaled)[:, 1]

    # Single float for single-row input, list otherwise
    if len(probabilities) == 1:
        return float(probabilities[0])

    return [float(p) for p in probabilities]
