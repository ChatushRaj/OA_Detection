import os
import functools
from datetime import datetime, timedelta, timezone
import jwt
from flask import request, jsonify, g
from database import SessionLocal, User, log_audit

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is missing. Please check your .env file.")
TOKEN_EXPIRY_HOURS = 24


def generate_token(user):
    """Generate a JWT token for the given user."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email or "",
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


class TokenUser:
    """Lightweight user object from JWT payload — no DB session needed."""
    def __init__(self, payload):
        self.id = payload["user_id"]
        self.username = payload["username"]
        self.role = payload["role"]
        self.full_name = payload["full_name"]
        self.email = payload.get("email", "")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "email": self.email,
        }


def get_current_user():
    """Extract user from the Authorization header (from JWT, no DB query)."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        return None

    return TokenUser(payload)


def require_auth(f):
    """Decorator: require a valid JWT token."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required."}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return wrapper


def require_role(*roles):
    """Decorator factory: require specific role(s)."""
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required."}), 401
            if user.role not in roles:
                return jsonify({"error": "Insufficient permissions."}), 403
            g.current_user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator


def register_auth_routes(app):
    """Register authentication endpoints on the Flask app."""

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body required."}), 400

        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({"error": "Username and password are required."}), 400

        session = SessionLocal()
        try:
            user = session.query(User).filter_by(username=username).first()
            if not user or not user.check_password(password):
                log_audit(None, "LOGIN_FAILED", "auth", {"username": username}, request.remote_addr)
                return jsonify({"error": "Invalid credentials."}), 401

            token = generate_token(user)
            user_dict = user.to_dict()
            log_audit(user.id, "LOGIN_SUCCESS", "auth", None, request.remote_addr)

            return jsonify({
                "token": token,
                "user": user_dict,
            }), 200
        finally:
            session.close()

    @app.route("/api/auth/me", methods=["GET"])
    @require_auth
    def get_me():
        return jsonify({"user": g.current_user.to_dict()}), 200

    @app.route("/api/auth/logout", methods=["POST"])
    @require_auth
    def logout():
        log_audit(g.current_user.id, "LOGOUT", "auth", None, request.remote_addr)
        return jsonify({"message": "Logged out successfully."}), 200
