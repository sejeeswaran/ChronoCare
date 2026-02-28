"""
Disease Registry
================
Central configuration for all supported diseases.

To add a new disease, simply add a new entry to DISEASE_REGISTRY.
No other file needs to be modified — the engine will pick it up
automatically.

NOTE: ``required_columns`` must match the feature names expected by
each model's ColumnTransformer (extracted via
``model.named_steps['preprocessor'].feature_names_in_``).
"""

import os
from pathlib import Path

_MODULE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

DISEASE_REGISTRY = {
    "diabetes": {
        "model_path": str(_MODULE_DIR / "models" / "diabetes_model.pkl"),
        "required_columns": [
            "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
            "Insulin", "BMI", "DiabetesPedigreeFunction", "Age",
        ],
        "threshold": 0.5,
    },
    "hypertension": {
        "model_path": str(_MODULE_DIR / "models" / "hypertension_model.pkl"),
        "required_columns": [
            "Age", "Salt_Intake", "Stress_Score", "BP_History",
            "Sleep_Duration", "BMI", "Medication", "Family_History",
            "Exercise_Level", "Smoking_Status",
        ],
        "threshold": 0.5,
    },
    "ckd": {
        "model_path": str(_MODULE_DIR / "models" / "ckd_model.pkl"),
        "required_columns": [
            "Bp", "Sg", "Al", "Su", "Rbc", "Bu", "Sc",
            "Sod", "Pot", "Hemo", "Wbcc", "Rbcc", "Htn",
        ],
        "threshold": 0.5,
    },
    "cardio": {
        "model_path": str(_MODULE_DIR / "models" / "cardio_xgb_model.pkl"),
        "required_columns": [
            "age", "sex", "cp", "trestbps", "chol", "fbs",
            "restecg", "thalach", "exang", "oldpeak", "slope",
            "ca", "thal",
        ],
        "threshold": 0.5,
    },
}
