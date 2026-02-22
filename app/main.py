from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware


# Create FastAPI app instance
app = FastAPI(title="Interview With AI Backend")

# -----------------------------
# CORS Configuration
# -----------------------------
origins = [
    "http://localhost:5173",  # React frontend
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
