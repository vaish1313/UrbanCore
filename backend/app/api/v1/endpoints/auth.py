"""
Authentication endpoints.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserPublic,
    Token,
    LoginRequest,
    RefreshTokenRequest
)


router = APIRouter()

# Authority code required for MUNICIPAL_CORP self-registration
MUNICIPAL_AUTHORITY_CODE = "MC2025"


def _build_token_response(user: User) -> dict:
    """
    Build the standard auth response shape expected by the frontend:
      {
        "access_token": str,
        "token_type": "bearer",
        "user": { "id": str, "email": str, "full_name": str, "role": str }
      }
    """
    access_token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role)
    })
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role)
        }
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    - CITIZEN and BUILDER may register freely.
    - MUNICIPAL_CORP registration requires a valid authority_code ("MC2025").

    Returns:
        access_token, token_type, and a nested user object.
    """
    # --- Authority code validation for MUNICIPAL_CORP ---
    if user_data.role == UserRole.MUNICIPAL_CORP or user_data.role == "MUNICIPAL_CORP":
        if not user_data.authority_code or user_data.authority_code != MUNICIPAL_AUTHORITY_CODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authority code for Municipal Corporation registration"
            )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Resolve role — accept both UserRole enum and plain string
    try:
        resolved_role = UserRole(user_data.role) if isinstance(user_data.role, str) else user_data.role
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_data.role}'. Must be one of: CITIZEN, BUILDER, MUNICIPAL_CORP"
        )

    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        organization=user_data.organization,
        phone=user_data.phone,
        address=user_data.address,
        role=resolved_role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login and get access token.

    Returns:
        access_token, token_type, and a nested user object.
    """
    # Find user
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return _build_token_response(user)


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.

    Returns:
        New access_token, token_type, and a nested user object.
    """
    # Decode refresh token
    payload = decode_token(refresh_data.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information.

    Returns:
        User information
    """
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.

    Note: In JWT authentication, logout is typically handled on the client side
    by discarding the tokens. This endpoint is provided for consistency.

    Returns:
        Success message
    """
    return {"message": "Successfully logged out"}
