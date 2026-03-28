import json
import logging
import os
import tempfile
from pywebpush import webpush, WebPushException
from database import supabase
from config import settings

logger = logging.getLogger(__name__)

# Write private key to a temp file once at import time
_VAPID_KEY_FILE = None

def _get_key_file() -> str:
    global _VAPID_KEY_FILE
    if _VAPID_KEY_FILE and os.path.exists(_VAPID_KEY_FILE):
        return _VAPID_KEY_FILE

    raw = settings.VAPID_PRIVATE_KEY.strip()

    # Strip surrounding quotes if present
    if raw.startswith('"') and raw.endswith('"'):
        raw = raw[1:-1]

    # Unescape literal \n to real newlines
    raw = raw.replace("\\n", "\n")

    # Ensure proper PEM structure with real newlines
    if "-----BEGIN" in raw and "\n" not in raw.split("-----")[2]:
        # Key body has no newlines — split into 64-char lines
        parts = raw.split("-----")
        if len(parts) >= 4:
            header = f"-----{parts[1]}-----"
            footer = f"-----{parts[3]}-----"
            body   = parts[2].strip()
            lines  = [body[i:i+64] for i in range(0, len(body), 64)]
            raw    = header + "\n" + "\n".join(lines) + "\n" + footer + "\n"

    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".pem", delete=False, prefix="vapid_"
    )
    tmp.write(raw)
    tmp.close()
    _VAPID_KEY_FILE = tmp.name
    logger.info(f"VAPID key written to temp file: {tmp.name}")
    return _VAPID_KEY_FILE


def _send_single(subscription: dict, title: str, body: str, url: str = "/library", icon: str = "") -> bool:
    try:
        payload = json.dumps({
            "title": title,
            "body":  body,
            "url":   url,
            "icon":  icon or "/src/assets/AsuraSync.png",
            "tag":   "asurasync",
        })

        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth":   subscription["auth_key"],
                },
            },
            data=payload,
            vapid_private_key=_get_key_file(),
            vapid_claims={"sub": settings.VAPID_CONTACT},
        )
        return True

    except WebPushException as e:
        status = e.response.status_code if e.response is not None else None
        if status == 410:
            logger.info(f"Removing expired subscription: {subscription['endpoint'][:50]}...")
            supabase.table("push_subscriptions").delete().eq("id", subscription["id"]).execute()
        else:
            logger.warning(f"Push failed (HTTP {status}): {e}")
        return False

    except Exception as e:
        logger.warning(f"Push error: {e}")
        return False


def send_push_to_user(user_id: str, title: str, body: str, url: str = "/library", icon: str = "") -> int:
    result = supabase.table("push_subscriptions") \
        .select("id, endpoint, p256dh, auth_key") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        return 0

    return sum(_send_single(sub, title, body, url, icon) for sub in result.data)


def send_push_to_users(user_ids: list, title: str, body: str, url: str = "/library", icon: str = "") -> int:
    if not user_ids:
        return 0

    result = supabase.table("push_subscriptions") \
        .select("id, user_id, endpoint, p256dh, auth_key") \
        .in_("user_id", user_ids) \
        .execute()

    if not result.data:
        return 0

    return sum(_send_single(sub, title, body, url, icon) for sub in result.data)