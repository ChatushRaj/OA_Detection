from flask import Blueprint, request, jsonify, g
from database import SessionLocal, Patient, User, log_audit
from auth import require_auth, require_role

patients_bp = Blueprint("patients", __name__, url_prefix="/api/patients")


@patients_bp.route("", methods=["GET"])
@require_auth
def list_patients():
    """List patients. Doctors see their own, admins see all, patients see themselves."""
    session = SessionLocal()
    try:
        user = g.current_user
        if user.role == "admin":
            patients = session.query(Patient).all()
        elif user.role == "doctor":
            patients = session.query(Patient).filter_by(doctor_id=user.id).all()
        elif user.role == "patient":
            patients = session.query(Patient).filter_by(user_id=user.id).all()
        else:
            return jsonify({"error": "Invalid role."}), 403

        result = [p.to_dict() for p in patients]
        return jsonify({"patients": result}), 200
    finally:
        session.close()


@patients_bp.route("", methods=["POST"])
@require_role("doctor", "admin")
def create_patient():
    """Create a new patient record."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "Patient name is required."}), 400

    session = SessionLocal()
    try:
        user = g.current_user
        doctor_id = data.get("doctor_id", user.id if user.role == "doctor" else None)

        user_id = data.get("user_id")
        generated_credentials = None

        if not user_id:
            import random
            username_base = "".join(data["name"].split()).lower()
            if not username_base:
                username_base = "patient"
            username = f"{username_base}{random.randint(100, 999)}"
            
            while session.query(User).filter_by(username=username).first():
                username = f"{username_base}{random.randint(1000, 9999)}"

            default_pw = "Patient@123"
            new_user = User(
                username=username,
                role="patient",
                full_name=data["name"],
            )
            new_user.set_password(default_pw)
            session.add(new_user)
            session.commit()
            
            user_id = new_user.id
            generated_credentials = {"username": username, "password": default_pw}

        patient = Patient(
            name=data["name"],
            age=data.get("age"),
            gender=data.get("gender"),
            phone=data.get("phone"),
            doctor_id=doctor_id,
            user_id=user_id,
        )
        session.add(patient)
        session.commit()
        session.refresh(patient)

        result = patient.to_dict()
        if generated_credentials:
            result["credentials"] = generated_credentials

        log_audit(user.id, "PATIENT_CREATED", f"patient/{patient.id}",
                  {"name": patient.name}, request.remote_addr)

        return jsonify({"patient": result, "message": "Patient created."}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@patients_bp.route("/<int:patient_id>", methods=["GET"])
@require_auth
def get_patient(patient_id):
    """Get a single patient's details."""
    session = SessionLocal()
    try:
        user = g.current_user
        patient = session.query(Patient).get(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found."}), 404

        # Access control
        if user.role == "patient" and patient.user_id != user.id:
            return jsonify({"error": "Access denied."}), 403
        if user.role == "doctor" and patient.doctor_id != user.id:
            return jsonify({"error": "Access denied."}), 403

        result = patient.to_dict()
        return jsonify({"patient": result}), 200
    finally:
        session.close()


@patients_bp.route("/<int:patient_id>", methods=["PUT"])
@require_role("doctor", "admin")
def update_patient(patient_id):
    """Update patient information."""
    data = request.get_json()
    session = SessionLocal()
    try:
        user = g.current_user
        patient = session.query(Patient).get(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found."}), 404

        if user.role == "doctor" and patient.doctor_id != user.id:
            return jsonify({"error": "Access denied."}), 403

        if "name" in data:
            patient.name = data["name"]
        if "age" in data:
            patient.age = data["age"]
        if "gender" in data:
            patient.gender = data["gender"]
        if "phone" in data:
            patient.phone = data["phone"]
        if "doctor_id" in data and user.role == "admin":
            patient.doctor_id = data["doctor_id"]

        session.commit()
        session.refresh(patient)
        result = patient.to_dict()

        log_audit(user.id, "PATIENT_UPDATED", f"patient/{patient.id}",
                  {"changes": data}, request.remote_addr)

        return jsonify({"patient": result, "message": "Patient updated."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@patients_bp.route("/<int:patient_id>", methods=["DELETE"])
@require_role("admin")
def delete_patient(patient_id):
    """Delete a patient (admin only)."""
    session = SessionLocal()
    try:
        patient = session.query(Patient).get(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found."}), 404

        name = patient.name
        session.delete(patient)
        session.commit()

        log_audit(g.current_user.id, "PATIENT_DELETED", f"patient/{patient_id}",
                  {"name": name}, request.remote_addr)

        return jsonify({"message": f"Patient '{name}' deleted."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
