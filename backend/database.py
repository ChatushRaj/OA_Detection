import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, scoped_session, joinedload
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medical_portal.db")

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(bind=engine))
Base = declarative_base()


# ── Models ──────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False)  # doctor, patient, admin
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    doctor = relationship("User", foreign_keys=[doctor_id], lazy="joined")
    scans = relationship("Scan", back_populates="patient", cascade="all, delete-orphan", lazy="select")

    def to_dict(self, include_scan_count=True):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "phone": self.phone,
            "doctor_id": self.doctor_id,
            "doctor_name": None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "scan_count": 0,
        }
        # Safely access relationships (may not be loaded)
        try:
            d["doctor_name"] = self.doctor.full_name if self.doctor else None
        except Exception:
            pass
        if include_scan_count:
            try:
                d["scan_count"] = len(self.scans) if self.scans else 0
            except Exception:
                d["scan_count"] = 0
        return d


class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    predicted_class = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    grade_index = Column(Integer, nullable=True)
    all_probabilities = Column(Text, nullable=True)  # JSON string
    suggestions = Column(Text, nullable=True)  # JSON string
    notes = Column(Text, default="")
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="scans", lazy="joined")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="joined")

    def to_dict(self):
        d = {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": None,
            "image_path": self.image_path,
            "predicted_class": self.predicted_class,
            "confidence": self.confidence,
            "grade_index": self.grade_index,
            "all_probabilities": json.loads(self.all_probabilities) if self.all_probabilities else {},
            "suggestions": json.loads(self.suggestions) if self.suggestions else {},
            "notes": self.notes,
            "uploaded_by": self.uploaded_by,
            "uploader_name": None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        try:
            d["patient_name"] = self.patient.name if self.patient else None
        except Exception:
            pass
        try:
            d["uploader_name"] = self.uploader.full_name if self.uploader else None
        except Exception:
            pass
        return d


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(200), nullable=True)
    details = Column(Text, nullable=True)  # JSON string
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", lazy="joined")

    def to_dict(self):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": "System",
            "action": self.action,
            "resource": self.resource,
            "details": json.loads(self.details) if self.details else {},
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
        try:
            d["user_name"] = self.user.full_name if self.user else "System"
        except Exception:
            pass
        return d


# ── Database Initialization ────────────────────────────

def init_db():
    """Create all tables and seed default users."""
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        # Only seed if no users exist
        if session.query(User).count() == 0:
            print("  Seeding default users...")

            admin = User(username="admin", role="admin", full_name="System Administrator", email="admin@oadetect.com")
            admin.set_password("admin123")

            doctor = User(username="doctor1", role="doctor", full_name="Dr. Sarah Johnson", email="sarah.johnson@oadetect.com")
            doctor.set_password("doctor123")

            patient_user = User(username="patient1", role="patient", full_name="John Smith", email="john.smith@email.com")
            patient_user.set_password("patient123")

            session.add_all([admin, doctor, patient_user])
            session.flush()

            # Create a patient record linked to the patient user and assigned to the doctor
            patient_record = Patient(
                user_id=patient_user.id,
                name="John Smith",
                age=55,
                gender="Male",
                phone="+1-555-0101",
                doctor_id=doctor.id,
            )
            session.add(patient_record)
            session.commit()
            print("  Default users created: admin, doctor1, patient1")
        else:
            print("  Database already has users, skipping seed.")
    except Exception as e:
        session.rollback()
        print(f"  Error seeding database: {e}")
    finally:
        session.close()


def get_db():
    """Get a database session."""
    return SessionLocal()


def log_audit(user_id, action, resource=None, details=None, ip_address=None):
    """Write an entry to the audit log."""
    session = SessionLocal()
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
        )
        session.add(entry)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"  Audit log error: {e}")
    finally:
        session.close()
