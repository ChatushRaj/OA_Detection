import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from model_loader import load_model
from inference import predict_image
from database import init_db, log_audit, SessionLocal, User
from auth import register_auth_routes, get_current_user, require_auth, generate_token
from routes_patients import patients_bp
from routes_scans import scans_bp
from routes_admin import admin_bp
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# ── Configure Gemini LLM ──
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_model = None
if GEMINI_KEY:
    try:
        genai.configure(api_key=GEMINI_KEY)
        gemini_model = genai.GenerativeModel("gemini-flash-latest")
        print("  Gemini LLM initialized successfully.")
    except Exception as e:
        print(f"  Warning: Gemini init failed: {e}")
else:
    print("  Warning: No GEMINI_API_KEY found. Chatbot will use keyword fallback.")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── Initialize database ──
print("=" * 60)
print("  Initializing Database...")
print("=" * 60)
init_db()

# ── Load model once at server startup ──
print("=" * 60)
print("  Initializing EfficientNetV2-MSCCM model...")
print("=" * 60)
try:
    model, device = load_model()
    model_loaded = True
except Exception as e:
    print(f"CRITICAL ERROR loading model: {e}")
    model = None
    device = "cpu"
    model_loaded = False

# ── Register auth routes ──
register_auth_routes(app)

# ── Register blueprints ──
app.register_blueprint(patients_bp)
app.register_blueprint(scans_bp)
app.register_blueprint(admin_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Basic health check to verify the server is up."""
    return jsonify({
        "status": "healthy",
        "model_loaded": model_loaded,
        "database": "connected"
    }), 200


# ── Profile management ──
@app.route("/api/profile", methods=["GET"])
@require_auth
def get_profile():
    """Get the current user's full profile from DB."""
    from flask import g
    session = SessionLocal()
    try:
        user = session.query(User).get(g.current_user.id)
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify({"user": user.to_dict()}), 200
    finally:
        session.close()


@app.route("/api/profile", methods=["PUT"])
@require_auth
def update_profile():
    """Update the current user's profile."""
    from flask import g
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required."}), 400

    session = SessionLocal()
    try:
        user = session.query(User).get(g.current_user.id)
        if not user:
            return jsonify({"error": "User not found."}), 404

        if "full_name" in data and data["full_name"].strip():
            user.full_name = data["full_name"].strip()
        if "email" in data:
            user.email = data["email"].strip()
        if "password" in data and data["password"].strip():
            user.set_password(data["password"].strip())

        session.commit()
        session.refresh(user)

        # Generate a new token with updated info
        new_token = generate_token(user)
        user_dict = user.to_dict()

        log_audit(user.id, "PROFILE_UPDATED", "profile",
                  {"fields": list(data.keys())}, request.remote_addr)

        return jsonify({
            "user": user_dict,
            "token": new_token,
            "message": "Profile updated."
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# ── AI Chatbot ──
@app.route("/api/chat", methods=["POST"])
@require_auth
def chatbot():
    """AI medical assistant chatbot - answers OA-related queries."""
    from flask import g
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required."}), 400

    message = data["message"].strip().lower()

    session = SessionLocal()
    try:
        user = g.current_user
        responses = get_chatbot_response(message, user, session)
        return jsonify({"reply": responses}), 200
    finally:
        session.close()


def get_chatbot_response(message, user, session):
    """Generate responses based on keyword matching and dynamic data analysis."""
    msg = message.lower()
    from database import Scan, Patient
    import json

    # 1. First, gather all scans available to the user context
    scans_query = session.query(Scan)
    if user.role == "patient":
        patient_ids = [p.id for p in session.query(Patient).filter_by(user_id=user.id).all()]
        scans_query = scans_query.filter(Scan.patient_id.in_(patient_ids))
    elif user.role == "doctor":
        patient_ids = [p.id for p in session.query(Patient).filter_by(doctor_id=user.id).all()]
        scans_query = scans_query.filter(Scan.patient_id.in_(patient_ids))
    
    all_scans = scans_query.order_by(Scan.created_at.desc()).all()

    # 2. Advanced Dynamic Analysis: Analyzing the records
    if any(w in msg for w in ["analyze", "analysis", "overview", "breakdown", "statistics", "summary", "summarize"]):
        if not all_scans:
            return "I couldn't find any scan data to analyze in your records."
        
        total = len(all_scans)
        grades_count = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, "Pending": 0}
        for s in all_scans:
            if s.grade_index is not None:
                grades_count[s.grade_index] += 1
            else:
                grades_count["Pending"] += 1
        
        reply = f"**Data Analysis Overview:**\n\nYou currently have access to a total of {total} scan(s).\n\n**Severity Breakdown:**\n"
        labels = ["0 (Normal)", "1 (Doubtful)", "2 (Mild)", "3 (Moderate)", "4 (Severe)", "Pending"]
        keys = [0, 1, 2, 3, 4, "Pending"]
        for k, label in zip(keys, labels):
            c = grades_count.get(k, 0)
            if c > 0:
                reply += f"• Grade {label}: {c} scan(s) ({round(c/total*100)}%)\n"
        
        avg_conf = sum(s.confidence for s in all_scans if s.confidence) / max(1, len([s for s in all_scans if s.confidence]))
        reply += f"\n**Average AI Confidence:** {(avg_conf * 100):.1f}%\n"
        return reply

    # 3. Advanced NLP-like Pattern Matching for data extraction
    # Catch complex intents like "how many of my patients are having grade 3"
    import re
    is_count_query = any(w in msg for w in ["how many", "count", "how much", "number of"])
    is_list_query = any(w in msg for w in ["which", "who", "list", "names", "what are", "show me all"])
    
    # Generic metrics
    target_patients = any(w in msg for w in ["patient", "patients", "people", "person", "who"])
    target_scans = any(w in msg for w in ["scan", "scans", "x-ray", "xray", "image", "images", "reports"])
    
    # Need to match grades
    grade_match = None
    if "grade 0" in msg or "normal" in msg: grade_match = 0
    elif "grade 1" in msg or "doubtful" in msg: grade_match = 1
    elif "grade 2" in msg or "mild" in msg: grade_match = 2
    elif "grade 3" in msg or "moderate" in msg: grade_match = 3
    elif "grade 4" in msg or "severe" in msg: grade_match = 4
    elif "pending" in msg or "unprocessed" in msg: grade_match = "Pending"
    
    if (is_count_query or is_list_query):
        # If no grade explicitly mentioned, we filter ALL
        if grade_match == "Pending":
            filtered = [s for s in all_scans if s.grade_index is None]
        elif grade_match is not None:
            filtered = [s for s in all_scans if s.grade_index == grade_match]
        else:
            filtered = all_scans
            
        label = "Pending" if grade_match == "Pending" else (f"Grade {grade_match}" if grade_match is not None else "Total")
        
        # Default to tracking patients if 'who', 'patient' is in msg or if target_patients explicitly True
        if target_patients or (not target_patients and not target_scans and "who" in msg):
            unique_patients = {}
            for s in filtered:
                if s.patient:
                    unique_patients[s.patient.id] = s.patient
            
            if is_count_query and not is_list_query:
                if grade_match is None:
                    return f"You currently have **{len(unique_patients)}** patient(s) across all records."
                return f"You currently have **{len(unique_patients)}** patient(s) with {label} scans."
            else:
                if not unique_patients:
                    lbl = f" with {label} scans " if grade_match is not None else " "
                    return f"You don't have any patients{lbl}at the moment."
                
                lbl = f" with {label} scans" if grade_match is not None else ""
                reply = f"**Patients{lbl} ({len(unique_patients)} total):**\n\n"
                for pid, pat in list(unique_patients.items())[:10]:
                    reply += f"• {pat.name} (Patient ID: {pat.id})\n"
                if len(unique_patients) > 10:
                    reply += f"\n*...and {len(unique_patients) - 10} more. Check the 'Patients' tab for full details.*"
                return reply
        elif target_scans or is_list_query:
            # Default to tracking scans
            if is_count_query and not is_list_query:
                if grade_match is None:
                     return f"There are **{len(filtered)}** scan(s) in your records."
                return f"There are **{len(filtered)}** {label} scan(s) in your records."
            else:
                if not filtered:
                    lbl = f" {label}" if grade_match is not None else ""
                    return f"There are no{lbl} scans in your records."
                lbl = f"{label} " if grade_match is not None else "All "
                reply = f"**{lbl}Scans ({len(filtered)} total):**\n\n"
                for s in filtered[:5]:
                    p_name = s.patient.name if s.patient else "Unknown Patient"
                    reply += f"• Scan ID {s.id} for {p_name} — **{s.predicted_class or 'Pending'}** (Grade {s.grade_index if s.grade_index is not None else 'N/A'})\n"
                if len(filtered) > 5:
                    reply += f"\n*...and {len(filtered) - 5} more. View the 'Scans' page for full details.*"
                return reply

    # 4. Dynamic Search Feature
    if any(w in msg for w in ["search", "find", "show me", "details of"]):
        # Extract potential search terms
        search_terms = msg.replace("search for", "").replace("search", "").replace("find", "").replace("show me", "").replace("details of", "").strip()
        if len(search_terms) < 3:
            return "Please provide more specific search terms (e.g., 'search for severe' or 'find grade 3')."
        
        matches = []
        for s in all_scans:
            text_to_search = f"{s.predicted_class} {s.notes} grade {s.grade_index}".lower()
            if s.patient:
                text_to_search += f" {s.patient.name.lower()}"
            if search_terms in text_to_search:
                matches.append(s)
        
        if not matches:
            return f"I couldn't find any records matching '{search_terms}'."
        
        reply = f"**Search Results for '{search_terms}':** Found {len(matches)} match(es).\n\n"
        for i, m in enumerate(matches[:3]):
            p_name = m.patient.name if m.patient else "Unknown Patient"
            reply += f"{i+1}. Scan ID {m.id} for {p_name} — **{m.predicted_class or 'Pending'}** (Grade {m.grade_index if m.grade_index is not None else 'N/A'})\n"
        if len(matches) > 3:
            reply += f"\n*...and {len(matches) - 3} more. View the 'Scans' page for full details.*"
        return reply

    # Dynamic queries (Legacy hardcoded but context aware)
    if any(w in msg for w in ["how many scans", "scan count", "number of scans", "how many patient", "patient count", "total"]):
        patient_count = len(set(s.patient_id for s in all_scans))
        return f"Based on your current role and permissions, there are {len(all_scans)} scan(s) across {patient_count} patient(s) available to you."

    if any(w in msg for w in ["latest report", "my reports", "recent scan", "last scan"]):
        if not all_scans:
            return "I couldn't find any scan reports in your record."
        
        latest_scan = all_scans[0]
        reply = f"**Summary of latest scan (ID: {latest_scan.id}):**\n\n"
        reply += f"• **Patient:** {latest_scan.patient.name if latest_scan.patient else 'Unknown'}\n"
        reply += f"• **Diagnosis:** {latest_scan.predicted_class or 'Pending'}\n"
        if latest_scan.grade_index is not None:
            reply += f"• **Severity:** Grade {latest_scan.grade_index}\n"
        if latest_scan.confidence:
            reply += f"• **AI Confidence:** {(latest_scan.confidence * 100):.1f}%\n"

        if latest_scan.suggestions:
            try:
                sugg_data = json.loads(latest_scan.suggestions)
                if isinstance(sugg_data, dict):
                    reply += f"\n**AI Assessment:**\n{sugg_data.get('summary', '')}\n"
            except:
                pass
        
        if latest_scan.notes:
            reply += f"\n**Notes:**\n{latest_scan.notes}\n"
            
        reply += "\nFor a full overview, you can download your reports from the dashboard."
        return reply

    # ── LLM Fallback: Use Gemini for all other questions ──
    return _ask_gemini(message, user, all_scans)


def _ask_gemini(message, user, scans):
    """Call Gemini LLM with medical context for intelligent responses."""
    if not gemini_model:
        return ("I can help you with questions about **osteoarthritis**, **KL grades**, "
                "**symptoms**, **treatment**, **exercise**, **diet**, **risk factors**, "
                "and **how to use this portal**. Just ask! 💬")

    # Build data context summary
    total = len(scans)
    grades = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    for s in scans:
        if s.grade_index is not None and s.grade_index in grades:
            grades[s.grade_index] += 1
    data_ctx = f"User has {total} scans. Grade distribution: {grades}." if total else "No scan data available."

    system_prompt = (
        "You are the OA Detection Portal AI Assistant — a helpful, friendly medical chatbot. "
        "You specialize in osteoarthritis (OA), knee X-ray analysis, and the Kellgren-Lawrence grading scale. "
        "You are embedded in a clinical web portal that uses EfficientNetV2-MSCCM for automated knee OA detection.\n\n"
        f"Current user: {user.full_name} (role: {user.role}).\n"
        f"Data context: {data_ctx}\n\n"
        "Rules:\n"
        "- Be concise but thorough. Use markdown bold (**text**) for emphasis.\n"
        "- For medical advice, always add a disclaimer to consult a doctor.\n"
        "- You can answer general knowledge questions too, not just OA.\n"
        "- Keep responses under 300 words.\n"
        "- Be warm and professional."
    )

    try:
        response = gemini_model.generate_content(
            [{'role': 'user', 'parts': [system_prompt + '\n\nUser question: ' + message]}],
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=1024,
                temperature=0.7,
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "I'm having trouble connecting to my AI brain right now. Please try again in a moment! 🔄"


# ── Audit logging middleware ──
@app.after_request
def audit_middleware(response):
    """Log all API requests to the audit log (non-GET only to reduce noise)."""
    if request.path.startswith("/api/") and request.method != "GET" and request.method != "OPTIONS":
        user = get_current_user()
        user_id = user.id if user else None
        try:
            log_audit(
                user_id=user_id,
                action=f"{request.method} {request.path}",
                resource=request.path,
                details={"status": response.status_code},
                ip_address=request.remote_addr,
            )
        except Exception:
            pass
    return response


# ── Legacy predict endpoint (backward compatibility) ──
@app.route("/predict", methods=["POST"])
def predict():
    """Run inference on an uploaded knee X-ray image."""
    if "image_file" not in request.files:
        return jsonify({"error": "No image file provided. Use field name 'image_file'."}), 400

    file = request.files["image_file"]

    if file.filename == "":
        return jsonify({"error": "Empty file name."}), 400

    allowed_extensions = {".jpg", ".jpeg", ".png"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file format '{ext}'. Use JPEG or PNG."}), 400

    try:
        predicted_class, confidence, grade_index, all_probabilities, suggestions = predict_image(file, model, device)

        if predicted_class is None:
            return jsonify({"error": "Failed to process image."}), 500

        return jsonify({
            "predicted_class": predicted_class,
            "confidence": float(f"{confidence:.4f}"),
            "grade_index": grade_index,
            "all_probabilities": all_probabilities,
            "suggestions": suggestions,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("  OA Detection Medical Portal — Flask Backend")
    print("  Auth:      POST /api/auth/login")
    print("  Profile:   GET/PUT /api/profile")
    print("  Patients:  /api/patients")
    print("  Scans:     /api/scans")
    print("  Chat:      POST /api/chat")
    print("  Admin:     /api/admin")
    print("  Legacy:    POST /predict")
    print("  Server:    http://localhost:5000")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False)
