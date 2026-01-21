from fastapi import FastAPI

app = FastAPI(title="Backend API")

@app.get("/health")
def health():
    return {"status": "ok"}