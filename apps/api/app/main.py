"""
GoldEye FastAPI — main entry point.
Provides the stateless POST /api/assess endpoint plus session management.
All signal workers run as async Celery tasks fanned out from /api/assess.
"""
import uuid
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.session import router as session_router
from app.routes.assess import router as assess_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("goldeye")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GoldEye API starting up…")
    yield
    logger.info("GoldEye API shutting down.")


app = FastAPI(
    title="GoldEye API",
    description="AI-powered gold-loan pre-qualification — stateless assessment API.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — tighten in production to your Cloudflare Pages domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request-ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def add_trace_id(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
    request.state.trace_id = trace_id
    t0 = time.time()
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    response.headers["X-Response-Time-Ms"] = str(int((time.time() - t0) * 1000))
    return response


# ─── Routes ────────────────────────────────────────────────────────────────────
app.include_router(session_router, prefix="/session", tags=["Session"])
app.include_router(assess_router, prefix="/api", tags=["Assessment"])


@app.get("/health", tags=["Infra"])
async def health():
    return {"status": "ok", "service": "goldeye-api", "version": "0.1.0"}
