import requests, json, time

BASE = 'http://127.0.0.1:5000/api'

# 1. Check health
print("=== Health Check ===")
r = requests.get(f'{BASE}/../health', timeout=5)
print(f"  Status: {r.json()}")

# 2. Run prediction (saves async to Drive)
print("\n=== Running Prediction for PAT-1001 ===")
r = requests.post(f'{BASE}/predict', json={
    'patient_id': 'PAT-1001',
    'patient_data': [{'Age': 55, 'Glucose': 180, 'BMI': 32.5, 'BloodPressure': 85}],
    'selected_diseases': None
}, timeout=30)
print(f"  Status: {r.status_code}")
data = r.json()
print(f"  Storage: {data.get('__storage')}")
diseases = [k for k in data if k != '__storage' and k != 'error']
print(f"  Diseases: {diseases}")

# 3. Wait for async save
print("\n  Waiting 8s for async Drive upload...")
time.sleep(8)

# 4. Check timeline
print("\n=== Timeline for PAT-1001 ===")
r2 = requests.get(f'{BASE}/timeline/PAT-1001', timeout=15)
t = r2.json()
print(f"  Records: {t['count']}")
if t.get('history'):
    print(f"  Latest: {json.dumps(t['history'][-1], indent=2)}")
else:
    print("  No history yet")

# 5. Check patients list
print("\n=== Patient List ===")
r3 = requests.get(f'{BASE}/patients', timeout=5)
print(f"  {r3.json()}")

# 6. Test PDF export
print("\n=== PDF Export ===")
disease_data = {k: v for k, v in data.items() if k not in ('__storage', 'error')}
r4 = requests.post(f'{BASE}/export-pdf', json={
    'patient_id': 'PAT-1001',
    'results': disease_data,
    'input_data': {'Age': 55, 'Glucose': 180}
}, timeout=15)
print(f"  Status: {r4.status_code}, Size: {len(r4.content)} bytes")

print("\n=== ALL TESTS COMPLETE ===")
