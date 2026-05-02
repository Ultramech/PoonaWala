"""
Session management — init, upload, finalize.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class SessionInitRequest(BaseModel):
    lang: str = "en"
    phone: Optional[str] = None


class SessionInitResponse(BaseModel):
    session_id: str
    created_at: str
    upload_url_prefix: str  # MinIO/R2 prefix for asset uploads


class ConsentRequest(BaseModel):
    session_id: str
    version: str = "v1.0"


class ConsentResponse(BaseModel):
    session_id: str
    consent_recorded_at: str


# In-memory session store (Phase 8 replaces with Postgres)
_sessions: dict[str, dict] = {}


@router.post("/init", response_model=SessionInitResponse)
async def init_session(req: SessionInitRequest):
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    _sessions[session_id] = {
        "id": session_id,
        "lang": req.lang,
        "phone": req.phone,
        "status": "in_progress",
        "created_at": now,
        "assets": [],
    }
    return SessionInitResponse(
        session_id=session_id,
        created_at=now,
        upload_url_prefix=f"sessions/{session_id}/",
    )


@router.post("/consent", response_model=ConsentResponse)
async def record_consent(req: ConsentRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    now = datetime.now(timezone.utc).isoformat()
    session["consent_at"] = now
    session["consent_version"] = req.version
    return ConsentResponse(session_id=req.session_id, consent_recorded_at=now)


@router.get("/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
