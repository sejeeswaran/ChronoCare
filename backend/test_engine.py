"""
Test Engine
===========
End-to-end smoke test for the Hybrid Chronic Risk Intelligence Engine.

Creates synthetic patient data that covers all three diseases
(diabetes, hypertension, CKD) and exercises both "all" and
single-disease selection modes.
"""

from __future__ import annotations

import json
import sys

import numpy as np
import pandas as pd

from multi_disease_engine import predict_risks


# ---------------------------------------------------------------------------
# Synthetic data helpers
# ---------------------------------------------------------------------------

def _build_sample_df(n_rows: int = 20) -> pd.DataFrame:
    """Build a synthetic DataFrame with columns for all 3 diseases.

    Column names and data types match what each model's Pipeline
    ColumnTransformer was trained on.

    Includes a ``date`` column so the timeline engine can run.
    """
    rng = np.random.default_rng(42)

    dates = pd.date_range(end="2026-02-27", periods=n_rows, freq="D")

    data = {
        # ----- date -----
        "date": dates,

        # ===== DIABETES (8 numeric features) =====
        "Pregnancies": rng.integers(0, 10, n_rows),
        "Glucose": rng.integers(70, 200, n_rows),
        "BloodPressure": rng.integers(50, 120, n_rows),
        "SkinThickness": rng.integers(10, 50, n_rows),
        "Insulin": rng.integers(15, 300, n_rows),
        "BMI": np.round(rng.uniform(18.0, 45.0, n_rows), 1),
        "DiabetesPedigreeFunction": np.round(
            rng.uniform(0.1, 2.0, n_rows), 3
        ),
        "Age": rng.integers(21, 80, n_rows),

        # ===== HYPERTENSION =====
        # 5 numeric
        # (Age and BMI reused from diabetes)
        "Salt_Intake": np.round(rng.uniform(1.0, 15.0, n_rows), 1),
        "Stress_Score": np.round(rng.uniform(1.0, 10.0, n_rows), 1),
        "Sleep_Duration": np.round(rng.uniform(3.0, 10.0, n_rows), 1),
        # 5 categorical (exact labels from OneHotEncoder.categories_)
        "BP_History": rng.choice(
            ["Hypertension", "Normal", "Prehypertension"], n_rows
        ),
        "Medication": rng.choice(
            ["ACE Inhibitor", "Beta Blocker", "Diuretic", "Other"], n_rows
        ),
        "Family_History": rng.choice(["No", "Yes"], n_rows),
        "Exercise_Level": rng.choice(["High", "Low", "Moderate"], n_rows),
        "Smoking_Status": rng.choice(["Non-Smoker", "Smoker"], n_rows),

        # ===== CKD (all 13 columns are numeric) =====
        "Bp": rng.integers(50, 100, n_rows).astype(float),
        "Sg": np.round(rng.uniform(1.005, 1.025, n_rows), 3),
        "Al": rng.integers(0, 6, n_rows).astype(float),
        "Su": rng.integers(0, 6, n_rows).astype(float),
        "Rbc": rng.integers(0, 2, n_rows).astype(float),      # numeric
        "Bu": np.round(rng.uniform(10, 200, n_rows), 1),
        "Sc": np.round(rng.uniform(0.4, 10.0, n_rows), 1),
        "Sod": np.round(rng.uniform(100, 160, n_rows), 1),
        "Pot": np.round(rng.uniform(2.5, 7.0, n_rows), 1),
        "Hemo": np.round(rng.uniform(5.0, 18.0, n_rows), 1),
        "Wbcc": rng.integers(3000, 20000, n_rows).astype(float),
        "Rbcc": np.round(rng.uniform(2.0, 8.0, n_rows), 1),
        "Htn": rng.integers(0, 2, n_rows).astype(float),      # numeric

        # ===== CARDIO (all 13 columns are numeric) =====
        "age": rng.integers(30, 80, n_rows).astype(float),
        "sex": rng.integers(0, 2, n_rows).astype(float),
        "cp": rng.integers(0, 4, n_rows).astype(float),
        "trestbps": rng.integers(90, 200, n_rows).astype(float),
        "chol": rng.integers(120, 400, n_rows).astype(float),
        "fbs": rng.integers(0, 2, n_rows).astype(float),
        "restecg": rng.integers(0, 3, n_rows).astype(float),
        "thalach": rng.integers(70, 200, n_rows).astype(float),
        "exang": rng.integers(0, 2, n_rows).astype(float),
        "oldpeak": np.round(rng.uniform(0.0, 6.0, n_rows), 1),
        "slope": rng.integers(0, 3, n_rows).astype(float),
        "ca": rng.integers(0, 5, n_rows).astype(float),
        "thal": rng.integers(0, 4, n_rows).astype(float),
    }

    return pd.DataFrame(data)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_all_diseases():
    """Run prediction for ALL matched diseases."""
    print("=" * 60)
    print("TEST 1 -- selected_diseases = 'all'")
    print("=" * 60)

    df = _build_sample_df()
    results = predict_risks(df, selected_diseases="all")

    print(json.dumps(results, indent=2))
    print()

    assert isinstance(results, dict), "Result should be a dict"
    for disease, info in results.items():
        assert "risk_level" in info, f"{disease} missing risk_level"
        assert "alert" in info, f"{disease} missing alert"
    print("[PASS]  TEST 1 PASSED\n")


def test_single_disease():
    """Run prediction for diabetes only."""
    print("=" * 60)
    print("TEST 2 -- selected_diseases = ['diabetes']")
    print("=" * 60)

    df = _build_sample_df()
    results = predict_risks(df, selected_diseases=["diabetes"])

    print(json.dumps(results, indent=2))
    print()

    assert "diabetes" in results, "diabetes should be in results"
    assert len(results) == 1, "Only one disease should be returned"
    print("[PASS]  TEST 2 PASSED\n")


def test_missing_disease():
    """Request a disease whose columns are absent -- should not crash."""
    print("=" * 60)
    print("TEST 3 -- selected_diseases = ['nonexistent_disease']")
    print("=" * 60)

    df = _build_sample_df()
    results = predict_risks(df, selected_diseases=["nonexistent_disease"])

    print(json.dumps(results, indent=2))
    print()

    assert len(results) == 0, "No results expected for unknown disease"
    print("[PASS]  TEST 3 PASSED\n")


def test_none_selection():
    """selected_diseases=None should behave like 'all'."""
    print("=" * 60)
    print("TEST 4 -- selected_diseases = None (default)")
    print("=" * 60)

    df = _build_sample_df()
    results = predict_risks(df, selected_diseases=None)

    print(json.dumps(results, indent=2))
    print()

    assert isinstance(results, dict), "Result should be a dict"
    print("[PASS]  TEST 4 PASSED\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    try:
        test_all_diseases()
        test_single_disease()
        test_missing_disease()
        test_none_selection()
        print("=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)
    except Exception as exc:
        print(f"\n[FAIL]  FAILURE: {exc}", file=sys.stderr)
        sys.exit(1)
