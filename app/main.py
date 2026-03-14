from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router
from app.routes.event_routes import router as event_router
from app.routes.test_routes import router as test_router
from app.routes.evaluation_routes import router as evaluation_router
from fastapi.middleware.cors import CORSMiddleware


# Create FastAPI app instance
app = FastAPI(title="Interview With AI Backend")

# -----------------------------
# CORS Configuration
# -----------------------------
origins = [
    "http://localhost:5173",  # React frontend
    "http://localhost:5174",  # React frontend (alt port)
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "*"
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

# Include chat routes (LLM Proxy - Phase 1)
app.include_router(chat_router)

# Include event routes (Interaction Trace Φ - Phase 2)
app.include_router(event_router)

# Include test execution routes (Phase 2)
app.include_router(test_router)

# Include evaluation routes (Phase 3)
app.include_router(evaluation_router)


@app.get("/")
def root():
    return {"message": "Interview With AI backend is running"}
    

# Application Flow:
# FastAPI app → include_router() → /auth routes become active
#
# Final Endpoints:
#   POST /auth/signup
#   POST /auth/signin
#
# Swagger UI:
#   http://127.0.0.1:8000/docs
