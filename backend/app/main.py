from fastapi import FastAPI

app = FastAPI(
    title="SentinelAI API",
    description="AI-Powered Security Log Analyzer",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to SentinelAI 🚀",
        "status": "Running"
    }