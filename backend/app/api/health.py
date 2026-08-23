from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


@router.get("/")
def health_check():
    return {
        "status": "healthy",
        "database": "Not Connected Yet",
        "ai": "Not Connected Yet",
        "version": "1.0.0"
    }