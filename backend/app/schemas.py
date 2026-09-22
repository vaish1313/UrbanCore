from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=300)
    role: Literal["CITIZEN", "BUILDER", "MUNICIPAL_CORP"] = "CITIZEN"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AnalysisRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_m: int = Field(default=2000, ge=100, le=2000)
    end_year: int = Field(default_factory=lambda: datetime.now().year, ge=2016, le=2100)


class GeocodeResult(BaseModel):
    label: str
    latitude: float
    longitude: float
