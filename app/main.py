from fastapi import FastAPI
from app.routes.auth_routes import router as auth_router


# Create FastAPI app instance
app = FastAPI(title="Interview With AI Backend")


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
