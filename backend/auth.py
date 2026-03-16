from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from database import supabase

security = HTTPBearer()

async def get_current_user(token = Depends(security)) -> str:
    try:
        # let Supabase verify the token — no manual JWT decoding needed
        response = supabase.auth.get_user(token.credentials)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")