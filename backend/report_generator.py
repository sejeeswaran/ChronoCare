"""
PDF Report Generator
====================
Generates professional clinical analysis PDF reports using FPDF2.
"""

from fpdf import FPDF
from datetime import datetime
from typing import Dict, Any
import io

RISK_HIGH = "High Risk"
RISK_MODERATE = "Moderate Risk"


class ClinicalReportPDF(FPDF):
    """Custom PDF class for clinical risk reports."""

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(25, 50, 100)
        self.cell(0, 12, "ChronoCare AI", ln=True, align="L")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(120, 130, 140)
        self.cell(0, 5, "Hybrid Chronic Risk Intelligence Report", ln=True)
        self.line(10, self.get_y() + 3, 200, self.get_y() + 3)
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def _draw_summary_box(pdf, results: dict):
    diseases_evaluated = len(results)
    high_risk = sum(1 for v in results.values() if isinstance(v, dict) and v.get("risk_level") == RISK_HIGH)
    moderate = sum(1 for v in results.values() if isinstance(v, dict) and v.get("risk_level") == RISK_MODERATE)
    low = sum(1 for v in results.values() if isinstance(v, dict) and v.get("risk_level") == "Low Risk")

    pdf.set_fill_color(240, 244, 248)
    pdf.set_draw_color(200, 210, 220)
    pdf.rect(10, pdf.get_y(), 190, 22, style="DF")
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 40, 60)
    y = pdf.get_y() + 4
    pdf.set_xy(15, y)
    pdf.cell(45, 6, f"Models Evaluated: {diseases_evaluated}")
    pdf.set_text_color(220, 50, 50)
    pdf.cell(40, 6, f"{RISK_HIGH}: {high_risk}")
    pdf.set_text_color(230, 150, 30)
    pdf.cell(40, 6, f"Moderate: {moderate}")
    pdf.set_text_color(40, 170, 80)
    pdf.cell(40, 6, f"Low Risk: {low}")
    pdf.ln(20)

def _draw_disease_header(pdf, disease_name: str, risk_level: str):
    if risk_level == RISK_HIGH:
        pdf.set_fill_color(254, 230, 230)
        pdf.set_text_color(180, 30, 30)
    elif risk_level == RISK_MODERATE:
        pdf.set_fill_color(255, 243, 220)
        pdf.set_text_color(180, 120, 20)
    else:
        pdf.set_fill_color(230, 250, 235)
        pdf.set_text_color(30, 130, 60)

    pdf.set_font("Helvetica", "B", 12)
    display_name = disease_name.replace("_", " ").title()
    pdf.cell(130, 9, f"  {display_name}", fill=True)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(60, 9, risk_level, fill=True, align="R")
    pdf.ln(11)

def _draw_disease_metrics(pdf, prob_pct: str, rule_score: int, trend: str, alert: str):
    pdf.set_text_color(50, 60, 70)
    col1_w, col2_w = 50, 45
    metrics = [
        ("Probability", prob_pct),
        ("Rule Score", str(rule_score)),
        ("Trend", trend),
        ("Alert", alert if alert else "None"),
    ]
    for label, value in metrics:
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(120, 130, 140)
        pdf.cell(col1_w, 6, f"  {label}:")
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(40, 50, 60)
        pdf.cell(col2_w, 6, value)
    pdf.ln(8)

def _draw_probability_bar(pdf, probability, risk_level: str):
    bar_x = 15
    bar_y = pdf.get_y()
    bar_w = 180
    bar_h = 4

    pdf.set_fill_color(230, 235, 240)
    pdf.rect(bar_x, bar_y, bar_w, bar_h, style="F")

    if isinstance(probability, (int, float)):
        fill_w = max(1, bar_w * min(probability, 1.0))
        if risk_level == RISK_HIGH:
            pdf.set_fill_color(239, 68, 68)
        elif risk_level == RISK_MODERATE:
            pdf.set_fill_color(245, 158, 11)
        else:
            pdf.set_fill_color(34, 197, 94)
        pdf.rect(bar_x, bar_y, fill_w, bar_h, style="F")

    pdf.ln(8)

def _draw_disease_card(pdf, disease_name: str, data: dict):
    pdf.ln(4)

    risk_level = data.get("risk_level", "Unknown")
    probability = data.get("probability", 0)
    prob_pct = f"{probability * 100:.1f}%" if isinstance(probability, (int, float)) else "N/A"
    alert = data.get("alert", "")
    trend = data.get("trend", "Stable")
    rule_score = data.get("rule_score", 0)

    _draw_disease_header(pdf, disease_name, risk_level)
    _draw_disease_metrics(pdf, prob_pct, rule_score, trend, alert)
    _draw_probability_bar(pdf, probability, risk_level)

def _draw_disease_results(pdf, results: dict):
    for disease_name, data in results.items():
        if isinstance(data, dict):
            _draw_disease_card(pdf, disease_name, data)

def _draw_input_data_summary(pdf, input_data: dict):
    if input_data:
        pdf.ln(6)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 40, 60)
        pdf.cell(0, 8, "Input Data Used", ln=True)
        pdf.set_draw_color(200, 210, 220)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)

        pdf.set_font("Helvetica", "", 9)
        col_w = 47.5
        count = 0
        for key, val in input_data.items():
            if key in ("patient_id", "date"):
                continue
            pdf.set_text_color(100, 110, 120)
            pdf.cell(25, 5, f"{key}:")
            pdf.set_text_color(40, 50, 60)
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(col_w - 25, 5, str(val))
            pdf.set_font("Helvetica", "", 9)
            count += 1
            if count % 4 == 0:
                pdf.ln(5)

        pdf.ln(8)


def generate_report_pdf(
    patient_id: str,
    results: Dict[str, Any],
    input_data: Dict[str, Any] = None,
) -> bytes:
    """Generate a PDF report from analysis results.

    Returns:
        bytes — the PDF file content
    """
    pdf = ClinicalReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    now = datetime.now().strftime("%B %d, %Y  %I:%M %p")

    # ── Patient Info ──
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 40, 60)
    pdf.cell(0, 8, f"Patient ID:  {patient_id}", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 110, 120)
    pdf.cell(0, 6, f"Generated:  {now}", ln=True)
    pdf.ln(6)

    # ── Summary Box ──
    _draw_summary_box(pdf, results)

    # ── Disease Results ──
    _draw_disease_results(pdf, results)

    # ── Input Data Summary (if provided) ──
    _draw_input_data_summary(pdf, input_data)

    # ── Footer note ──
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(160, 160, 160)
    pdf.multi_cell(0, 4,
        "This report was auto-generated by ChronoCare AI's Hybrid Chronic Risk Intelligence Engine. "
        "Results are based on ML model predictions combined with rule-based clinical logic. "
        "This report is for informational purposes and should not replace professional medical advice."
    )

    return pdf.output()
