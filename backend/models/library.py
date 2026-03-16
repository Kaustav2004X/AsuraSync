from pydantic import BaseModel
from typing import Optional

class SeriesAdd(BaseModel):
    url: str
    title: str
    cover: str
    status: str
    description: Optional[str] = ""
    latestChapter: int
    readChapters: Optional[int] = 0
    rating: Optional[int] = 0
    notes: Optional[str] = ""

class SeriesUpdate(BaseModel):
    readChapters: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    latestChapter: Optional[int] = None
    url: Optional[str] = None

class SeriesResponse(BaseModel):
    id: str
    user_id: str
    url: Optional[str] = ""
    title: Optional[str] = ""
    cover: Optional[str] = ""
    status: Optional[str] = "Ongoing"
    description: Optional[str] = ""
    latest_chapter: Optional[int] = 0
    read_chapters: Optional[int] = 0
    rating: Optional[int] = 0
    notes: Optional[str] = ""
    created_at: Optional[str] = None