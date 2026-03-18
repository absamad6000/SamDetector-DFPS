from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="analyst") # admin, analyst, reviewer
    is_active = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True) # For 2FA

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    samples = relationship("AudioSample", back_populates="case")

class AudioSample(Base):
    __tablename__ = "audio_samples"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    filename = Column(String)
    file_path = Column(String) # Path to encrypted storage
    metadata_json = Column(JSON) # sample rate, bit depth, codec, SNR, etc.
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    case = relationship("Case", back_populates="samples")
    features = relationship("FeatureSet", back_populates="sample", uselist=False)

class FeatureSet(Base):
    __tablename__ = "feature_sets"
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("audio_samples.id"))
    version = Column(String) # Engine version
    parameters = Column(JSON) # Extraction parameters used
    features = Column(JSON) # The actual extracted feature data
    embeddings = Column(JSON, nullable=True) # X-vectors / I-vectors
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    sample = relationship("AudioSample", back_populates="features")

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # e.g., "UPLOAD_SAMPLE", "RUN_COMPARISON"
    details = Column(JSON)
    ip_address = Column(String)

class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./samdetect.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
