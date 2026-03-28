from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase
from services.push import send_push_to_user

router = APIRouter()


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # { p256dh: str, auth: str }
    expirationTime: Optional[float] = None


class UnsubscribeRequest(BaseModel):
    endpoint: str


@router.post("/subscribe")
async def subscribe(body: PushSubscription, user_id: str = Depends(get_current_user)):
    p256dh  = body.keys.get("p256dh", "")
    auth    = body.keys.get("auth", "")

    if not body.endpoint or not p256dh or not auth:
        raise HTTPException(status_code=400, detail="Invalid subscription data")

    supabase.table("push_subscriptions").upsert({
        "user_id":  user_id,
        "endpoint": body.endpoint,
        "p256dh":   p256dh,
        "auth_key": auth,          # renamed from 'auth' to avoid Supabase conflict
    }, on_conflict="user_id,endpoint").execute()

    return {"message": "Subscribed"}


@router.delete("/unsubscribe")
async def unsubscribe(body: UnsubscribeRequest, user_id: str = Depends(get_current_user)):
    supabase.table("push_subscriptions") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("endpoint", body.endpoint) \
        .execute()
    return {"message": "Unsubscribed"}


@router.delete("/unsubscribe-all")
async def unsubscribe_all(user_id: str = Depends(get_current_user)):
    supabase.table("push_subscriptions") \
        .delete() \
        .eq("user_id", user_id) \
        .execute()
    return {"message": "All subscriptions removed"}


@router.post("/test")
async def test_notification(user_id: str = Depends(get_current_user)):
    sent = send_push_to_user(
        user_id=user_id,
        title="AsuraSync Test",
        body="Push notifications are working!",
        url="/library",
    )
    if sent == 0:
        raise HTTPException(status_code=404, detail="No push subscriptions found")
    return {"message": f"Sent to {sent} subscription(s)"}


@router.get("/status")
async def get_status(user_id: str = Depends(get_current_user)):
    result = supabase.table("push_subscriptions") \
        .select("id, endpoint, created_at") \
        .eq("user_id", user_id) \
        .execute()
    return {
        "subscribed": bool(result.data),
        "count": len(result.data or []),
    }