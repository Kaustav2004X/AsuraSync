from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import supabase
from services.scraper import scrape_series
from config import settings
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def poll_chapters():
    logger.info("Starting chapter poll...")
    try:
        # get all unique series that have at least one library entry
        result = supabase.table("series") \
            .select("id, source_url, title, latest_chapter") \
            .execute()

        if not result.data:
            logger.info("No series to poll.")
            return

        updated = 0
        for series in result.data:
            if not series.get("source_url"):
                continue
            try:
                scraped = scrape_series(series["source_url"])
                new_chapter = scraped.get("latestChapter", 0)

                if new_chapter > (series["latest_chapter"] or 0):
                    supabase.table("series") \
                        .update({
                            "latest_chapter": new_chapter,
                            "status": scraped.get("status", series.get("status", "Ongoing")),
                        }) \
                        .eq("id", series["id"]) \
                        .execute()
                    logger.info(f"Updated '{series['title']}': {series['latest_chapter']} → {new_chapter}")
                    updated += 1

            except Exception as e:
                logger.warning(f"Failed to scrape '{series['title']}': {e}")
                continue

        logger.info(f"Poll complete. {updated}/{len(result.data)} series updated.")

    except Exception as e:
        logger.error(f"Poll job failed: {e}")


def start_scheduler():
    interval_hours = getattr(settings, "scrape_interval_hours", 2)
    scheduler.add_job(
        poll_chapters,
        trigger=IntervalTrigger(hours=interval_hours),
        id="chapter_poll",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"Scheduler started — polling every {interval_hours} hours.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()