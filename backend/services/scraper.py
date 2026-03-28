import cloudscraper
from bs4 import BeautifulSoup
import json
import re

_scraper = cloudscraper.create_scraper(
    browser={"browser": "chrome", "platform": "windows", "mobile": False}
)

# ---------------------------------------------------------------------------
# Astro encodes props as [type_hint, value]:
#   0 = primitive  → raw value
#   1 = array      → list of [type, item] pairs
# ---------------------------------------------------------------------------
def _astro_val(encoded):
    if not isinstance(encoded, list) or len(encoded) < 2:
        return encoded
    hint, val = encoded[0], encoded[1]
    if hint == 1:
        return [_astro_val(item) for item in val]
    return val


def scrape_series(url: str) -> dict:
    result = {
        "title": "Unknown Title",
        "cover": "",
        "status": "Ongoing",
        "description": "",
        "latestChapter": 0,
    }

    try:
        resp = _scraper.get(url, timeout=30)
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        raise RuntimeError(f"Failed to fetch {url}: {e}")

    soup = BeautifulSoup(html, "html.parser")

    # ── TITLE ──────────────────────────────────────────────────────────────
    h1 = soup.find("h1", class_=lambda c: c and "font-semibold" in c) \
         or soup.find("h1")
    if h1:
        result["title"] = h1.get_text(strip=True)

    # ── COVER — JSON-LD Article block ──────────────────────────────────────
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            t = data.get("@type", "")
            if t == "Article":
                img = data.get("image", {})
                url_val = img.get("url", "") if isinstance(img, dict) else img
                if isinstance(url_val, str) and url_val.startswith("http"):
                    result["cover"] = url_val
                    break
            if t == "ComicSeries":
                img = data.get("image", "")
                if isinstance(img, str) and img.startswith("http"):
                    result["cover"] = img
                    break
        except Exception:
            continue

    # ── STATUS ─────────────────────────────────────────────────────────────
    VALID = {"ongoing", "completed", "hiatus", "dropped", "cancelled"}
    for sel in [
        "span.text-base.font-bold.capitalize",
        "span.capitalize.font-bold",
        "span.capitalize",
    ]:
        for el in soup.select(sel):
            text = el.get_text(strip=True).lower()
            if text in VALID:
                result["status"] = text.capitalize()
                break
        if result["status"] != "Ongoing":
            break

    # ── DESCRIPTION — meta tag ─────────────────────────────────────────────
    meta = soup.find("meta", {"name": "description"})
    if meta and meta.get("content"):
        result["description"] = meta["content"].strip()
    else:
        desc_div = soup.find("div", id="description-text")
        if desc_div:
            p = desc_div.find("p")
            if p:
                result["description"] = p.get_text(strip=True)

    # ── LATEST FREE CHAPTER — astro-island props ───────────────────────────
    parsed_ok = False
    for island in soup.find_all("astro-island"):
        if "ChapterList" not in island.get("component-url", ""):
            continue
        try:
            props = json.loads(island.get("props", "{}"))
            chapters_enc = props.get("chapters", [])
            if not (isinstance(chapters_enc, list) and
                    len(chapters_enc) >= 2 and
                    chapters_enc[0] == 1):
                continue

            free_nums = []
            for item in chapters_enc[1]:
                if not (isinstance(item, list) and len(item) >= 2 and item[0] == 0):
                    continue
                ch = item[1]
                if not isinstance(ch, dict):
                    continue
                number    = _astro_val(ch.get("number",    [0, 0]))
                is_locked = _astro_val(ch.get("is_locked", [0, False]))
                if not is_locked and isinstance(number, (int, float)) and number > 0:
                    free_nums.append(number)

            if free_nums:
                result["latestChapter"] = int(max(free_nums))
                parsed_ok = True
            break
        except Exception:
            continue

    # ── FALLBACK: regex on raw HTML ────────────────────────────────────────
    if not parsed_ok:
        try:
            m = re.search(
                r'component-url="[^"]*ChapterList[^"]*"[^>]*props="([^"]+)"', html
            )
            if not m:
                m = re.search(
                    r'props="([^"]+)"[^>]*component-url="[^"]*ChapterList[^"]*"', html
                )
            if m:
                props_raw = m.group(1).replace("&quot;", '"')
                props = json.loads(props_raw)
                chapters_enc = props.get("chapters", [])
                if (isinstance(chapters_enc, list) and
                        len(chapters_enc) >= 2 and
                        chapters_enc[0] == 1):
                    free_nums = []
                    for item in chapters_enc[1]:
                        if not (isinstance(item, list) and len(item) >= 2):
                            continue
                        ch = item[1]
                        if not isinstance(ch, dict):
                            continue
                        number    = _astro_val(ch.get("number",    [0, 0]))
                        is_locked = _astro_val(ch.get("is_locked", [0, False]))
                        if not is_locked and isinstance(number, (int, float)) and number > 0:
                            free_nums.append(number)
                    if free_nums:
                        result["latestChapter"] = int(max(free_nums))
        except Exception:
            pass

    return result