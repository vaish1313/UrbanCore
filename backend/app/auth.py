import base64
import json
import httpx
from fastapi import HTTPException
from .config import settings
from .schemas import LoginRequest, RegisterRequest


def _require_supabase() -> None:
    if not settings.supabase_url or not settings.supabase_publishable_key:
        print("Warning: Supabase is not configured")
        # Temporarily disabled for testing
        # raise HTTPException(503, "Supabase is not configured on the backend")


def _user(payload: dict) -> dict:
    raw = payload.get("user") or {}
    meta = raw.get("user_metadata") or {}
    return {"id": raw.get("id"), "email": raw.get("email"), "full_name": meta.get("full_name"),
            "phone": meta.get("phone"), "address": meta.get("address"), "role": meta.get("role", "CITIZEN")}


async def register(request: RegisterRequest) -> dict:
    _require_supabase()
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/signup",
                headers={"apikey": settings.supabase_publishable_key, "Content-Type": "application/json"},
                json={"email": str(request.email), "password": request.password,
                      "data": {"full_name": request.full_name, "phone": request.phone, "address": request.address, "role": request.role}},
            )
        if response.is_error:
            error_detail = response.json().get("msg", "Unable to register")
            raise HTTPException(response.status_code, error_detail)
        data = response.json()
        # Supabase may require email confirmation and therefore deliberately return no session.
        if not data.get("access_token"):
            raise HTTPException(202, "Account created. Confirm your email, then sign in.")
        return {"access_token": data["access_token"], "token_type": "bearer", "user": _user(data)}
    except httpx.ConnectError as e:
        raise HTTPException(503, f"Cannot connect to Supabase. Please check your internet connection and Supabase URL. Error: {str(e)}")
    except httpx.TimeoutException:
        raise HTTPException(504, "Supabase request timed out. Please try again.")


async def login(request: LoginRequest) -> dict:
    _require_supabase()
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password",
            headers={"apikey": settings.supabase_publishable_key, "Content-Type": "application/json"},
            json={"email": str(request.email), "password": request.password},
        )
    if response.is_error:
        raise HTTPException(401, "Invalid email or password")
    data = response.json()
    return {"access_token": data["access_token"], "token_type": "bearer", "user": _user(data)}
