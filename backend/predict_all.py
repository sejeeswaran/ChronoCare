"""
Multi-Disease Risk Prediction
==============================
Aggregation layer that runs all available disease-specific ML
predictions in a single call.

Usage
-----
::

    from predict_all import predict_all_risks

    results = predict_all_risks(patient_df)
    # {
    #     "diabetes_risk": 0.82,
    #     "hypertension_risk": 0.45,
    # }

Each disease prediction is **independent** — models are never merged.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

import pandas as pd

from predict_diabetes import predict_diabetes_risk
from predict_hypertension import predict_hypertension_risk
from predict_ckd import predict_ckd_risk


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_all_risks(
    df: pd.DataFrame,
) -> Dict[str, Union[float, List[float]]]:
    """Run all disease-specific ML predictions and return results.

    Calls each prediction function independently and collects the
    results into a single dictionary.  Models are **never merged** —
    each prediction uses its own model and scaler.

    Parameters
    ----------
    df : pd.DataFrame
        Patient observations.  Must contain the columns required by
        **each** disease predictor:

        - Diabetes:      ``Pregnancies``, ``Glucose``, ``BloodPressure``,
                         ``SkinThickness``, ``Insulin``, ``BMI``,
                         ``DiabetesPedigreeFunction``, ``Age``
        - Hypertension:  ``age``, ``systolic_bp``, ``diastolic_bp``
        - CKD:           ``age``, ``bp``, ``sg``, ``al``, ``su``, ``rbc``,
                         ``pc``, ``pcc``, ``ba``, ``bgr``, ``bu``, ``sc``,
                         ``sod``, ``pot``, ``hemo``, ``pcv``, ``wc``, ``rc``,
                         ``htn``, ``dm``, ``cad``, ``appet``, ``pe``, ``ane``

        Columns not required by a particular model are ignored by
        that model.  The original DataFrame is **never** modified.

    Returns
    -------
    dict[str, float | list[float]]
        ``{"diabetes_risk": ..., "hypertension_risk": ..., "ckd_risk": ...}``

        Each value is a ``float`` for single-row input or a
        ``list[float]`` for multi-row input.

    Raises
    ------
    ValueError
        If columns required by any disease predictor are missing.
    FileNotFoundError
        If any model ``.pkl`` file is missing on disk.

    Notes
    -----
    - No retraining occurs.
    - No side effects (no prints, no file writes).
    - Predictions are independent; a failure in one does **not**
      prevent the other from running.
    """
    return {
        "diabetes_risk": predict_diabetes_risk(df),
        "hypertension_risk": predict_hypertension_risk(df),
        "ckd_risk": predict_ckd_risk(df),
    }
