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
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    # Vercel Production
    "https://sentinel-ai-steel-alpha.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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