from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    banner_preset: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    banner_preset: Optional[str] = None
    created_at: Optional[str] = None