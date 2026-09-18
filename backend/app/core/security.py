"""
Security utilities for authentication and authorization.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User, UserRole


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token authentication
security = HTTPBearer()

# Access token expiry: 7 days = 10080 minutes = 604800 seconds
ACCESS_TOKEN_EXPIRE_MINUTES = 10080


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.

    Payload includes: sub (user_id), email, role, exp, type.
    Default expiry is 7 days (604800 seconds).
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


# ---------------------------------------------------------------------------
# Role-based dependency helpers
# ---------------------------------------------------------------------------

async def require_citizen(
    current_user: User = Depends(get_current_user)
) -> User:
    """Allow any authenticated user (CITIZEN, BUILDER, MUNICIPAL_CORP)."""
    return current_user


async def require_builder(
    current_user: User = Depends(get_current_user)
) -> User:
    """Allow BUILDER and MUNICIPAL_CORP roles only."""
    allowed = [UserRole.BUILDER, UserRole.MUNICIPAL_CORP]
    if current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Builder or Municipal Corporation access required"
        )
    return current_user


async def require_municipal(
    current_user: User = Depends(get_current_user)
) -> User:
    """Allow MUNICIPAL_CORP role only."""
    if current_user.role != UserRole.MUNICIPAL_CORP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Municipal Corporation access required"
        )
    return current_user


# ---------------------------------------------------------------------------
# Legacy aliases (kept so existing endpoint imports don't break)
# ---------------------------------------------------------------------------

async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Backward-compat alias — now maps to MUNICIPAL_CORP."""
    if current_user.role != UserRole.MUNICIPAL_CORP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Municipal Corporation access required"
        )
    return current_user


# Alias so any code still importing the old name works
get_current_active_municipal = get_current_active_admin


async def get_current_active_government_officer(
    current_user: User = Depends(get_current_user)
) -> User:
    """Backward-compat alias — now maps to BUILDER + MUNICIPAL_CORP."""
    if current_user.role not in [UserRole.BUILDER, UserRole.MUNICIPAL_CORP]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Builder or Municipal Corporation access required"
        )
    return current_user


# ---------------------------------------------------------------------------
# Permission helper
# ---------------------------------------------------------------------------

def check_permission(user: User, resource: str, action: str) -> bool:
    """
    Check if user has permission for specific resource and action.

    Role mapping:
      MUNICIPAL_CORP → was "admin" (full access)
      BUILDER        → was "builder"
      CITIZEN        → read-only on public resources
    """
    # MUNICIPAL_CORP has all permissions
    if user.role == UserRole.MUNICIPAL_CORP:
        return True

    # BUILDER permissions
    if user.role == UserRole.BUILDER:
        if resource in ["project", "detection", "violation", "report", "complaint"]:
            return action in ["create", "read", "update"]
        if resource == "user":
            return action == "read"
        return False

    # CITIZEN permissions — read-only on safe resources
    if user.role == UserRole.CITIZEN:
        if resource in ["project", "detection", "report"]:
            return action in ["create", "read"]
        return False

    return False


class RoleChecker:
    """Dependency for role-based access control."""

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {current_user.role} not authorized"
            )
        return current_user
