import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.append(os.path.dirname(__file__))

import pandas as pd
from backend.hybrid_engine import HybridIntelligenceEngine

engine = HybridIntelligenceEngine()

data = [{
    "patient_id": "TEST",
    "age": 52,
    "bmi": 31.2,
    "glucose": 180,
    "bloodpressure": 92,
    "insulin": 150,
    "skinthickness": 28,
    "pregnancies": 3,
    "diabetespedigreefunction": 0.471
}]
df = pd.DataFrame(data)

print("Running engine.process_patient_batch...")
try:
    results = engine.process_patient_batch(df, selected_diseases=["diabetes"])
    print("Success!")
    print(results)
except Exception as e:
    print(f"Python Exception: {e}")
