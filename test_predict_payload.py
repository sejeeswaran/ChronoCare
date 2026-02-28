import requests

payload = {
    "patient_id": "PAT-1002",
    "patient_data": [{
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
    }],
    "selected_diseases": None
}

print("POSTing to /api/predict...")
try:
    r = requests.post("http://127.0.0.1:5000/api/predict", json=payload)
    print("Status code:", r.status_code)
    print("Response text:", r.text)
except Exception as e:
    print("Exception:", e)
