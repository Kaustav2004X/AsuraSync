from pydantic import BaseModel
from typing import Optional

class SeriesAdd(BaseModel):
    url: str

class SeriesUpdate(BaseModel):
    readChapters: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    notifications: Optional[bool] = None
    status: Optional[str] = None
    latestChapter: Optional[int] = None

class SeriesResponse(BaseModel):
    id: str
    seriesId: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    cover: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    latestChapter: Optional[int] = None
    readChapters: Optional[int] = None
    rating: Optional[int] = None
    notifications: Optional[bool] = None
    notes: Optional[str] = None
    addedOn: Optional[str] = None
    lastReadAt: Optional[str] = None