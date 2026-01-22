from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TestData(BaseModel):
    user: str
    message: str

@router.get("/ping")
def ping():
    return {"message": "Test route is alive"}

@router.post("/")
def test_api(data: TestData):
    return {
        "user": data.user,
        "message": data.message,
        "status": "OK"
    }
