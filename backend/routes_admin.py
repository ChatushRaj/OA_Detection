from flask import Blueprint, request, jsonify, g
from database import SessionLocal, User, Patient, Scan, AuditLog, log_audit
from auth import require_role

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@require_role("admin")
def list_users():
    """List all users."""
    session = SessionLocal()
    try:
        users = session.query(User).all()
        return jsonify({"users": [u.to_dict() for u in users]}), 200
    finally:
        session.close()


@admin_bp.route("/users", methods=["POST"])
@require_role("admin")
def create_user():
    """Create a new user."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required."}), 400

    required = ["username", "password", "role", "full_name"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required."}), 400

    if data["role"] not in ("doctor", "patient", "admin"):
        return jsonify({"error": "Role must be 'doctor', 'patient', or 'admin'."}), 400

    session = SessionLocal()
    try:
        # Check duplicate username
        if session.query(User).filter_by(username=data["username"]).first():
            return jsonify({"error": "Username already exists."}), 409

        user = User(
            username=data["username"],
            role=data["role"],
            full_name=data["full_name"],
            email=data.get("email", ""),
        )
        user.set_password(data["password"])
        session.add(user)
        session.commit()

        if data["role"] == "patient":
            patient = Patient(
                name=data["full_name"],
                user_id=user.id,
            )
            session.add(patient)
            session.commit()

        log_audit(g.current_user.id, "USER_CREATED", f"user/{user.id}",
                  {"username": user.username, "role": user.role}, request.remote_addr)

        return jsonify({"user": user.to_dict(), "message": "User created."}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@admin_bp.route("/logs", methods=["GET"])
@require_role("admin")
def get_logs():
    """Get audit logs with optional filters."""
    session = SessionLocal()
    try:
        query = session.query(AuditLog)

        user_id = request.args.get("user_id", type=int)
        action = request.args.get("action")
        limit = request.args.get("limit", 100, type=int)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)

        logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
        return jsonify({"logs": [l.to_dict() for l in logs]}), 200
    finally:
        session.close()


@admin_bp.route("/stats", methods=["GET"])
@require_role("admin")
def get_stats():
    """Get system statistics for the admin dashboard."""
    session = SessionLocal()
    try:
        total_users = session.query(User).count()
        total_doctors = session.query(User).filter_by(role="doctor").count()
        total_patients_users = session.query(User).filter_by(role="patient").count()
        total_patient_records = session.query(Patient).count()
        total_scans = session.query(Scan).count()
        recent_logs = session.query(AuditLog).count()

        return jsonify({
            "stats": {
                "total_users": total_users,
                "total_doctors": total_doctors,
                "total_patients": total_patients_users,
                "total_patient_records": total_patient_records,
                "total_scans": total_scans,
                "total_logs": recent_logs,
            }
        }), 200
    finally:
        session.close()


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@require_role("admin")
def update_user(user_id):
    """Update user details."""
    data = request.get_json()
    session = SessionLocal()
    try:
        user = session.query(User).get(user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404

        if "full_name" in data:
            user.full_name = data["full_name"]
        if "email" in data:
            user.email = data["email"]
        if "role" in data and data["role"] in ("doctor", "patient", "admin"):
            user.role = data["role"]
        if "password" in data and data["password"].strip():
            user.set_password(data["password"].strip())

        session.commit()
        session.refresh(user)

        log_audit(g.current_user.id, "USER_UPDATED", f"user/{user.id}",
                  {"changes": {k: v for k, v in data.items() if k != "password"}}, request.remote_addr)

        return jsonify({"user": user.to_dict(), "message": "User updated."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@require_role("admin")
def delete_user(user_id):
    """Delete a user."""
    if g.current_user.id == user_id:
        return jsonify({"error": "Cannot delete yourself."}), 400

    session = SessionLocal()
    try:
        user = session.query(User).get(user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404

        # Delete associated patient record if exists
        patient = session.query(Patient).filter_by(user_id=user_id).first()
        if patient:
            session.delete(patient)

        username = user.username
        session.delete(user)
        session.commit()

        log_audit(g.current_user.id, "USER_DELETED", f"user/{user_id}",
                  {"username": username}, request.remote_addr)

        return jsonify({"message": f"User '{username}' deleted."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
