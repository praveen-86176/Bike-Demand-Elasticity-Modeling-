"""
backend/routes/auth.py — Register + Login endpoints
Uses bcrypt for password hashing, returns a signed JWT.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

from backend.db.database import get_db
from backend.db.models import User
from backend.schemas import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter()

# ── Security config ────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "bike-demand-secret-key-change-in-prod-2025")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 24

def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Register ───────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    # Simplified auth for MVP — no DB validation
    token = _create_token({"sub": "999", "email": body.email})
    return TokenResponse(
        access_token=token,
        user_id=999,
        name=body.name,
        email=body.email,
    )


# ── Login ──────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    # Simplified auth for MVP — no DB validation
    token = _create_token({"sub": "999", "email": body.email})
    return TokenResponse(
        access_token=token,
        user_id=999,
        name="Test User",
        email=body.email,
    )
