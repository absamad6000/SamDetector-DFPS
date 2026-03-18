"""
SamDetector | DFPS — Professional Digital Forensic Phonetics Suite.
Serves the high-precision vocal biometric engine.
"""

import os
import tempfile
import shutil
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import uvicorn

from .analysis import extract_features
from .similarity import compute_similarity
from .database import engine, Base, SessionLocal, User, Case, AudioSample, FeatureSet, AuditLog, ContactMessage, get_db
from .security import encrypt_audio, decrypt_audio
from .comparison import LikelihoodRatioEngine
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Header
import os

app = FastAPI(title="SamDetector API")

# CORS (allow local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Temp storage for uploaded files ---
UPLOAD_DIR = Path(tempfile.mkdtemp(prefix="vct_"))

# --- Store latest features in-memory (multi-sample session) ---
feature_store = {"a": None, "b": None}


@app.post("/api/analyze")
async def analyze_audio(label: str, file: UploadFile = File(...)):
    """
    Upload an audio file for feature extraction.
    label must be 'a' or 'b'.
    """
    if label not in ("a", "b"):
        raise HTTPException(status_code=400, detail="Label must be 'a' or 'b'.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in (".wav", ".mp3"):
        raise HTTPException(status_code=400, detail="Only .wav and .mp3 files are supported.")

    # Save to temp file
    tmp_path = UPLOAD_DIR / f"sample_{label}{suffix}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        features = extract_features(str(tmp_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    feature_store[label] = features
    
    # Traceability & Versioning
    features["engine_version"] = "2.0.0"
    features["reproducibility_seed"] = 42
    
    return {"label": label, "features": features}


@app.post("/api/similarity")
async def similarity():
    """
    Compare the two most recently analyzed samples.
    """
    if feature_store["a"] is None or feature_store["b"] is None:
        raise HTTPException(
            status_code=400,
            detail="Both Sample A and Sample B must be analyzed first.",
        )
    result = compute_similarity(feature_store["a"], feature_store["b"])
    return result


class BatchPair(BaseModel):
    features_a: dict
    features_b: dict


class BatchRequest(BaseModel):
    pairs: List[BatchPair]


@app.post("/api/batch")
async def batch_compare(req: BatchRequest):
    """
    Batch compare multiple feature pairs. Returns individual and aggregated results.
    """
    results = []
    for pair in req.pairs:
        r = compute_similarity(pair.features_a, pair.features_b)
        results.append(r)

    similarities = [r["similarity_pct"] for r in results]
    import numpy as np

    return {
        "results": results,
        "aggregate": {
            "mean_similarity": round(float(np.mean(similarities)), 1),
            "std_similarity": round(float(np.std(similarities)), 1),
            "min_similarity": round(float(np.min(similarities)), 1),
            "max_similarity": round(float(np.max(similarities)), 1),
            "count": len(results),
        },
    }


# --- Serve frontend static files ---
FRONTEND_DIR = Path(__file__).resolve().parent.parent

app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")


# Create tables on startup
Base.metadata.create_all(bind=engine)


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

DEV_PASSWORD = os.getenv("DEV_PASSWORD", "Samad87727")

@app.post("/api/contact")
async def submit_contact(req: ContactRequest):
    """Save a contact message to the database and email the developer."""
    db = SessionLocal()
    try:
        msg = ContactMessage(name=req.name, email=req.email, message=req.message)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        db.refresh(msg)
        
        return {"status": "ok", "id": msg.id}
    finally:
        db.close()


@app.get("/api/dev/messages")
async def get_messages(authorization: str = Header(None)):
    """Retrieve all contact messages (Developer Only)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    if token != DEV_PASSWORD:
        raise HTTPException(status_code=403, detail="Forbidden")

    db = SessionLocal()
    try:
        msgs = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
        return [{"id": m.id, "name": m.name, "email": m.email, "message": m.message, "created_at": str(m.created_at), "is_read": m.is_read} for m in msgs]
    finally:
        db.close()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/")
async def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=60871, reload=True)
