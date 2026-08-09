"""
Pydantic v2 schemas for authentication endpoints.

Schemas:
  UserRegister  — Request body for POST /auth/register.
  UserLogin     — Request body for POST /auth/login.
  UserResponse  — Response model for /auth/register and /auth/me.
  TokenResponse — Response model for POST /auth/login.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    """
    Registration request payload.

    Constraints:
      - email     : Must be a valid RFC-5322 email address.
      - password  : Minimum 8 characters (enforce client-friendly early rejection).
      - full_name : Non-empty display name.
      - role      : One of the three supported platform roles.
    """

    email: EmailStr
    password: str
    full_name: str
    role: Literal["general_user", "builder", "municipal_corp"]

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name must not be blank.")
        return v.strip()


class UserLogin(BaseModel):
    """Login request payload."""

    email: str
    password: str


class UserResponse(BaseModel):
    """
    Serialised user profile returned by /register and /me.

    full_name is Optional because the User ORM model allows NULL
    (reserved for future SSO users whose display name may come from the IdP).
    """

    id: UUID
    email: str
    full_name: Optional[str]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT response returned by /login."""

    access_token: str
    token_type: str = "bearer"
    role: str
