from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import supabase
from services.scraper import scrape_series
from services.push import send_push_to_users
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def _get_notif_users(series_id: str) -> list:
    """Return user_ids who have this series with notifications enabled."""
    result = supabase.table("user_library") \
        .select("user_id") \
        .eq("series_id", series_id) \
        .eq("notifications", True) \
        .execute()
    return [row["user_id"] for row in (result.data or [])]


def poll_chapters():
    logger.info("Starting chapter poll...")
    try:
        result = supabase.table("series") \
            .select("id, source_url, title, latest_chapter, cover_url, status") \
            .execute()

        if not result.data:
            logger.info("No series to poll.")
            return

        new_chapters = 0
        invalid_urls = 0

        for series in result.data:
            if not series.get("source_url"):
                continue

            series_id   = series["id"]
            title       = series["title"] or "Unknown Series"
            old_chapter = series.get("latest_chapter") or 0
            old_status  = series.get("status", "Ongoing")
            source_url  = series["source_url"]

            try:
                scraped = scrape_series(source_url)
            except RuntimeError as e:
                err_str = str(e).lower()
                if any(x in err_str for x in ["404", "not found", "failed to fetch",
                                               "connection", "timeout", "invalid"]):
                    logger.warning(f"Invalid URL for '{title}': {e}")
                    user_ids = _get_notif_users(series_id)
                    if user_ids:
                        send_push_to_users(
                            user_ids=user_ids,
                            title="Warning: Series Link Broken",
                            body=f"'{title}' can no longer be reached. The source may have moved.",
                            url="/library",
                        )
                    invalid_urls += 1
                else:
                    logger.warning(f"Scrape error for '{title}': {e}")
                continue

            new_chapter = scraped.get("latestChapter", 0)
            new_status  = scraped.get("status") or old_status
            new_cover   = scraped.get("cover")  or series.get("cover_url", "")

            # Always write scraped values
            supabase.table("series").update({
                "latest_chapter": new_chapter,
                "status":         new_status,
                "cover_url":      new_cover,
            }).eq("id", series_id).execute()

            # Trigger: new free chapter
            if new_chapter > old_chapter:
                logger.info(f"New chapter for '{title}': {old_chapter} -> {new_chapter}")
                user_ids = _get_notif_users(series_id)
                if user_ids:
                    chapters_ahead = new_chapter - old_chapter
                    body = (
                        f"Chapter {new_chapter} is now available!"
                        if chapters_ahead == 1
                        else f"Chapters {old_chapter + 1}-{new_chapter} are now available!"
                    )
                    send_push_to_users(
                        user_ids=user_ids,
                        title=f"New Chapter: {title}",
                        body=body,
                        url="/library",
                    )
                new_chapters += 1

            # Trigger: series completed
            elif old_status.lower() != "completed" and new_status.lower() == "completed":
                logger.info(f"'{title}' marked Completed")
                user_ids = _get_notif_users(series_id)
                if user_ids:
                    send_push_to_users(
                        user_ids=user_ids,
                        title=f"{title} - Completed!",
                        body="This series has been marked as completed.",
                        url="/library",
                    )
            else:
                logger.info(f"No change for '{title}' (chapter {new_chapter})")

        logger.info(f"Poll complete - {new_chapters} new chapter(s), {invalid_urls} invalid URL(s).")

    except Exception as e:
        logger.error(f"Poll job failed: {e}")


def start_scheduler():
    scheduler.add_job(
        poll_chapters,
        trigger=IntervalTrigger(hours=1),
        id="chapter_poll",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started - polling every 1 hour.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()