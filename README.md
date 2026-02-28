# ChronoCare AI

**Hybrid Chronic Risk Intelligence Engine**

ChronoCare AI is an advanced, full-stack medical intelligence platform that predicts, detects, and tracks chronic disease risks (including Diabetes, Hypertension, Chronic Kidney Disease, and Cardiovascular Disease). The system utilizes a hybrid approach, combining rule-based clinical scoring with machine learning models for refined probability assessment.

## Key Features

*   **Intelligent Data Intake:** Upload Excel (`.xlsx`) or CSV reports, mapping raw tabular healthcare data directly to form UI inputs and saving hours of manual data entry for doctors.
*   **Multi-Disease Risk Engine:** Predicts probabilities for specific diseases (Diabetes, Hypertension, Chronic Kidney Disease, Cardiovascular Disease) or auto-detects risks using a unified array.
*   **Longitudinal Timeline Tracking:** Generates detailed clinical risk reports (JSON & PDF) and organizes them into isolated patient folders locally. The system builds an interactive historical health trajectory timeline per patient ID.
*   **Hybrid Decision Logic:** Merges rigid medical rule-base heuristics (like immediate critical alerts for high BP) with underlying Scikit-learn predictive modeling.
*   **Dynamic Role Portals:** Distinct viewing experiences. Doctors can assign data to any patient ID and view all alerts, while Patients see a locked, auto-linked portal customized for their own history.

## Tech Stack

*   **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide Icons
*   **Backend:** Python 3, Flask, Pandas, Scikit-learn, ReportLab
*   **Storage Framework:** Local JSON/PDF Storage API with logic built for secure Google Drive API integration.

## Setup & Running

1.  **Clone the Repository**
2.  **Set up the Virtual Environment & Install Dependencies:**
    
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

3.  **Start the Platform:**
    The project includes a unified `start.py` script that simultaneously boots the Python backend API (port 5000) and the Vite frontend (port 5173). **Make sure your virtual environment is activated before running.**
    ```powershell
    # Windows
    .\.venv\Scripts\Activate.ps1
    python start.py
    ```
    Then, navigate to `http://localhost:5173` in your browser.

## Backend Structure

*   `backend/multi_disease_engine.py`: Orchestrates the risk models and clinical rules.
*   `backend/disease_registry.py`: Model loader and requirement definitions.
*   `backend/drive_storage.py`: Handles Google Drive API logic and folder generation.
*   `backend/auth.py`: JWT authentication.
*   `backend/report_generator.py`: Converts results into downloadable clinical PDF formats.

---
*Predict. Detect. Prevent.*
