"""
Data mapping pipeline.
Maps sparse frontend data to the complete features required by the backend ML models.

Every field has a clinically reasonable default so that NO input field
is mandatory.  The user can submit a completely empty form and the
backend will still produce valid (baseline) predictions.
"""
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime

# ──────────────────────────────────────────────────────────────────────
# Comprehensive defaults — every column used by every disease model
# must have a safe, clinically neutral baseline value here.
#
# These are medically "normal/neutral" values so baseline risk is low.
# ──────────────────────────────────────────────────────────────────────
DEFAULT_VALUES = {
    # ── Shared / General ──
    "Age": 30, "age": 30, "BMI": 25.0,

    # ── Diabetes model ──
    "Pregnancies": 0, "Glucose": 100, "BloodPressure": 80,
    "SkinThickness": 20, "Insulin": 80, "DiabetesPedigreeFunction": 0.5,

    # ── Hypertension model ──
    "Salt_Intake": 5, "Stress_Score": 5, "BP_History": "Normal",
    "Sleep_Duration": 7, "Medication": "None", "Family_History": "No",
    "Exercise_Level": "Moderate", "Smoking_Status": "Non-Smoker",

    # ── CKD model ──
    "Bp": 80, "Sg": 1.020, "Al": 0, "Su": 0, "Rbc": 1,
    "Bu": 40, "Sc": 1.0, "Sod": 140, "Pot": 4.5,
    "Hemo": 15.0, "Wbcc": 8000, "Rbcc": 5.0, "Htn": 0,

    # ── Cardio model ──
    "sex": 1, "cp": 1, "trestbps": 120, "chol": 200, "fbs": 0,
    "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.0,
    "slope": 1, "ca": 0, "thal": 2,
}


def enrich_patient_data(patient_data_list: List[Dict[str, Any]]) -> pd.DataFrame:
    """Transform sparse frontend data into a fully populated DataFrame.

    Steps:
    1. Start with comprehensive DEFAULT_VALUES as the baseline.
    2. Overlay whatever the user actually provided.
    3. Run cross-field mappings (Age ↔ age, BloodPressure → Bp/trestbps, etc.)
    4. Result: a row that has EVERY column any model could need.
    """
    enriched_data = []

    for row in patient_data_list:
        enriched_row = DEFAULT_VALUES.copy()

        # Merge frontend data (overrides defaults)
        for k, v in row.items():
            enriched_row[k] = v

        # ── Cross-field mappings ──────────────────────────────────

        # Age ↔ age  (diabetes/hypertension use "Age", cardio uses "age")
        if "Age" in row:
            enriched_row["age"] = float(row["Age"])
        elif "age" in row:
            enriched_row["Age"] = float(row["age"])

        # BloodPressure → Bp (CKD) & trestbps (Cardio)
        if "BloodPressure" in row:
            val = float(row["BloodPressure"])
            enriched_row["Bp"] = val
            enriched_row["trestbps"] = val
        elif "Bp" in row:
            enriched_row["BloodPressure"] = float(row["Bp"])
            enriched_row["trestbps"] = float(row["Bp"])
        elif "trestbps" in row:
            enriched_row["BloodPressure"] = float(row["trestbps"])
            enriched_row["Bp"] = float(row["trestbps"])

        # Glucose → fbs (Cardio)
        if "Glucose" in row:
            val = float(row["Glucose"])
            enriched_row["fbs"] = 1 if val > 120 else 0

        # BMI sync
        if "BMI" in row:
            enriched_row["BMI"] = float(row["BMI"])

        # ── Date for time engine ──────────────────────────────────
        if "date" not in row and "Date" not in row:
            enriched_row["date"] = datetime.now().strftime("%Y-%m-%d")
        else:
            enriched_row["date"] = row.get("date", row.get("Date"))

        enriched_data.append(enriched_row)

    return pd.DataFrame(enriched_data)
