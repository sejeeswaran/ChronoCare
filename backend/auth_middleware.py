"""
Auth Middleware
===============
Flask decorators for protecting routes with JWT authentication
and role-based access control.
"""

from functools import wraps
from flask import request, jsonify


def require_auth(f):
    """
    Decorator: requires a valid JWT token in the Authorization header.

    Attaches `request.user` dict with keys:
        user_id, email, role, patient_id
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            from backend.auth import verify_token
            payload = verify_token(token)
        except ValueError as e:
            return jsonify({"error": str(e)}), 401

        # Attach user info to request
        request.user = {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "patient_id": payload.get("patient_id"),
        }
        return f(*args, **kwargs)

    return decorated


def require_role(role):
    """
    Decorator: requires a specific role (use AFTER @require_auth).

    Usage:
        @app.route(...)
        @require_auth
        @require_role('doctor')
        def admin_only_route():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", None)
            if not user:
                return jsonify({"error": "Authentication required"}), 401
            if user.get("role") != role:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
