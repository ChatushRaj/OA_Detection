import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import get_chatbot_response
from database import SessionLocal, init_db, User, Patient, Scan

def run_tests():
    init_db()
    session = SessionLocal()
    
    # Get a doctor user, or create one if none exist
    doctor = session.query(User).filter_by(role='doctor').first()
    if not doctor:
        print("No doctor found. Make sure DB is seeded.")
        return
    
    # Make sure doctor has some patients
    patients = session.query(Patient).filter_by(doctor_id=doctor.id).all()
    if not patients:
        print(f"Adding some dummy patients for doctor {doctor.full_name}")
        p1 = Patient(name="Alice", age=60, gender="F", doctor_id=doctor.id)
        p2 = Patient(name="Bob", age=65, gender="M", doctor_id=doctor.id)
        p3 = Patient(name="Charlie", age=70, gender="M", doctor_id=doctor.id)
        session.add_all([p1, p2, p3])
        session.commit()
        patients = session.query(Patient).filter_by(doctor_id=doctor.id).all()
        
    print(f"Testing as {doctor.full_name} (ID: {doctor.id}) with {len(patients)} patients")
    
    # Add dummy scans to the first 3 patients
    if session.query(Scan).count() == 0:
        print("Adding dummy scans")
        s1 = Scan(patient_id=patients[0].id, image_path="dummy.jpg", predicted_class="Moderate", confidence=0.9, grade_index=3)
        s2 = Scan(patient_id=patients[1].id, image_path="dummy.jpg", predicted_class="Severe", confidence=0.85, grade_index=4)
        s3 = Scan(patient_id=patients[2].id, image_path="dummy.jpg", predicted_class="Moderate", confidence=0.95, grade_index=3)
        session.add_all([s1, s2, s3])
        session.commit()
    
    questions = [
        "how many patients do I have?",
        "which patients do I have?",
        "how many of my patients are having grade 3?",
        "which patients have moderate oa?",
        "how many of my patients are having grade 4?",
        "which patients have severe oa?",
        "how many scans do I have?",
        "show me all my scans",
        "how many moderate scans do I have?",
        "what is OA?",
        "details of alice"
    ]
    
    print("-" * 50)
    for q in questions:
        print(f"Q: {q}")
        reply = get_chatbot_response(q, doctor, session)
        print(f"A:\n{reply}")
        print("-" * 50)

if __name__ == "__main__":
    run_tests()
