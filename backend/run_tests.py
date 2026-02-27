"""
Test Suite — Chronic Risk Intelligence System
===============================================
Run with:  python -m pytest run_tests.py -v
"""

import os
from pathlib import Path

import pandas as pd
import pytest

from risk_engine import (
    apply_rule_engine,
    classify_risk,
    detect_deterioration,
    generate_alert,
    rule_based_risk,
)
from hybrid_engine import (
    apply_hybrid_engine,
    final_hybrid_decision,
    load_ml_components,
    predict_ml_probability,
)
from pipeline import run_pipeline
from predict_diabetes import predict_diabetes_risk
from predict_hypertension import predict_hypertension_risk
from predict_all import predict_all_risks


# ── helpers ───────────────────────────────────────────────────────────────

def _row(**kwargs) -> pd.Series:
    """Shortcut to build a pd.Series for a single patient observation."""
    defaults = {
        "patient_id": "P001",
        "date": "2026-01-15",
        "age": 55,
        "fasting_glucose": 100,
        "hba1c": 5.5,
    }
    defaults.update(kwargs)
    return pd.Series(defaults)


# ── 1. rule_based_risk ────────────────────────────────────────────────────

class TestRuleBasedRisk:
    """Unit tests for the per-row scoring function."""

    def test_high_glucose_and_high_hba1c(self):
        """glucose > 180 (+40) AND hba1c > 6.5 (+40) → 80."""
        row = _row(fasting_glucose=200, hba1c=7.0)
        assert rule_based_risk(row) == 80

    def test_moderate_glucose_only(self):
        """140 < glucose ≤ 180 (+20), normal hba1c → 20."""
        row = _row(fasting_glucose=150, hba1c=5.0)
        assert rule_based_risk(row) == 20

    def test_low_values(self):
        """Normal glucose and hba1c → 0."""
        row = _row(fasting_glucose=90, hba1c=5.0)
        assert rule_based_risk(row) == 0

    def test_high_glucose_normal_hba1c(self):
        """glucose > 180 (+40), normal hba1c → 40."""
        row = _row(fasting_glucose=185, hba1c=6.0)
        assert rule_based_risk(row) == 40

    def test_normal_glucose_high_hba1c(self):
        """Normal glucose, hba1c > 6.5 (+40) → 40."""
        row = _row(fasting_glucose=100, hba1c=7.5)
        assert rule_based_risk(row) == 40

    def test_boundary_glucose_140(self):
        """glucose == 140 is NOT above threshold → 0."""
        row = _row(fasting_glucose=140, hba1c=5.0)
        assert rule_based_risk(row) == 0

    def test_boundary_glucose_180(self):
        """glucose == 180 falls in 140–180 band → 20."""
        row = _row(fasting_glucose=180, hba1c=5.0)
        assert rule_based_risk(row) == 20

    def test_boundary_hba1c_6_5(self):
        """hba1c == 6.5 is NOT above threshold → 0."""
        row = _row(fasting_glucose=100, hba1c=6.5)
        assert rule_based_risk(row) == 0


# ── 2. classify_risk ──────────────────────────────────────────────────────

class TestClassifyRisk:
    """Unit tests for score-to-category mapping."""

    @pytest.mark.parametrize("score, expected", [
        (80, "High Risk"),
        (60, "High Risk"),
        (59, "Moderate Risk"),
        (30, "Moderate Risk"),
        (29, "Low Risk"),
        (0, "Low Risk"),
    ])
    def test_thresholds(self, score: int, expected: str):
        assert classify_risk(score) == expected


# ── 3. apply_rule_engine ──────────────────────────────────────────────────

class TestApplyRuleEngine:
    """Integration tests for DataFrame-level enrichment."""

    @pytest.fixture()
    def sample_df(self) -> pd.DataFrame:
        return pd.DataFrame([
            {"patient_id": "P001", "date": "2026-01-01", "age": 60,
             "fasting_glucose": 200, "hba1c": 7.0},
            {"patient_id": "P002", "date": "2026-01-01", "age": 45,
             "fasting_glucose": 150, "hba1c": 5.5},
            {"patient_id": "P003", "date": "2026-01-01", "age": 30,
             "fasting_glucose": 90,  "hba1c": 5.0},
        ])

    def test_new_columns_exist(self, sample_df):
        result = apply_rule_engine(sample_df)
        assert "rule_score" in result.columns
        assert "risk_category" in result.columns
        assert "risk_label" in result.columns

    def test_original_columns_preserved(self, sample_df):
        result = apply_rule_engine(sample_df)
        for col in sample_df.columns:
            assert col in result.columns

    def test_does_not_mutate_input(self, sample_df):
        original_cols = list(sample_df.columns)
        apply_rule_engine(sample_df)
        assert list(sample_df.columns) == original_cols

    def test_scores(self, sample_df):
        result = apply_rule_engine(sample_df)
        assert list(result["rule_score"]) == [80, 20, 0]

    def test_categories(self, sample_df):
        result = apply_rule_engine(sample_df)
        assert list(result["risk_category"]) == [
            "High Risk", "Low Risk", "Low Risk",
        ]

    def test_labels(self, sample_df):
        result = apply_rule_engine(sample_df)
        assert list(result["risk_label"]) == [1, 0, 0]


# ── 4. detect_deterioration ──────────────────────────────────────────────

class TestDetectDeterioration:
    """Tests for the single-patient trend detector."""

    def test_deteriorating_trend(self):
        """Rising glucose over time → Deteriorating."""
        df = pd.DataFrame({
            "date": pd.date_range("2026-01-01", periods=14, freq="D"),
            "fasting_glucose": [
                100, 105, 110, 115, 120, 125, 130,   # week 1
                140, 150, 160, 170, 180, 190, 200,   # week 2 (rising)
            ],
        })
        assert detect_deterioration(df) == "Deteriorating"

    def test_stable_trend(self):
        """Flat glucose over time → Stable."""
        df = pd.DataFrame({
            "date": pd.date_range("2026-01-01", periods=14, freq="D"),
            "fasting_glucose": [120] * 14,
        })
        assert detect_deterioration(df) == "Stable"

    def test_improving_trend(self):
        """Decreasing glucose → Stable (not deteriorating)."""
        df = pd.DataFrame({
            "date": pd.date_range("2026-01-01", periods=14, freq="D"),
            "fasting_glucose": [
                200, 195, 190, 185, 180, 175, 170,
                160, 150, 140, 130, 120, 110, 100,
            ],
        })
        assert detect_deterioration(df) == "Stable"

    def test_insufficient_data_single_row(self):
        """Single row → Stable (can't determine trend)."""
        df = pd.DataFrame({
            "date": ["2026-01-01"],
            "fasting_glucose": [200],
        })
        assert detect_deterioration(df) == "Stable"

    def test_insufficient_data_under_14(self):
        """13 rows → Stable (below 14-day minimum for comparison)."""
        df = pd.DataFrame({
            "date": pd.date_range("2026-01-01", periods=13, freq="D"),
            "fasting_glucose": [100, 110, 120, 130, 140, 150, 160,
                                170, 180, 190, 200, 210, 220],
        })
        assert detect_deterioration(df) == "Stable"


# ── 5. generate_alert ────────────────────────────────────────────────────

class TestGenerateAlert:
    """Tests for the alert generation logic."""

    def test_high_risk_any_trend(self):
        assert generate_alert("High Risk", "Stable") == "CRITICAL ALERT"
        assert generate_alert("High Risk", "Deteriorating") == "CRITICAL ALERT"

    def test_moderate_risk_deteriorating(self):
        assert generate_alert("Moderate Risk", "Deteriorating") == "WARNING"

    def test_moderate_risk_stable(self):
        assert generate_alert("Moderate Risk", "Stable") == "STABLE"

    def test_low_risk(self):
        assert generate_alert("Low Risk", "Stable") == "STABLE"
        assert generate_alert("Low Risk", "Deteriorating") == "STABLE"


# ═══════════════════════════════════════════════════════════════════════════
# HYBRID ENGINE TESTS
# ═══════════════════════════════════════════════════════════════════════════


# ── 6. load_ml_components ────────────────────────────────────────────────

class TestLoadMlComponents:
    """Tests for ML model/scaler loading."""

    def test_loads_successfully(self):
        """Should return a (model, scaler) tuple without error."""
        model, scaler = load_ml_components()
        assert model is not None
        assert scaler is not None

    def test_model_has_predict_proba(self):
        """Model must expose predict_proba for probability estimation."""
        model, _ = load_ml_components()
        assert hasattr(model, "predict_proba")

    def test_scaler_has_transform(self):
        """Scaler must expose transform for feature scaling."""
        _, scaler = load_ml_components()
        assert hasattr(scaler, "transform")

    def test_missing_model_raises(self, tmp_path):
        """FileNotFoundError if model .pkl is missing."""
        fake_model = tmp_path / "no_model.pkl"
        with pytest.raises(FileNotFoundError, match="ML model not found"):
            load_ml_components(model_path=fake_model)

    def test_missing_scaler_raises(self, tmp_path):
        """FileNotFoundError if scaler .pkl is missing."""
        # Use the real model so the first check passes
        from hybrid_engine import _DEFAULT_MODEL_PATH
        fake_scaler = tmp_path / "no_scaler.pkl"
        with pytest.raises(FileNotFoundError, match="Scaler not found"):
            load_ml_components(
                model_path=_DEFAULT_MODEL_PATH,
                scaler_path=fake_scaler,
            )


# ── 7. predict_ml_probability ────────────────────────────────────────────

class TestPredictMlProbability:
    """Tests for ML probability prediction."""

    @pytest.fixture()
    def sample_df(self) -> pd.DataFrame:
        return pd.DataFrame([
            {"patient_id": "P001", "age": 60, "fasting_glucose": 200, "hba1c": 7.0},
            {"patient_id": "P002", "age": 45, "fasting_glucose": 150, "hba1c": 5.5},
            {"patient_id": "P003", "age": 30, "fasting_glucose": 90,  "hba1c": 5.0},
        ])

    def test_adds_ml_probability_column(self, sample_df):
        result = predict_ml_probability(sample_df)
        assert "ml_probability" in result.columns

    def test_probabilities_in_valid_range(self, sample_df):
        result = predict_ml_probability(sample_df)
        assert (result["ml_probability"] >= 0.0).all()
        assert (result["ml_probability"] <= 1.0).all()

    def test_does_not_mutate_input(self, sample_df):
        original_cols = list(sample_df.columns)
        predict_ml_probability(sample_df)
        assert list(sample_df.columns) == original_cols

    def test_preserves_original_columns(self, sample_df):
        result = predict_ml_probability(sample_df)
        for col in sample_df.columns:
            assert col in result.columns


# ── 8. final_hybrid_decision ─────────────────────────────────────────────

class TestFinalHybridDecision:
    """Tests for the row-level hybrid decision logic."""

    def test_rule_high_risk_stays_high(self):
        """Rule-based High Risk is never downgraded, even if ML prob is low."""
        row = pd.Series({"risk_category": "High Risk", "ml_probability": 0.1})
        assert final_hybrid_decision(row) == "High Risk"

    def test_ml_escalates_to_high(self):
        """ML probability ≥ 0.75 escalates Low/Moderate to High Risk."""
        row = pd.Series({"risk_category": "Low Risk", "ml_probability": 0.80})
        assert final_hybrid_decision(row) == "High Risk"

    def test_moderate_preserved(self):
        """Moderate Risk with low ML prob stays Moderate."""
        row = pd.Series({"risk_category": "Moderate Risk", "ml_probability": 0.40})
        assert final_hybrid_decision(row) == "Moderate Risk"

    def test_low_risk_stays_low(self):
        """Low Risk with low ML prob stays Low."""
        row = pd.Series({"risk_category": "Low Risk", "ml_probability": 0.30})
        assert final_hybrid_decision(row) == "Low Risk"

    def test_boundary_ml_075(self):
        """Exactly 0.75 should escalate to High Risk."""
        row = pd.Series({"risk_category": "Low Risk", "ml_probability": 0.75})
        assert final_hybrid_decision(row) == "High Risk"

    def test_boundary_ml_just_below_075(self):
        """Just below 0.75 should NOT escalate."""
        row = pd.Series({"risk_category": "Low Risk", "ml_probability": 0.749})
        assert final_hybrid_decision(row) == "Low Risk"

    def test_moderate_with_high_ml_escalates(self):
        """Moderate Risk + ML ≥ 0.75 → High Risk."""
        row = pd.Series({"risk_category": "Moderate Risk", "ml_probability": 0.85})
        assert final_hybrid_decision(row) == "High Risk"


# ── 9. apply_hybrid_engine ───────────────────────────────────────────────

class TestApplyHybridEngine:
    """Integration tests for the full hybrid pipeline."""

    @pytest.fixture()
    def rule_enriched_df(self) -> pd.DataFrame:
        """DataFrame that's already been through apply_rule_engine."""
        raw = pd.DataFrame([
            {"patient_id": "P001", "date": "2026-01-01", "age": 60,
             "fasting_glucose": 200, "hba1c": 7.0},
            {"patient_id": "P002", "date": "2026-01-01", "age": 45,
             "fasting_glucose": 150, "hba1c": 5.5},
            {"patient_id": "P003", "date": "2026-01-01", "age": 30,
             "fasting_glucose": 90,  "hba1c": 5.0},
        ])
        return apply_rule_engine(raw)

    def test_adds_hybrid_columns(self, rule_enriched_df):
        result = apply_hybrid_engine(rule_enriched_df)
        assert "ml_probability" in result.columns
        assert "final_risk" in result.columns

    def test_preserves_rule_columns(self, rule_enriched_df):
        result = apply_hybrid_engine(rule_enriched_df)
        assert "rule_score" in result.columns
        assert "risk_category" in result.columns
        assert "risk_label" in result.columns

    def test_does_not_mutate_input(self, rule_enriched_df):
        original_cols = list(rule_enriched_df.columns)
        apply_hybrid_engine(rule_enriched_df)
        assert list(rule_enriched_df.columns) == original_cols

    def test_high_risk_patient_stays_high(self, rule_enriched_df):
        """P001 (rule=High Risk) must remain High Risk in final."""
        result = apply_hybrid_engine(rule_enriched_df)
        p001 = result[result["patient_id"] == "P001"].iloc[0]
        assert p001["final_risk"] == "High Risk"

    def test_final_risk_values_are_valid(self, rule_enriched_df):
        result = apply_hybrid_engine(rule_enriched_df)
        valid = {"High Risk", "Moderate Risk", "Low Risk"}
        assert set(result["final_risk"]).issubset(valid)


# ═══════════════════════════════════════════════════════════════════════════
# PIPELINE TESTS
# ═══════════════════════════════════════════════════════════════════════════


class TestRunPipeline:
    """Integration tests for the single entry-point pipeline."""

    @pytest.fixture()
    def valid_df(self) -> pd.DataFrame:
        return pd.DataFrame([
            {"patient_id": "P001", "date": "2026-01-01", "age": 60,
             "fasting_glucose": 200, "hba1c": 7.0},
            {"patient_id": "P002", "date": "2026-01-01", "age": 45,
             "fasting_glucose": 150, "hba1c": 5.5},
            {"patient_id": "P003", "date": "2026-01-01", "age": 30,
             "fasting_glucose": 90,  "hba1c": 5.0},
        ])

    def test_output_has_all_enriched_columns(self, valid_df):
        result = run_pipeline(valid_df)
        for col in ["rule_score", "risk_category", "risk_label",
                    "ml_probability", "final_risk"]:
            assert col in result.columns, f"Missing column: {col}"

    def test_preserves_original_columns(self, valid_df):
        result = run_pipeline(valid_df)
        for col in valid_df.columns:
            assert col in result.columns

    def test_does_not_mutate_input(self, valid_df):
        original_cols = list(valid_df.columns)
        run_pipeline(valid_df)
        assert list(valid_df.columns) == original_cols

    def test_row_count_unchanged(self, valid_df):
        result = run_pipeline(valid_df)
        assert len(result) == len(valid_df)

    def test_missing_column_raises_valueerror(self):
        bad_df = pd.DataFrame([{"patient_id": "P001", "age": 55}])
        with pytest.raises(ValueError, match="missing required column"):
            run_pipeline(bad_df)

    def test_non_dataframe_raises_typeerror(self):
        with pytest.raises(TypeError, match="Expected a pandas DataFrame"):
            run_pipeline({"patient_id": ["P001"]})

    def test_final_risk_values_are_valid(self, valid_df):
        result = run_pipeline(valid_df)
        valid = {"High Risk", "Moderate Risk", "Low Risk"}
        assert set(result["final_risk"]).issubset(valid)

    def test_high_risk_patient_classified_correctly(self, valid_df):
        """P001 (glucose=200, hba1c=7.0) must be High Risk end-to-end."""
        result = run_pipeline(valid_df)
        p001 = result[result["patient_id"] == "P001"].iloc[0]
        assert p001["risk_category"] == "High Risk"
        assert p001["final_risk"] == "High Risk"
        assert p001["risk_label"] == 1


# ═══════════════════════════════════════════════════════════════════════════
# PREDICT DIABETES RISK TESTS
# ═══════════════════════════════════════════════════════════════════════════


class TestPredictDiabetesRisk:
    """Tests for the standalone diabetes prediction function."""

    @pytest.fixture()
    def single_row_df(self) -> pd.DataFrame:
        return pd.DataFrame([{
            "age": 60, "fasting_glucose": 200, "hba1c": 7.0,
        }])

    @pytest.fixture()
    def multi_row_df(self) -> pd.DataFrame:
        return pd.DataFrame([
            {"age": 60, "fasting_glucose": 200, "hba1c": 7.0},
            {"age": 30, "fasting_glucose": 90,  "hba1c": 5.0},
        ])

    def test_single_row_returns_float(self, single_row_df):
        result = predict_diabetes_risk(single_row_df)
        assert isinstance(result, float)

    def test_multi_row_returns_list(self, multi_row_df):
        result = predict_diabetes_risk(multi_row_df)
        assert isinstance(result, list)
        assert len(result) == 2

    def test_probability_in_valid_range_single(self, single_row_df):
        prob = predict_diabetes_risk(single_row_df)
        assert 0.0 <= prob <= 1.0

    def test_probability_in_valid_range_multi(self, multi_row_df):
        probs = predict_diabetes_risk(multi_row_df)
        for p in probs:
            assert 0.0 <= p <= 1.0

    def test_does_not_mutate_input(self, single_row_df):
        original_cols = list(single_row_df.columns)
        predict_diabetes_risk(single_row_df)
        assert list(single_row_df.columns) == original_cols

    def test_missing_column_raises_valueerror(self):
        bad_df = pd.DataFrame([{"age": 55}])
        with pytest.raises(ValueError, match="missing required column"):
            predict_diabetes_risk(bad_df)

    def test_missing_model_raises_filenotfounderror(self, single_row_df, tmp_path):
        fake = tmp_path / "missing.pkl"
        with pytest.raises(FileNotFoundError, match="ML model not found"):
            predict_diabetes_risk(single_row_df, model_path=fake)


# ═══════════════════════════════════════════════════════════════════════════
# PREDICT HYPERTENSION RISK TESTS
# ═══════════════════════════════════════════════════════════════════════════


class TestPredictHypertensionRisk:
    """Tests for the standalone hypertension prediction function."""

    @pytest.fixture()
    def single_row_df(self) -> pd.DataFrame:
        return pd.DataFrame([{
            "age": 65, "systolic_bp": 160, "diastolic_bp": 95,
        }])

    @pytest.fixture()
    def multi_row_df(self) -> pd.DataFrame:
        return pd.DataFrame([
            {"age": 65, "systolic_bp": 160, "diastolic_bp": 95},
            {"age": 30, "systolic_bp": 110, "diastolic_bp": 70},
        ])

    def test_single_row_returns_float(self, single_row_df):
        result = predict_hypertension_risk(single_row_df)
        assert isinstance(result, float)

    def test_multi_row_returns_list(self, multi_row_df):
        result = predict_hypertension_risk(multi_row_df)
        assert isinstance(result, list)
        assert len(result) == 2

    def test_probability_in_valid_range_single(self, single_row_df):
        prob = predict_hypertension_risk(single_row_df)
        assert 0.0 <= prob <= 1.0

    def test_probability_in_valid_range_multi(self, multi_row_df):
        probs = predict_hypertension_risk(multi_row_df)
        for p in probs:
            assert 0.0 <= p <= 1.0

    def test_does_not_mutate_input(self, single_row_df):
        original_cols = list(single_row_df.columns)
        predict_hypertension_risk(single_row_df)
        assert list(single_row_df.columns) == original_cols

    def test_missing_column_raises_valueerror(self):
        bad_df = pd.DataFrame([{"age": 55}])
        with pytest.raises(ValueError, match="missing required column"):
            predict_hypertension_risk(bad_df)

    def test_missing_model_raises_filenotfounderror(self, single_row_df, tmp_path):
        fake = tmp_path / "missing.pkl"
        with pytest.raises(FileNotFoundError, match="Hypertension model not found"):
            predict_hypertension_risk(single_row_df, model_path=fake)


# ═══════════════════════════════════════════════════════════════════════════
# PREDICT ALL RISKS TESTS
# ═══════════════════════════════════════════════════════════════════════════


class TestPredictAllRisks:
    """Tests for the multi-disease aggregation function."""

    @pytest.fixture()
    def full_df(self) -> pd.DataFrame:
        """DataFrame with columns for both diabetes and hypertension."""
        return pd.DataFrame([{
            "age": 60,
            "fasting_glucose": 200, "hba1c": 7.0,
            "systolic_bp": 160, "diastolic_bp": 95,
        }])

    def test_returns_dict_with_both_keys(self, full_df):
        result = predict_all_risks(full_df)
        assert "diabetes_risk" in result
        assert "hypertension_risk" in result

    def test_single_row_values_are_floats(self, full_df):
        result = predict_all_risks(full_df)
        assert isinstance(result["diabetes_risk"], float)
        assert isinstance(result["hypertension_risk"], float)

    def test_probabilities_in_valid_range(self, full_df):
        result = predict_all_risks(full_df)
        assert 0.0 <= result["diabetes_risk"] <= 1.0
        assert 0.0 <= result["hypertension_risk"] <= 1.0

    def test_multi_row_values_are_lists(self):
        df = pd.DataFrame([
            {"age": 60, "fasting_glucose": 200, "hba1c": 7.0,
             "systolic_bp": 160, "diastolic_bp": 95},
            {"age": 30, "fasting_glucose": 90,  "hba1c": 5.0,
             "systolic_bp": 110, "diastolic_bp": 70},
        ])
        result = predict_all_risks(df)
        assert isinstance(result["diabetes_risk"], list)
        assert isinstance(result["hypertension_risk"], list)
        assert len(result["diabetes_risk"]) == 2
