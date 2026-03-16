from seleniumbase import SB
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re

def scrape_series(url: str) -> dict:
    result = {
        "title": "Unknown Title",
        "cover": "",
        "status": "Ongoing",
        "description": "",
        "latestChapter": 0,
    }

    with SB(headless=True, xvfb=False) as sb:
        sb.open(url)

        # wait for title element to appear
        try:
            WebDriverWait(sb.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "span.text-xl.font-bold"))
            )
        except:
            sb.sleep(5)

        # ── TITLE ──────────────────────────────────────────
        try:
            el = sb.driver.find_element(By.CSS_SELECTOR, "span.text-xl.font-bold")
            result["title"] = el.text.strip()
        except:
            pass

        # ── COVER — first img[alt=poster] that isn't a thumb ──
        try:
            imgs = sb.driver.find_elements(By.CSS_SELECTOR, "img[alt='poster']")
            for img in imgs:
                src = img.get_attribute("src") or ""
                if src and "thumb-small" not in src:
                    result["cover"] = src
                    break
            if not result["cover"] and imgs:
                result["cover"] = imgs[0].get_attribute("src") or ""
        except:
            pass

        # ── STATUS ─────────────────────────────────────────
        try:
            els = sb.driver.find_elements(By.CSS_SELECTOR, "h3.text-sm.capitalize")
            for el in els:
                text = el.text.strip().lower()
                if text in ["ongoing", "completed", "hiatus", "dropped", "cancelled"]:
                    result["status"] = el.text.strip().capitalize()
                    break
        except:
            pass

        # ── DESCRIPTION — full text, no truncation ─────────
        try:
            els = sb.driver.find_elements(By.CSS_SELECTOR, "p")
            for el in els:
                text = el.text.strip()
                if len(text) > 80:
                    result["description"] = text  # full synopsis, no truncation
                    break
        except:
            pass

        # ── LATEST CHAPTER ─────────────────────────────────
        try:
            els = sb.driver.find_elements(By.XPATH, "//h3[contains(text(),'Chapter')]")
            chapter_nums = []
            for el in els:
                m = re.search(r'Chapter\s+([\d]+(?:\.\d+)?)', el.text, re.IGNORECASE)
                if m:
                    try:
                        chapter_nums.append(float(m.group(1)))
                    except:
                        pass
            if chapter_nums:
                result["latestChapter"] = int(max(chapter_nums))
        except:
            pass

    return result