# ChronoCare AI

**Hybrid Chronic Risk Intelligence Engine**

ChronoCare AI is an advanced, full-stack medical intelligence platform designed to predict, detect, and track chronic disease risks including **Diabetes, Hypertension, Chronic Kidney Disease (CKD), and Cardiovascular Disease**. The system utilizes a hybrid approach, combining strict rule-based clinical scoring constraints with machine learning models for a refined and robust clinical probability assessment.

---

## 🚀 Key Features

* **Intelligent Data Intake (OCR & Tabular)**
  Upload patient medical reports as PDF, Excel (`.xlsx`), or CSV format. The built-in extraction engine maps raw tabular healthcare data, normalizes medical aliases (e.g., matching "fasting blood sugar" to "Glucose"), and directly populates UI forms. This saves hours of manual data entry for doctors.
* **Multi-Disease Risk Engine (Registry-Driven)**
  Predicts probabilities for specific diseases or auto-detects risks using a unified array. The orchestrator efficiently dynamically infers which diseases can be tested based on the supplied parameters.
* **Hybrid Decision Logic**
  Merges rigid medical rule-base heuristics (like immediate critical alerts for high Blood Pressure) with underlying Scikit-learn predictive modeling (Random Forests, Gradient Boosting).
* **Longitudinal Timeline Tracking**
  Generates detailed clinical risk reports (available for PDF Export) and organizes them into isolated patient histories. The timeline engine builds interactive historical health trajectory graphs per patient ID.
* **Dynamic Role Portals (RBAC via JWT)**
  Provides distinct viewing experiences:
  * **Doctor Portal:** Can assign data to any patient ID, run predictions, list all patients, and view all global alerts and history.
  * **Patient Portal:** A locked, auto-linked portal customized exclusively for their own history.

## 🛠️ Tech Stack

* **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide Icons
* **Backend:** Python 3, Flask, Pandas, Scikit-learn, ReportLab (PDF Generation), PyPDF/pdfplumber (Data Extraction)
* **Storage Framework:** Local JSON Storage API with fallbacks and logic mapped out for secure Google Drive API integration.

## ⚙️ Setup & Running

**Prerequisites:** Python 3.8+ and Node.js v18+.

1. **Clone the Repository:**
   ```powershell
   git clone <your-repo-url>
   cd Innoverse
   ```

2. **Set up the Virtual Environment & Install Dependencies:**
   
   **Backend (Python):**
   ```powershell
   # Create and activate a virtual environment
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   
   # Install backend requirements
   pip install -r requirements.txt
   ```

   **Frontend (Node.js):**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

3. **Start the Platform:**
   The project includes a unified `start.py` script that simultaneously boots the Python backend API (port 5000) and the Vite frontend (port 5173).
   
   **Make sure your virtual environment is activated before running.**
   ```powershell
   # Windows
   .\.venv\Scripts\Activate.ps1
   python start.py
   ```
   Then, navigate to `http://localhost:5173` in your browser.

## 📂 Backend Architecture

* `backend/multi_disease_engine.py`: Core orchestrator combining ML inference, rule-based tracking, and trend analysis.
* `backend/disease_registry.py`: Centralized configuration mapping diseases to required model features and file paths.
* `backend/rule_engine.py`: Pure clinical heuristic definitions per disease.
* `api/routes.py`: Flask blueprints for data extraction (`/extract-report`), predictions (`/predict`), and report export (`/export-pdf`).
* `backend/drive_storage.py`: Local & remote Google Drive abstraction logic for histories.
* `backend/auth.py`: Cryptographic JWT authentication, hashing, and User DB JSON persistence.
* `backend/report_generator.py`: Converts results into downloadable clinical PDF formats using ReportLab.

---
*Predict. Detect. Prevent.*
