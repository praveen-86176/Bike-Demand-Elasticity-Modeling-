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
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = _hash(body.password)
    stmt = (
        insert(User)
        .values(name=body.name, email=body.email, password=hashed)
        .returning(User.id, User.name, User.email)
    )
    row = (await db.execute(stmt)).one()
    await db.commit()

    token = _create_token({"sub": str(row.id), "email": row.email})
    return TokenResponse(
        access_token=token,
        user_id=row.id,
        name=row.name,
        email=row.email,
    )


# ── Login ──────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not _verify(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
    )
