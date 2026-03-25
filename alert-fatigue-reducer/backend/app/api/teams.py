from fastapi import APIRouter

router = APIRouter()

TEAMS = [
    {"id": "platform", "name": "Platform Engineering", "email": "platform@company.com", "oncall": "Alice Chen"},
    {"id": "backend", "name": "Backend Services", "email": "backend@company.com", "oncall": "Bob Smith"},
    {"id": "data-engineering", "name": "Data Engineering", "email": "data@company.com", "oncall": "Carol Davis"},
    {"id": "security", "name": "Security", "email": "security@company.com", "oncall": "Dave Wilson"},
    {"id": "infra", "name": "Infrastructure", "email": "infra@company.com", "oncall": "Eve Martinez"},
    {"id": "frontend", "name": "Frontend", "email": "frontend@company.com", "oncall": "Frank Lee"},
]


@router.get("/")
async def list_teams():
    return {"teams": TEAMS}
