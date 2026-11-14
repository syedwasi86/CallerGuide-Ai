from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.calls import router as calls_router
from app.core.config import settings
from app.services.call_service import CallService

app = FastAPI(
    title=settings.app_name,
    description="Backend API for CallGuide AI cold-call companion (FastAPI + Supabase PostgreSQL)",
    version="0.2.0",
)

# Configure CORS for frontend access
cors_origins = list(settings.cors_origins) if isinstance(settings.cors_origins, list) else [settings.cors_origins]
if settings.frontend_origin and settings.frontend_origin not in cors_origins:
    cors_origins.append(settings.frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(calls_router, prefix="/api")


@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint returning service identity and status."""
    return {
        "name": settings.app_name,
        "version": "0.2.0",
        "status": "online",
        "environment": settings.environment,
        "database": "configured" if settings.is_supabase_configured else "unconfigured",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service readiness and database connectivity."""
    service = CallService()
    db_status = service.check_db_health()
    return {
        "status": "ok",
        **db_status,
    }
