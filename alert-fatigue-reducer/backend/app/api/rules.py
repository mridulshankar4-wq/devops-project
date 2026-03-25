from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_rules():
    return {"rules": [], "message": "Routing rules endpoint"}
