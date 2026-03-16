from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import supabase
from models.library import SeriesAdd, SeriesUpdate, SeriesResponse
import uuid

router = APIRouter()

@router.get("")
async def get_library(user_id: str = Depends(get_current_user)):
    result = supabase.table("user_library") \
        .select("*, series(*)") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        return []

    library = []
    for row in result.data:
        s = row.get("series") or {}
        library.append({
            "id": row["id"],
            "series_id": row["series_id"],
            "user_id": row["user_id"],
            "url": s.get("source_url", ""),
            "title": s.get("title", ""),
            "cover": s.get("cover", ""),
            "status": s.get("status", "Ongoing"),
            "description": s.get("description", ""),
            "latestChapter": s.get("latest_chapter", 0),
            "readChapters": row.get("read_chapters", 0),
            "rating": row.get("rating", 0),
            "notes": row.get("notes", ""),
            "notifications": row.get("notifications", True),
            "created_at": row.get("created_at"),
        })
    return library


@router.post("")
async def add_series(body: SeriesAdd, user_id: str = Depends(get_current_user)):
    # check if series with this URL already exists globally
    existing = supabase.table("series") \
        .select("id") \
        .eq("source_url", body.url) \
        .execute()

    if existing.data:
        series_id = existing.data[0]["id"]
    else:
        # insert new series
        new_series = supabase.table("series").insert({
            "source_url": body.url,
            "title": body.title,
            "cover": body.cover,
            "status": body.status,
            "description": body.description,
            "latest_chapter": body.latestChapter,
        }).execute()
        if not new_series.data:
            raise HTTPException(status_code=500, detail="Failed to create series")
        series_id = new_series.data[0]["id"]

    # check if already in user's library
    already = supabase.table("user_library") \
        .select("id") \
        .eq("user_id", user_id) \
        .eq("series_id", series_id) \
        .execute()

    if already.data:
        raise HTTPException(status_code=400, detail="Series already in library")

    # add to user's library
    entry = supabase.table("user_library").insert({
        "user_id": user_id,
        "series_id": series_id,
        "read_chapters": body.readChapters,
        "rating": body.rating,
        "notes": body.notes,
        "notifications": True,
    }).execute()

    if not entry.data:
        raise HTTPException(status_code=500, detail="Failed to add to library")

    return {
        "id": entry.data[0]["id"],
        "series_id": series_id,
        "url": body.url,
        "title": body.title,
        "cover": body.cover,
        "status": body.status,
        "description": body.description,
        "latestChapter": body.latestChapter,
        "readChapters": body.readChapters,
        "rating": body.rating,
        "notes": body.notes,
        "notifications": True,
    }


@router.put("/{entry_id}")
async def update_series(entry_id: str, body: SeriesUpdate, user_id: str = Depends(get_current_user)):
    # verify ownership
    check = supabase.table("user_library") \
        .select("id, series_id") \
        .eq("id", entry_id) \
        .eq("user_id", user_id) \
        .execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="Entry not found")

    # update user_library fields
    library_updates = {}
    if body.readChapters is not None:
        library_updates["read_chapters"] = body.readChapters
    if body.rating is not None:
        library_updates["rating"] = body.rating
    if body.notes is not None:
        library_updates["notes"] = body.notes

    if library_updates:
        supabase.table("user_library") \
            .update(library_updates) \
            .eq("id", entry_id) \
            .execute()

    # update series table fields (shared data)
    series_updates = {}
    if body.status is not None:
        series_updates["status"] = body.status
    if body.latestChapter is not None:
        series_updates["latest_chapter"] = body.latestChapter
    if body.url is not None:
        series_updates["source_url"] = body.url

    if series_updates:
        series_id = check.data[0]["series_id"]
        supabase.table("series") \
            .update(series_updates) \
            .eq("id", series_id) \
            .execute()

    return {"message": "Updated successfully"}


@router.delete("/{entry_id}")
async def remove_series(entry_id: str, user_id: str = Depends(get_current_user)):
    # verify ownership
    check = supabase.table("user_library") \
        .select("id") \
        .eq("id", entry_id) \
        .eq("user_id", user_id) \
        .execute()

    if not check.data:
        raise HTTPException(status_code=404, detail="Entry not found")

    supabase.table("user_library") \
        .delete() \
        .eq("id", entry_id) \
        .execute()

    return {"message": "Removed from library"}