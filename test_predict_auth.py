import sys
import os
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from auth import generate_token

# 1. Generate fake token
mock_user = {
    "id": "test-uuid",
    "email": "test@example.com",
    "role": "doctor",
    "patient_id": None
}
token = generate_token(mock_user)

# 2. Build exact payload from the UI screenshot
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
        "HTN": 1,
        "EXERCISE_LEVEL": "Low",
        "SMOKING_STATUS": "Non-Smoker",
        "HEMO": 13.5,
        "SC": 1.2
    }],
    "selected_diseases": None
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("POSTing to /api/predict...")
try:
    r = requests.post("http://127.0.0.1:5000/api/predict", json=payload, headers=headers)
    print("Status code:", r.status_code)
    try:
        print("Response:", r.json())
    except Exception:
        print("Response text:", r.text)
except Exception as e:
    print("Exception during request:", e)
