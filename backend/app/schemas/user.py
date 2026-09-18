"""
User schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str = "CITIZEN"


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    authority_code: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for user update."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class UserChangePassword(BaseModel):
    """Schema for password change."""
    old_password: str
    new_password: str = Field(..., min_length=8)


class UserInDB(UserBase):
    """User schema with database fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class UserResponse(UserInDB):
    """User response schema (public)."""
    pass


class UserPublic(BaseModel):
    """Minimal user info embedded in auth token response."""
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str


class Token(BaseModel):
    """Authentication token response (matches frontend expectation)."""
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str       # User ID
    email: str
    role: str
    exp: datetime
    type: str      # 'access' or 'refresh'


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str
