from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import supabase
from models.library import SeriesAdd, SeriesUpdate, SeriesResponse
from services.scraper import scrape_series

router = APIRouter()

@router.get("")
async def get_library(user_id: str = Depends(get_current_user)):
    result = supabase.table("user_library") \
        .select("id, rating, notifications, notes, read_chapters, added_on, last_read_at, series(id, source_url, title, cover_url, status, description, latest_chapter)") \
        .eq("user_id", user_id) \
        .execute()

    library = []
    for entry in (result.data or []):
        s = entry.get("series") or {}
        library.append({
            "id":            entry["id"],
            "seriesId":      s.get("id"),
            "url":           s.get("source_url"),
            "title":         s.get("title"),
            "cover":         s.get("cover_url"),
            "status":        s.get("status"),
            "description":   s.get("description"),
            "latestChapter": s.get("latest_chapter", 0),
            "readChapters":  entry.get("read_chapters", 0),
            "rating":        entry.get("rating"),
            "notifications": entry.get("notifications", True),
            "notes":         entry.get("notes", ""),
            "addedOn":       entry.get("added_on"),
            "lastReadAt":    entry.get("last_read_at"),
        })
    return library


@router.post("")
async def add_to_library(body: SeriesAdd, user_id: str = Depends(get_current_user)):
    source_url = body.url.rstrip("/")

    # ── Check if series already exists in DB (shared across all users) ────
    series_check = supabase.table("series") \
        .select("id, title, cover_url, status, description, latest_chapter") \
        .eq("source_url", source_url) \
        .execute()

    existing_series = series_check.data[0] if series_check.data else None

    # ── Check if this user already has it ─────────────────────────────────
    if existing_series:
        series_id = existing_series["id"]
        lib_check = supabase.table("user_library") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("series_id", series_id) \
            .execute()
        if lib_check.data:
            raise HTTPException(status_code=409, detail="Already in library")

        # Reuse existing series row — no scrape needed
        scraped = {
            "title":        existing_series["title"],
            "cover":        existing_series["cover_url"] or "",
            "status":       existing_series["status"],
            "description":  existing_series["description"],
            "latestChapter": existing_series["latest_chapter"] or 0,
        }

    else:
        # New series — scrape it
        try:
            scraped = scrape_series(source_url)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Scrape failed: {str(e)}")

        insert_result = supabase.table("series").insert({
            "source_url":     source_url,
            "title":          scraped.get("title", "Unknown"),
            "cover_url":      scraped.get("cover", ""),
            "status":         scraped.get("status", "Ongoing"),
            "description":    scraped.get("description", ""),
            "latest_chapter": scraped.get("latestChapter", 0),
        }).execute()

        if not insert_result.data:
            raise HTTPException(status_code=500, detail="Failed to insert series")

        series_id = insert_result.data[0]["id"]

    # ── Add to user's library ──────────────────────────────────────────────
    lib_result = supabase.table("user_library").insert({
        "user_id":       user_id,
        "series_id":     series_id,
        "read_chapters": 0,
        "notifications": True,
    }).execute()

    if not lib_result.data:
        raise HTTPException(status_code=500, detail="Failed to add to library")

    return {
        "id":            lib_result.data[0]["id"],
        "seriesId":      series_id,
        "url":           source_url,
        "title":         scraped.get("title", "Unknown"),
        "cover":         scraped.get("cover", ""),
        "status":        scraped.get("status", "Ongoing"),
        "description":   scraped.get("description", ""),
        "latestChapter": scraped.get("latestChapter", 0),
        "readChapters":  0,
        "rating":        None,
        "notifications": True,
        "notes":         "",
    }


@router.put("/{entry_id}")
async def update_library_entry(entry_id: str, body: SeriesUpdate, user_id: str = Depends(get_current_user)):
    entry_check = supabase.table("user_library") \
        .select("id, series_id") \
        .eq("id", entry_id) \
        .eq("user_id", user_id) \
        .execute()

    if not entry_check.data:
        raise HTTPException(status_code=404, detail="Library entry not found")

    entry = entry_check.data[0]

    lib_updates = {}
    if body.readChapters is not None:
        lib_updates["read_chapters"] = body.readChapters
    if body.rating is not None:
        lib_updates["rating"] = body.rating
    if body.notes is not None:
        lib_updates["notes"] = body.notes
    if body.notifications is not None:
        lib_updates["notifications"] = body.notifications

    if lib_updates:
        from datetime import datetime, timezone
        lib_updates["last_read_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("user_library").update(lib_updates).eq("id", entry_id).execute()

    series_updates = {}
    if body.status is not None:
        series_updates["status"] = body.status
    if body.latestChapter is not None:
        series_updates["latest_chapter"] = body.latestChapter

    if series_updates:
        supabase.table("series") \
            .update(series_updates) \
            .eq("id", entry["series_id"]) \
            .execute()

    return {"message": "Updated"}


@router.delete("/{entry_id}")
async def remove_from_library(entry_id: str, user_id: str = Depends(get_current_user)):
    entry_check = supabase.table("user_library") \
        .select("id, series_id") \
        .eq("id", entry_id) \
        .eq("user_id", user_id) \
        .execute()

    if not entry_check.data:
        raise HTTPException(status_code=404, detail="Library entry not found")

    series_id = entry_check.data[0]["series_id"]

    supabase.table("user_library").delete().eq("id", entry_id).execute()

    # Delete series row only if no other user still has it
    other_users = supabase.table("user_library") \
        .select("id") \
        .eq("series_id", series_id) \
        .execute()

    if not other_users.data:
        supabase.table("series").delete().eq("id", series_id).execute()

    return {"message": "Removed"}



@router.post("/refresh")
async def refresh_library(user_id: str = Depends(get_current_user)):
    """
    Re-scrapes all series in the user's library and updates chapter/cover data.
    Frontend enforces a 15-minute cooldown — this endpoint itself has no rate limit
    so the admin poll can still call it freely.
    """
    from services.scraper import scrape_series

    # Get all series in user's library
    lib_result = supabase.table("user_library") \
        .select("id, series_id, read_chapters, rating, notifications, notes, added_on, last_read_at") \
        .eq("user_id", user_id) \
        .execute()

    if not lib_result.data:
        return []

    series_ids = [e["series_id"] for e in lib_result.data]

    series_result = supabase.table("series") \
        .select("id, source_url, title, cover_url, status, description, latest_chapter") \
        .in_("id", series_ids) \
        .execute()

    if not series_result.data:
        return []

    refreshed = []
    for s in series_result.data:
        if not s.get("source_url"):
            continue
        try:
            scraped = scrape_series(s["source_url"])
            new_chapter = scraped.get("latestChapter", 0)
            new_cover   = scraped.get("cover") or s.get("cover_url", "")
            new_status  = scraped.get("status") or s.get("status", "Ongoing")

            supabase.table("series").update({
                "latest_chapter": new_chapter,
                "cover_url":      new_cover,
                "status":         new_status,
            }).eq("id", s["id"]).execute()

            refreshed.append({
                "seriesId":      s["id"],
                "latestChapter": new_chapter,
                "cover":         new_cover,
                "status":        new_status,
            })
        except Exception as e:
            # Don't fail the whole refresh if one series errors
            continue

    # Return updated library in same shape as GET /library
    full_result = supabase.table("user_library") \
        .select("id, rating, notifications, notes, read_chapters, added_on, last_read_at, series(id, source_url, title, cover_url, status, description, latest_chapter)") \
        .eq("user_id", user_id) \
        .execute()

    library = []
    for entry in (full_result.data or []):
        sv = entry.get("series") or {}
        library.append({
            "id":            entry["id"],
            "seriesId":      sv.get("id"),
            "url":           sv.get("source_url"),
            "title":         sv.get("title"),
            "cover":         sv.get("cover_url"),
            "status":        sv.get("status"),
            "description":   sv.get("description"),
            "latestChapter": sv.get("latest_chapter", 0),
            "readChapters":  entry.get("read_chapters", 0),
            "rating":        entry.get("rating"),
            "notifications": entry.get("notifications", True),
            "notes":         entry.get("notes", ""),
            "addedOn":       entry.get("added_on"),
            "lastReadAt":    entry.get("last_read_at"),
        })
    return library