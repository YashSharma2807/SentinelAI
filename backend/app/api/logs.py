from pathlib import Path
import shutil

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.ai.analyzer import generate_incident_report
from app.services.log_service import analyze_log

from app.database.database import SessionLocal
from app.database.database import get_db
from app.database.models import LogHistory

router = APIRouter(
    prefix="/logs",
    tags=["Logs"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_log(file: UploadFile = File(...)):

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = analyze_log(str(file_path))

    detections = analysis["detections"]

    ai_report = generate_incident_report(detections)

    # ----------------------------
    # Save into SQLite
    # ----------------------------

    db: Session = SessionLocal()

    try:

        first_detection = detections[0] if detections else {}

        history = LogHistory(
            filename=file.filename,
            threat=first_detection.get("attack", "Unknown"),
            severity=first_detection.get("severity", "Unknown"),
            total_detections=len(detections),
            ai_report=ai_report,
        )

        db.add(history)
        db.commit()
        db.refresh(history)

    finally:
        db.close()

    # ----------------------------

    return {
        "success": True,
        "filename": file.filename,
        "events": analysis["events"],
        "detections": detections,
        "total_detections": len(detections),
        "ai_report": ai_report
    }


@router.get("/history")
def get_history(db: Session = Depends(get_db)):

    history = (
        db.query(LogHistory)
        .order_by(LogHistory.uploaded_at.desc())
        .all()
    )

    return history