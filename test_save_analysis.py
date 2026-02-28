import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from multi_disease_engine import predict_risks
from api.pipeline import enrich_patient_data
from drive_storage import save_analysis

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
    "HTN": 1,
    "EXERCISE_LEVEL": "Low",
    "SMOKING_STATUS": "Non-Smoker",
    "HEMO": 13.5,
    "SC": 1.2
}]

print("Enriching...")
df = enrich_patient_data(data)
print("Predicting...")
results = predict_risks(df, "all")
print("Saving Analysis...")
try:
    save_analysis(patient_id="PAT-1002", results=results, input_data=data[0])
    print("Done!")
except Exception as e:
    print("Exception", type(e).__name__, str(e))
