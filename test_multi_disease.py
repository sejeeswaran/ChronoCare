import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))
sys.path.append(os.path.dirname(__file__))

import pandas as pd
from backend.multi_disease_engine import predict_risks
from api.pipeline import enrich_patient_data

data = [{
    "patient_id": "PAT-1002",
    "AGE": 52,
    "BMI": 31.2,
    "GLUCOSE": 180,
    "BLOODPRESSURE": 92,
    "SKINTHICKNESS": 28,
    "INSULIN": 150,
    "DIABETESPEDIGREEFUNCTION": 0.471,
    "PREGNANCIES": 3,
    "THAL": 1,
    "RBC": 1,
    "HTN": 1,
    "EXERCISE_LEVEL": "Low",
    "SMOKING_STATUS": "Non-Smoker",
    "HEMO": 13.5,
    "SC": 1.2
}]

print("Enriching data...")
try:
    df = enrich_patient_data(data)
    print("Data Enriched", df.shape)

    print("Running predict_risks...")
    results = predict_risks(df, selected_diseases=["diabetes", "hypertension", "ckd", "cardio"])
    print("Success!")
    print(results)
except Exception as e:
    import traceback
    traceback.print_exc()
