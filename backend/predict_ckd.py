"""
Chronic Kidney Disease (CKD) Risk Prediction
=============================================
Standalone prediction function for the CKD ML model.

Usage
-----
::

    from predict_ckd import predict_ckd_risk

    prob = predict_ckd_risk(patient_df)

Prerequisites
-------------
- ``models/ckd_model.pkl`` must already exist on disk.
- The model handles all preprocessing (scaling, encoding) internally
  via a scikit-learn Pipeline. No additional transformations are needed.
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

_DEFAULT_MODEL_PATH = _MODULE_DIR / "models" / "ckd_model.pkl"

_REQUIRED_COLUMNS = [
    "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba",
    "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wc", "rc",
    "htn", "dm", "cad", "appet", "pe", "ane"
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
            f"CKD model not found at: {model_path}. "
            "Ensure 'models/ckd_model.pkl' exists."
        )

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    return model

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

def predict_ckd_risk(
    df: pd.DataFrame,
    model_path: Union[str, Path, None] = None,
) -> Union[float, List[float]]:
    """Return Chronic Kidney Disease (CKD) risk probability for given patient data.

    This function loads the pre-trained CKD ML Pipeline, validates input,
    and returns the predicted probability of the high-risk (positive) class.
    All preprocessing is handled internally by the configured Pipeline.

    Input Schema
    ------------
    The input DataFrame **must** contain 24 specific clinical features
    associated with CKD diagnosis (e.g., age, bp, sg, al, su...).
    Original 'id' and 'classification' columns are not required.

    Parameters
    ----------
    df : pd.DataFrame
        Patient observations. The original is **never** modified.
    model_path : str | Path | None
        Override path to ``ckd_model.pkl``.

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
    - No manual preprocessing or scaling occurs; the model pipeline handles it.
    - The original DataFrame is not mutated.
    - No print statements, no file writes, no side effects.
    """
    # ── Resolve paths ────────────────────────────────────────────────
    m_path = Path(model_path) if model_path else _DEFAULT_MODEL_PATH

    # ── Load ─────────────────────────────────────────────────────────
    model = _load_model(m_path)

    # ── Validate ─────────────────────────────────────────────────────
    _validate_columns(df)

    # ── Prepare features (copy — never touch original) ───────────────
    features = df[_REQUIRED_COLUMNS].copy()

    # ── Predict ──────────────────────────────────────────────────────
    probabilities = model.predict_proba(features)[:, 1]

    # Single float for single-row input, list otherwise
    if len(probabilities) == 1:
        return float(probabilities[0])

    return [float(p) for p in probabilities]
