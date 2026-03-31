# Suppress deprecated google.generativeai FutureWarning
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router
from app.routes.event_routes import router as event_router
from app.routes.test_routes import router as test_router
from app.routes.evaluation_routes import router as evaluation_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.session_routes import router as session_router, router_sessions
from fastapi.middleware.cors import CORSMiddleware

from app.routes.dsa_interview_routes import router as dsa_router

import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # Startup
    try:
        from app.database import db
        db.command('ping')
        logger.info("✅ MongoDB connection successful!")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {str(e)}")
    yield
    # Shutdown (nothing needed)


# Create FastAPI app instance
app = FastAPI(title="Interview With AI Backend", lifespan=lifespan)

# -----------------------------
# CORS Configuration
# -----------------------------
origins = [
    "http://localhost:5173",  # React frontend
    "http://localhost:5174",  # React frontend (alt port)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include authentication routes
app.include_router(auth_router)
# Include DSA interview routes
app.include_router(dsa_router)

# Include chat routes (LLM Proxy - Phase 1)
app.include_router(chat_router)

# Include event routes (Interaction Trace Φ - Phase 2)
app.include_router(event_router)

# Include test execution routes (Phase 2)
app.include_router(test_router)

# Include evaluation routes (Phase 3)
app.include_router(evaluation_router)

# Include dashboard routes (Phase 4)
app.include_router(dashboard_router)

# Include session routes (Phase 5 - Session Management & Group Sessions)
app.include_router(session_router)      # /api/sessions/bulk-create, /api/session-groups
app.include_router(router_sessions)     # /api/sessions/*


@app.get("/")
def root():
    return {"message": "Interview With AI backend is running"}


@app.get("/health")
def health_check():
    """Check if backend and database are healthy. Returns 503 if unhealthy."""
    try:
        from app.database import db
        db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        # Return 503 Service Unavailable instead of 200 for failed health checks
        # This allows load balancers and monitoring tools to detect unhealthy instances
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {str(e)}"
        )
    

# Startup logic moved to lifespan context manager above

# Application Flow:
# FastAPI app → include_router() → /auth routes become active
#
# Final Endpoints:
#   POST /auth/signup
#   POST /auth/signin
#
# Swagger UI:
#   http://127.0.0.1:8000/docs
