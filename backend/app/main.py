from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.logs import router as logs_router
from app.core.config import settings

from app.database.database import engine
from app.database.database import Base
from app.database import models


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Security Log Analyzer",
    version=settings.VERSION,
)

# Create SQLite tables automatically
Base.metadata.create_all(bind=engine)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(logs_router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "status": "Running",
    }