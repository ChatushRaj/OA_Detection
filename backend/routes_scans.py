import os
import json
from flask import Blueprint, request, jsonify, g, send_file
from werkzeug.utils import secure_filename
from database import SessionLocal, Scan, Patient, log_audit
from auth import require_auth, require_role, decode_token

scans_bp = Blueprint("scans", __name__, url_prefix="/api/scans")

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@scans_bp.route("", methods=["GET"])
@require_auth
def list_scans():
    """List scans based on role. Optionally filter by patient_id."""
    session = SessionLocal()
    try:
        user = g.current_user
        patient_id = request.args.get("patient_id", type=int)

        query = session.query(Scan)

        if patient_id:
            query = query.filter(Scan.patient_id == patient_id)

        if user.role == "patient":
            patient_ids = [p.id for p in session.query(Patient).filter_by(user_id=user.id).all()]
            query = query.filter(Scan.patient_id.in_(patient_ids))
        elif user.role == "doctor":
            patient_ids = [p.id for p in session.query(Patient).filter_by(doctor_id=user.id).all()]
            query = query.filter(Scan.patient_id.in_(patient_ids))

        scans = query.order_by(Scan.created_at.desc()).all()
        result = [s.to_dict() for s in scans]
        return jsonify({"scans": result}), 200
    finally:
        session.close()


@scans_bp.route("/export", methods=["GET"])
@require_auth
def export_scans():
    """Export scans as CSV."""
    import csv
    import io
    from flask import Response
    
    session = SessionLocal()
    try:
        user = g.current_user
        patient_id = request.args.get("patient_id", type=int)
        scan_ids_str = request.args.get("scan_ids", type=str)

        query = session.query(Scan)

        if patient_id:
            query = query.filter(Scan.patient_id == patient_id)
            
        if scan_ids_str:
            try:
                s_ids = [int(sid.strip()) for sid in scan_ids_str.split(",") if sid.strip().isdigit()]
                if s_ids:
                    query = query.filter(Scan.id.in_(s_ids))
            except:
                pass

        if user.role == "patient":
            patient_ids = [p.id for p in session.query(Patient).filter_by(user_id=user.id).all()]
            query = query.filter(Scan.patient_id.in_(patient_ids))
        elif user.role == "doctor":
            patient_ids = [p.id for p in session.query(Patient).filter_by(doctor_id=user.id).all()]
            query = query.filter(Scan.patient_id.in_(patient_ids))

        scans = query.order_by(Scan.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        headers = ["Scan ID", "Patient Name", "Date", "Diagnosis", "Confidence", "Grade", "Urgency", "Notes"]
        writer.writerow(headers)

        for scan in scans:
            patient_name = scan.patient.name if scan.patient else "Unknown"
            date_str = scan.created_at.strftime("%Y-%m-%d %H:%M:%S") if scan.created_at else "Unknown"
            conf_str = f"{(scan.confidence * 100):.1f}%" if scan.confidence else "N/A"
            
            urgency = "Normal"
            if scan.suggestions:
                try:
                    sugg_data = json.loads(scan.suggestions)
                    if isinstance(sugg_data, dict):
                        urgency = sugg_data.get("urgency", "Normal")
                except:
                    pass
            
            writer.writerow([
                scan.id,
                patient_name,
                date_str,
                scan.predicted_class or "Pending",
                conf_str,
                f"Grade {scan.grade_index}" if scan.grade_index is not None else "N/A",
                urgency,
                scan.notes or ""
            ])
            
        csv_data = output.getvalue()
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=scans_report_{user.role}.csv"}
        )
    finally:
        session.close()


@scans_bp.route("/upload", methods=["POST"])
@require_auth
def upload_scan():
    """Upload an X-ray image, run inference, and save the result."""
    if "image_file" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file = request.files["image_file"]
    patient_id = request.form.get("patient_id", type=int)

    if not patient_id:
        return jsonify({"error": "patient_id is required."}), 400

    if file.filename == "":
        return jsonify({"error": "Empty file name."}), 400

    allowed_ext = {".jpg", ".jpeg", ".png"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_ext:
        return jsonify({"error": f"Unsupported format '{ext}'. Use JPEG or PNG."}), 400

    session = SessionLocal()
    try:
        user = g.current_user

        patient = session.query(Patient).get(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found."}), 404

        if user.role == "patient" and patient.user_id != user.id:
            return jsonify({"error": "Access denied."}), 403
        if user.role == "doctor" and patient.doctor_id != user.id:
            return jsonify({"error": "Access denied."}), 403

        # Save image
        from datetime import datetime
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = secure_filename(file.filename)
        filename = f"scan_{patient_id}_{timestamp}_{safe_name}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        file.save(filepath)

        # Run inference
        predicted_class = None
        confidence = None
        grade_index = None
        all_probs = {}
        suggestions = {}

        try:
            from app import model, device
            from inference import predict_image
            with open(filepath, "rb") as img_file:
                predicted_class, confidence, grade_index, all_probs, suggestions = predict_image(img_file, model, device)
        except Exception as e:
            print(f"  Inference error (non-fatal): {e}")

        # Save scan record
        scan = Scan(
            patient_id=patient_id,
            image_path=filename,
            predicted_class=predicted_class,
            confidence=float(f"{confidence:.4f}") if confidence else None,
            grade_index=grade_index,
            all_probabilities=json.dumps(all_probs) if all_probs else None,
            suggestions=json.dumps(suggestions) if suggestions else None,
            notes=request.form.get("notes", ""),
            uploaded_by=user.id,
        )
        session.add(scan)
        session.commit()
        session.refresh(scan)

        result = scan.to_dict()

        log_audit(user.id, "SCAN_UPLOADED", f"scan/{scan.id}",
                  {"patient_id": patient_id, "filename": filename}, request.remote_addr)

        return jsonify({"scan": result, "message": "Scan uploaded and analyzed."}), 201
    except Exception as e:
        session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@scans_bp.route("/<int:scan_id>", methods=["GET"])
@require_auth
def get_scan(scan_id):
    """Get a single scan's details."""
    session = SessionLocal()
    try:
        user = g.current_user
        scan = session.query(Scan).get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found."}), 404

        patient = scan.patient
        if user.role == "patient" and patient.user_id != user.id:
            return jsonify({"error": "Access denied."}), 403
        if user.role == "doctor" and patient.doctor_id != user.id:
            return jsonify({"error": "Access denied."}), 403

        result = scan.to_dict()
        return jsonify({"scan": result}), 200
    finally:
        session.close()


@scans_bp.route("/<int:scan_id>", methods=["PUT"])
@require_role("doctor", "admin")
def update_scan(scan_id):
    """Update scan notes or results."""
    data = request.get_json()
    session = SessionLocal()
    try:
        user = g.current_user
        scan = session.query(Scan).get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found."}), 404

        if user.role == "doctor":
            patient = scan.patient
            if patient and patient.doctor_id != user.id:
                return jsonify({"error": "Access denied."}), 403

        if "notes" in data:
            scan.notes = data["notes"]
        if "predicted_class" in data:
            scan.predicted_class = data["predicted_class"]
        if "grade_index" in data:
            scan.grade_index = data["grade_index"]

        session.commit()
        session.refresh(scan)
        result = scan.to_dict()

        log_audit(user.id, "SCAN_UPDATED", f"scan/{scan.id}",
                  {"changes": data}, request.remote_addr)

        return jsonify({"scan": result, "message": "Scan updated."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@scans_bp.route("/<int:scan_id>", methods=["DELETE"])
@require_role("admin")
def delete_scan(scan_id):
    """Delete a scan (admin only)."""
    session = SessionLocal()
    try:
        scan = session.query(Scan).get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found."}), 404

        filepath = os.path.join(UPLOAD_DIR, scan.image_path)
        if os.path.exists(filepath):
            os.remove(filepath)

        session.delete(scan)
        session.commit()

        log_audit(g.current_user.id, "SCAN_DELETED", f"scan/{scan_id}", None, request.remote_addr)
        return jsonify({"message": "Scan deleted."}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@scans_bp.route("/<int:scan_id>/image", methods=["GET"])
def get_scan_image(scan_id):
    """Serve the scan image file. Accepts token via header OR query param."""
    # Allow token via query string for <img> tags
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        token = request.args.get("token")

    if not token:
        return jsonify({"error": "Authentication required."}), 401

    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token."}), 401

    session = SessionLocal()
    try:
        scan = session.query(Scan).get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found."}), 404

        filepath = os.path.join(UPLOAD_DIR, scan.image_path)
        if not os.path.exists(filepath):
            return jsonify({"error": "Image file not found."}), 404

        return send_file(filepath, mimetype="image/jpeg")
    finally:
        session.close()
