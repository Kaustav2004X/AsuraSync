from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from auth import get_current_user
from services.scraper import scrape_series

router = APIRouter()

@router.get("/preview")
async def preview_series(url: str, user_id: str = Depends(get_current_user)):
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")

    try:
        data = await run_in_threadpool(scrape_series, url)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrape failed: {str(e)}")