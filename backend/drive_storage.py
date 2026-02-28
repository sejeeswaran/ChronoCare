"""
Google Drive Storage Service
=============================
Production-ready Google Drive integration for Innoverse.

Folder Structure in Drive:
    InnoversePatients/
       └── PAT_1001/
             ├── analysis_2026-02-28_143000.json
             └── report_2026-02-28_143000.pdf

Setup:
   1. Service account key at:  backend/drive_key.json
   2. Share Drive folder with the service account email
   3. ROOT_FOLDER_ID is auto-detected or set via env var
"""

import os
import io
import json
import logging
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ── Paths & Config ────────────────────────────────────────────────────
_MODULE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
_CREDENTIALS_PATH = _MODULE_DIR / "drive_key.json"
_LOCAL_HISTORY_DIR = _MODULE_DIR / "patient_history"
_LOCAL_HISTORY_DIR.mkdir(exist_ok=True)

# Root folder ID in Google Drive — set via env or hardcode
ROOT_FOLDER_ID = os.environ.get(
    "GDRIVE_FOLDER_ID",
    "1uprxnQG_oHzL7ZNwz7D7-YydiYYz_WgB"
)

# ── Lazy-init singleton ──────────────────────────────────────────────
_drive_service = None
_drive_available = False
_init_attempted = False


# ══════════════════════════════════════════════════════════════════════
#  CORE –– get_drive_service()
# ══════════════════════════════════════════════════════════════════════
def get_drive_service():
    """Return authenticated Google Drive v3 service, or None."""
    global _drive_service, _drive_available, _init_attempted

    if _init_attempted:
        return _drive_service

    _init_attempted = True

    if not _CREDENTIALS_PATH.exists():
        logger.info("Drive key not found at %s — using local storage.", _CREDENTIALS_PATH)
        _drive_available = False
        return None

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds = service_account.Credentials.from_service_account_file(
            str(_CREDENTIALS_PATH),
            scopes=["https://www.googleapis.com/auth/drive"],
        )
        _drive_service = build("drive", "v3", credentials=creds, cache_discovery=False)
        _drive_available = True
        logger.info("Google Drive connected successfully.")
        return _drive_service
    except Exception as e:
        logger.warning("Google Drive init failed: %s", e)
        _drive_available = False
        return None


def is_drive_connected() -> bool:
    """Return True if Google Drive is available."""
    get_drive_service()
    return _drive_available


# ══════════════════════════════════════════════════════════════════════
#  FOLDERS –– create_patient_folder()
# ══════════════════════════════════════════════════════════════════════
def create_patient_folder(patient_id: str, parent_folder_id: str = None) -> Optional[str]:
    """Create (or find existing) patient subfolder in Drive.

    Folder name format:  PAT_<patient_id>
    Returns the folder ID, or None on failure.
    """
    service = get_drive_service()
    if not service:
        return None

    parent = parent_folder_id or ROOT_FOLDER_ID
    folder_name = patient_id if patient_id.startswith("PAT") else f"PAT_{patient_id}"

    try:
        # Check if folder already exists
        query = (
            f"name='{folder_name}' and "
            f"'{parent}' in parents and "
            f"mimeType='application/vnd.google-apps.folder' and "
            f"trashed=false"
        )
        existing = service.files().list(q=query, fields="files(id)").execute()
        files = existing.get("files", [])

        if files:
            logger.info("Patient folder already exists: %s", folder_name)
            return files[0]["id"]

        # Create new folder
        metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent],
        }
        folder = service.files().create(body=metadata, fields="id").execute()
        logger.info("Created patient folder: %s -> %s", folder_name, folder["id"])
        return folder["id"]

    except Exception as e:
        logger.error("Failed to create patient folder: %s", e)
        return None


# ══════════════════════════════════════════════════════════════════════
#  UPLOAD –– upload_file_to_drive()
# ══════════════════════════════════════════════════════════════════════
def upload_file_to_drive(file_path: str, folder_id: str) -> Optional[str]:
    """Upload a file to a specific Drive folder.

    Returns the uploaded file's Drive ID, or None on failure.
    """
    service = get_drive_service()
    if not service:
        return None

    try:
        from googleapiclient.http import MediaFileUpload

        filename = os.path.basename(file_path)
        mime = "application/json" if filename.endswith(".json") else "application/pdf"

        metadata = {
            "name": filename,
            "parents": [folder_id],
        }
        media = MediaFileUpload(file_path, mimetype=mime)
        uploaded = service.files().create(
            body=metadata, media_body=media, fields="id"
        ).execute()

        logger.info("Uploaded to Drive: %s -> %s", filename, uploaded["id"])
        return uploaded["id"]

    except Exception as e:
        logger.error("Drive upload failed for %s: %s", file_path, e)
        return None


# ══════════════════════════════════════════════════════════════════════
#  LIST –– list_patient_files()
# ══════════════════════════════════════════════════════════════════════
def list_patient_files(folder_id: str) -> list:
    """Return list of file metadata [{id, name, createdTime}] from a folder."""
    service = get_drive_service()
    if not service:
        return []

    try:
        results = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, createdTime)",
            orderBy="createdTime",
            pageSize=200,
        ).execute()
        return results.get("files", [])

    except Exception as e:
        logger.error("Failed to list files in folder %s: %s", folder_id, e)
        return []


# ══════════════════════════════════════════════════════════════════════
#  SAVE –– save_analysis()  (high-level: JSON + PDF → local + Drive)
# ══════════════════════════════════════════════════════════════════════
def save_analysis(patient_id: str, results: dict, input_data: dict = None) -> dict:
    """Save analysis results for a patient — locally AND to Google Drive.

    1. Saves JSON locally in backend/patient_history/
    2. Generates PDF report via report_generator
    3. Creates patient folder in Drive (or re-uses existing)
    4. Uploads both JSON and PDF to Drive

    Returns:
        { "stored": True, "backend": "gdrive"|"local", "file": "...", "drive_folder": "..." }
    """
    timestamp_str = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    timestamp_iso = datetime.now().isoformat()

    record = {
        "patient_id": patient_id,
        "timestamp": timestamp_iso,
        "results": results,
        "input_data": input_data or {},
    }

    json_filename = f"analysis_{timestamp_str}.json"
    pdf_filename = f"report_{timestamp_str}.pdf"

    # ── 1. Save JSON locally ──
    folder_name = patient_id if patient_id.startswith("PAT") else f"PAT_{patient_id}"
    patient_local_dir = _LOCAL_HISTORY_DIR / folder_name
    patient_local_dir.mkdir(exist_ok=True)
    local_json_path = patient_local_dir / json_filename

    with open(local_json_path, "w") as f:
        json.dump(record, f, indent=2, default=str)

    # ── 2. Generate PDF locally ──
    local_pdf_path = None
    try:
        from backend.report_generator import generate_report_pdf
        pdf_bytes = generate_report_pdf(patient_id, results, input_data)
        local_pdf_path = patient_local_dir / pdf_filename
        with open(local_pdf_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        logger.warning("PDF generation failed during save: %s", e)

    # ── 3. Upload to Google Drive ──
    drive_folder_id = create_patient_folder(patient_id)

    if drive_folder_id:
        try:
            upload_file_to_drive(str(local_json_path), drive_folder_id)
            if local_pdf_path:
                upload_file_to_drive(str(local_pdf_path), drive_folder_id)

            return {
                "stored": True,
                "backend": "gdrive",
                "file": json_filename,
                "drive_folder": folder_name,
            }
        except Exception as e:
            logger.warning("Drive upload failed: %s — saved locally.", e)

    return {
        "stored": True,
        "backend": "local",
        "file": json_filename,
        "drive_folder": None,
    }


# ══════════════════════════════════════════════════════════════════════
#  FETCH –– get_patient_history()  (for timeline)
# ══════════════════════════════════════════════════════════════════════
def get_patient_history(patient_id: str) -> list:
    """Retrieve all historical analysis records for a patient.

    Tries Google Drive first → falls back to local.
    Returns list of records sorted by timestamp.
    """
    records = []

    # ── Try Drive first ──
    folder_id = create_patient_folder(patient_id)
    if folder_id and _drive_available:
        try:
            from googleapiclient.http import MediaIoBaseDownload

            service = get_drive_service()
            file_list = list_patient_files(folder_id)

            for file_info in file_list:
                if not file_info["name"].endswith(".json"):
                    continue

                request = service.files().get_media(fileId=file_info["id"])
                buf = io.BytesIO()
                downloader = MediaIoBaseDownload(buf, request)
                done = False
                while not done:
                    _, done = downloader.next_chunk()
                buf.seek(0)
                data = json.loads(buf.read().decode("utf-8"))
                records.append(data)

            if records:
                records.sort(key=lambda r: r.get("timestamp", ""))
                return records

        except Exception as e:
            logger.warning("Drive fetch failed: %s — falling back to local.", e)

    # ── Fallback: local storage ──
    folder_name = patient_id if patient_id.startswith("PAT") else f"PAT_{patient_id}"
    patient_dir = _LOCAL_HISTORY_DIR / folder_name
    if patient_dir.exists():
        for f in sorted(patient_dir.glob("analysis_*.json")):
            try:
                with open(f) as fp:
                    records.append(json.load(fp))
            except Exception:
                continue

    records.sort(key=lambda r: r.get("timestamp", ""))
    return records


def get_all_patient_ids() -> list:
    """Return all patient IDs with stored history."""
    ids = set()

    # Local folders
    for d in _LOCAL_HISTORY_DIR.iterdir():
        if d.is_dir() and d.name.startswith("PAT"):
            ids.add(d.name)

    # Drive folders (if connected)
    service = get_drive_service()
    if service:
        try:
            results = service.files().list(
                q=f"'{ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields="files(name)",
                pageSize=200,
            ).execute()
            for f in results.get("files", []):
                name = f["name"]
                if name.startswith("PAT"):
                    ids.add(name)
        except Exception as e:
            logger.warning("Failed to list Drive folders: %s", e)

    return sorted(ids)
