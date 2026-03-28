from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import user
from routers import scrape
from routers import library
from services.scheduler import start_scheduler, stop_scheduler
import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
from routers import notifications

app = FastAPI(title="AsuraSync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
    
app.include_router(user.router, prefix="/api/user")
app.include_router(scrape.router, prefix="/api/scrape")
app.include_router(library.router, prefix="/api/library")
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/test-db")
def test_db():
    from database import supabase
    result = supabase.table("profiles").select("id").limit(1).execute()
    return {"connected": True, "data": result.data}

from auth import get_current_user
from fastapi import Depends

@app.get("/api/test-auth")
async def test_auth(user_id: str = Depends(get_current_user)):
    return {"authenticated": True, "user_id": user_id}

@app.post("/api/admin/poll")
async def manual_poll(user_id: str = Depends(get_current_user)):
    from services.scheduler import poll_chapters
    from fastapi.concurrency import run_in_threadpool
    await run_in_threadpool(poll_chapters)
    return {"message": "Poll complete"}