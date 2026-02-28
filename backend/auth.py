"""
Authentication Module
=====================
User management with Google Drive-stored credentials.

Users are stored in `users.json` — synced to Drive and cached locally.
Passwords hashed with bcrypt, sessions managed via JWT.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

import bcrypt
import jwt

# ── Config ──────────────────────────────────────────────────────────
LOG = logging.getLogger(__name__)

_BASE_DIR = Path(__file__).resolve().parent
_LOCAL_USERS_FILE = _BASE_DIR / "users.json"
_JWT_SECRET_FILE = _BASE_DIR / ".jwt_secret"
_JWT_ALGORITHM = "HS256"
_JWT_EXPIRY_HOURS = 24

# Drive file name for the users database
_DRIVE_USERS_FILENAME = "users.json"


# ══════════════════════════════════════════════════════════════════════
#  JWT SECRET — generated once, persisted locally
# ══════════════════════════════════════════════════════════════════════
def _get_jwt_secret() -> str:
    if _JWT_SECRET_FILE.exists():
        return _JWT_SECRET_FILE.read_text().strip()
    secret = uuid.uuid4().hex + uuid.uuid4().hex
    _JWT_SECRET_FILE.write_text(secret)
    LOG.info("Generated new JWT secret")
    return secret


_JWT_SECRET = _get_jwt_secret()


# ══════════════════════════════════════════════════════════════════════
#  USER DATABASE — load / save from Drive + local fallback
# ══════════════════════════════════════════════════════════════════════
def _load_users() -> list:
    """Load users from local file (Drive sync on save)."""
    if _LOCAL_USERS_FILE.exists():
        try:
            data = json.loads(_LOCAL_USERS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
        except Exception as e:
            LOG.warning("Failed to read local users.json: %s", e)
    return []


def _save_users(users: list):
    """Save users locally and upload to Google Drive."""
    # 1. Save locally
    _LOCAL_USERS_FILE.write_text(
        json.dumps(users, indent=2, default=str), encoding="utf-8"
    )

    # 2. Upload to Drive (best-effort)
    try:
        from backend.drive_storage import get_drive_service, is_drive_connected

        if not is_drive_connected():
            return

        service = get_drive_service()
        if not service:
            return

        root_folder_id = os.environ.get(
            "GDRIVE_FOLDER_ID", "1uprxnQG_oHzL7ZNwz7D7-YydiYYz_WgB"
        )

        # Check if users.json already exists in Drive
        query = (
            f"name='{_DRIVE_USERS_FILENAME}' and "
            f"'{root_folder_id}' in parents and "
            f"trashed=false"
        )
        results = service.files().list(
            q=query, spaces="drive", fields="files(id, name)"
        ).execute()
        existing = results.get("files", [])

        from googleapiclient.http import MediaFileUpload
        media = MediaFileUpload(
            str(_LOCAL_USERS_FILE), mimetype="application/json"
        )

        if existing:
            # Update existing file
            service.files().update(
                fileId=existing[0]["id"], media_body=media
            ).execute()
            LOG.info("Updated users.json on Google Drive")
        else:
            # Create new file
            file_meta = {
                "name": _DRIVE_USERS_FILENAME,
                "parents": [root_folder_id],
                "mimeType": "application/json",
            }
            service.files().create(
                body=file_meta, media_body=media, fields="id"
            ).execute()
            LOG.info("Created users.json on Google Drive")

    except Exception as e:
        LOG.warning("Drive sync failed for users.json: %s", e)


def _download_users_from_drive():
    """One-time download of users.json from Drive on startup."""
    try:
        from backend.drive_storage import get_drive_service, is_drive_connected

        if not is_drive_connected():
            return

        service = get_drive_service()
        if not service:
            return

        root_folder_id = os.environ.get(
            "GDRIVE_FOLDER_ID", "1uprxnQG_oHzL7ZNwz7D7-YydiYYz_WgB"
        )

        query = (
            f"name='{_DRIVE_USERS_FILENAME}' and "
            f"'{root_folder_id}' in parents and "
            f"trashed=false"
        )
        results = service.files().list(
            q=query, spaces="drive", fields="files(id, name)"
        ).execute()
        existing = results.get("files", [])

        if existing:
            import io
            from googleapiclient.http import MediaIoBaseDownload

            request = service.files().get_media(fileId=existing[0]["id"])
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()

            content = fh.getvalue().decode("utf-8")
            data = json.loads(content)
            if isinstance(data, list):
                _LOCAL_USERS_FILE.write_text(
                    json.dumps(data, indent=2, default=str), encoding="utf-8"
                )
                LOG.info(
                    "Downloaded users.json from Drive (%d users)", len(data)
                )
    except Exception as e:
        LOG.warning("Failed to download users.json from Drive: %s", e)


# Run initial sync on import
_download_users_from_drive()


# ══════════════════════════════════════════════════════════════════════
#  CORE AUTH FUNCTIONS
# ══════════════════════════════════════════════════════════════════════
def _generate_patient_id(users: list) -> str:
    """Generate next available patient ID like PAT-1001."""
    existing = set()
    for u in users:
        pid = u.get("patient_id", "")
        if pid and pid.startswith("PAT-"):
            try:
                existing.add(int(pid.split("-")[1]))
            except (ValueError, IndexError):
                pass
    next_num = max(existing, default=1000) + 1
    return f"PAT-{next_num}"


def signup(name: str, email: str, password: str, role: str = "patient") -> dict:
    """
    Create a new user account.

    Returns:
        User dict (without password_hash) on success.
    Raises:
        ValueError on validation errors.
    """
    # Validate
    if not name or not email or not password:
        raise ValueError("Name, email, and password are required")
    if role not in ("patient", "doctor"):
        raise ValueError("Role must be 'patient' or 'doctor'")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    email = email.lower().strip()
    users = _load_users()

    # Check duplicate
    if any(u["email"] == email for u in users):
        raise ValueError("An account with this email already exists")

    # Hash password
    password_hash = bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    # Build user record
    user = {
        "id": str(uuid.uuid4()),
        "name": name.strip(),
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "patient_id": _generate_patient_id(users) if role == "patient" else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    users.append(user)
    _save_users(users)

    # Return without password hash
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return safe_user


def login(email: str, password: str) -> dict:
    """
    Authenticate a user.

    Returns:
        { "token": "...", "user": { ... } }
    Raises:
        ValueError on invalid credentials.
    """
    if not email or not password:
        raise ValueError("Email and password are required")

    email = email.lower().strip()
    users = _load_users()

    user = next((u for u in users if u["email"] == email), None)
    if not user:
        raise ValueError("Invalid email or password")

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise ValueError("Invalid email or password")

    token = generate_token(user)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}

    return {"token": token, "user": safe_user}


def generate_token(user: dict) -> str:
    """Generate a JWT token for a user."""
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "patient_id": user.get("patient_id"),
        "exp": datetime.now(timezone.utc) + timedelta(hours=_JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.

    Returns:
        Decoded payload dict.
    Raises:
        ValueError on invalid/expired token.
    """
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def get_user_by_id(user_id: str) -> dict:
    """Look up user by ID. Returns user dict (without password) or None."""
    users = _load_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if user:
        return {k: v for k, v in user.items() if k != "password_hash"}
    return None
