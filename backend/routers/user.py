from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase
from models.user import ProfileUpdate, ProfileResponse

router = APIRouter()

class EmailChangeRequest(BaseModel):
    new_email: str

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user)):
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data

@router.put("/profile", response_model=ProfileResponse)
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user)):
    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.bio is not None:
        updates["bio"] = body.bio
    if "banner_preset" in body.model_fields_set:
        updates["banner_preset"] = body.banner_preset

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    path = f"{user_id}/avatar.{ext}"
    contents = await file.read()

    supabase.storage.from_("avatars").upload(
        path, contents,
        file_options={"content-type": file.content_type, "upsert": "true"}
    )

    url = supabase.storage.from_("avatars").get_public_url(path)
    supabase.table("profiles").update({"avatar_url": url}).eq("id", user_id).execute()
    return {"avatar_url": url}

@router.delete("/avatar")
async def delete_avatar(user_id: str = Depends(get_current_user)):
    for ext in ["webp", "png", "jpg", "jpeg"]:
        try:
            supabase.storage.from_("avatars").remove([f"{user_id}/avatar.{ext}"])
        except:
            pass
    supabase.table("profiles").update({"avatar_url": None}).eq("id", user_id).execute()
    return {"avatar_url": None}

@router.post("/banner")
async def upload_banner(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    path = f"{user_id}/banner.{ext}"
    contents = await file.read()

    supabase.storage.from_("banners").upload(
        path, contents,
        file_options={"content-type": file.content_type, "upsert": "true"}
    )

    url = supabase.storage.from_("banners").get_public_url(path)
    supabase.table("profiles").update({
        "banner_url": url,
        "banner_preset": None,
    }).eq("id", user_id).execute()

    return {"banner_url": url}

@router.delete("/banner")
async def delete_banner(user_id: str = Depends(get_current_user)):
    for ext in ["webp", "png", "jpg", "jpeg"]:
        try:
            supabase.storage.from_("banners").remove([f"{user_id}/banner.{ext}"])
        except:
            pass
    supabase.table("profiles").update({
        "banner_url": None,
        "banner_preset": None,
    }).eq("id", user_id).execute()
    return {"banner_url": None}

@router.delete("")
async def delete_account(user_id: str = Depends(get_current_user)):
    try:
        supabase.table("user_library").delete().eq("user_id", user_id).execute()
        supabase.table("profiles").delete().eq("id", user_id).execute()
        supabase.auth.admin.delete_user(user_id)
        return {"message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")