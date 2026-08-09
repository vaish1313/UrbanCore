"""
Authentication Router — Real Implementation.

Endpoints:
  POST /api/v1/auth/register  — Create a new user account and assign a platform role.
  POST /api/v1/auth/login     — Verify credentials and issue a signed JWT.
  GET  /api/v1/auth/me        — Return the authenticated user's profile.

Design notes:
  - Email uniqueness is enforced via the DB-level functional index on lower(email).
    The router also does an explicit case-insensitive pre-check to return a clean 409
    before hitting the unique-constraint exception path.
  - Passwords are hashed with bcrypt via passlib; raw passwords never touch the DB.
  - JWTs are signed with HS256 and carry { sub, email, role, exp }.
  - Role names in the DB are stored UPPER-CASE (e.g. "GENERAL_USER"). The API accepts
    the snake_case variants defined in UserRegister and converts them with .upper() when
    querying. This keeps the API consumer-friendly without DB schema changes.
  - All DB interactions use async SQLAlchemy (AsyncSession + await).
  - No print() calls — structured logger only.
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.config import settings
from backend.app.core.logger import get_logger
from backend.app.db.models.role import Role
from backend.app.db.models.user import User
from backend.app.db.models.user_role import UserRole
from backend.app.db.session import get_db
from backend.app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse

logger = get_logger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Password hashing context
# ---------------------------------------------------------------------------
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored bcrypt *hashed* value."""
    return _pwd_context.verify(plain, hashed)


def _hash_password(plain: str) -> str:
    """Return the bcrypt hash of *plain*."""
    return _pwd_context.hash(plain)


# ---------------------------------------------------------------------------
# JWT creation
# ---------------------------------------------------------------------------
def _create_access_token(*, sub: str, email: str, role: str) -> str:
    """
    Build and sign a JWT access token.

    Payload:
      sub   — user UUID (string)
      email — user e-mail
      role  — assigned role name (UPPER_CASE DB value)
      exp   — expiry (UTC now + ACCESS_TOKEN_EXPIRE_MINUTES)
      iat   — issued-at (UTC now)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": sub,
        "email": email,
        "role": role,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Creates a new user account, hashes the password with bcrypt, "
        "assigns the requested platform role, and returns the created profile."
    ),
)
async def register(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    POST /api/v1/auth/register

    - Returns **409** if the email is already taken (case-insensitive).
    - Returns **400** if the requested role does not exist in the DB.
    - Returns **201** with the new user profile on success.
    """
    # ------------------------------------------------------------------ #
    # 1. Case-insensitive email uniqueness check                          #
    # ------------------------------------------------------------------ #
    existing = await db.execute(
        select(User).where(func.lower(User.email) == user_in.email.lower())
    )
    if existing.scalar_one_or_none() is not None:
        logger.warning(
            "Registration rejected — email already exists",
            extra={"extra_data": {"email": user_in.email}},
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists.",
        )

    # ------------------------------------------------------------------ #
    # 2. Resolve the requested role from the DB                          #
    # ------------------------------------------------------------------ #
    # API accepts "general_user" | "builder" | "municipal_corp".
    # DB stores them as "GENERAL_USER" | "BUILDER" | "MUNICIPAL_CORP".
    role_name_db = user_in.role.upper()
    role_result = await db.execute(select(Role).where(Role.name == role_name_db))
    role_obj: Role | None = role_result.scalar_one_or_none()

    if role_obj is None:
        logger.error(
            "Registration rejected — role not found in DB",
            extra={"extra_data": {"role": role_name_db}},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{user_in.role}' is not configured on this platform.",
        )

    # ------------------------------------------------------------------ #
    # 3. Hash password and persist User                                   #
    # ------------------------------------------------------------------ #
    hashed_pwd = _hash_password(user_in.password)
    new_user = User(
        email=user_in.email.lower(),   # normalise to lowercase before storing
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
    )
    db.add(new_user)
    # flush → assigns new_user.id without committing so we can use it below
    await db.flush()

    # ------------------------------------------------------------------ #
    # 4. Create UserRole junction record                                  #
    # ------------------------------------------------------------------ #
    user_role = UserRole(
        user_id=new_user.id,
        role_id=role_obj.id,
        # assigned_by is NULL for self-registration (no admin context)
    )
    db.add(user_role)

    # Single commit covers both inserts atomically
    await db.commit()
    await db.refresh(new_user)

    logger.info(
        "User registered successfully",
        extra={"extra_data": {"user_id": str(new_user.id), "role": role_name_db}},
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=role_name_db,
        created_at=new_user.created_at,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and obtain a JWT",
    description="Verifies email + password and issues a signed JWT access token.",
)
async def login(
    user_in: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    POST /api/v1/auth/login

    - Returns **401** if the email is not found or password is wrong.
      (Identical error message to prevent user-enumeration attacks.)
    - Returns **401** if the account is inactive / suspended.
    - Returns **200** with { access_token, token_type, role } on success.
    """
    _invalid_creds = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # ------------------------------------------------------------------ #
    # 1. Look up user by email (case-insensitive)                         #
    # ------------------------------------------------------------------ #
    result = await db.execute(
        select(User).where(func.lower(User.email) == user_in.email.lower())
    )
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.hashed_password:
        logger.warning(
            "Login failed — user not found or has no password",
            extra={"extra_data": {"email": user_in.email}},
        )
        raise _invalid_creds

    # ------------------------------------------------------------------ #
    # 2. Verify password                                                  #
    # ------------------------------------------------------------------ #
    if not _verify_password(user_in.password, user.hashed_password):
        logger.warning(
            "Login failed — wrong password",
            extra={"extra_data": {"email": user_in.email}},
        )
        raise _invalid_creds

    # ------------------------------------------------------------------ #
    # 3. Guard against suspended accounts                                 #
    # ------------------------------------------------------------------ #
    if not user.is_active:
        logger.warning(
            "Login failed — account inactive",
            extra={"extra_data": {"user_id": str(user.id)}},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been suspended. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ------------------------------------------------------------------ #
    # 4. Fetch the user's primary role for the JWT payload                #
    # ------------------------------------------------------------------ #
    role_result = await db.execute(
        select(Role.name)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .limit(1)   # Primary role — first assignment wins for token simplicity
    )
    role_name: str = role_result.scalar_one_or_none() or "UNKNOWN"

    # ------------------------------------------------------------------ #
    # 5. Issue signed JWT                                                  #
    # ------------------------------------------------------------------ #
    access_token = _create_access_token(
        sub=str(user.id),
        email=user.email,
        role=role_name,
    )

    logger.info(
        "User authenticated successfully",
        extra={"extra_data": {"user_id": str(user.id), "role": role_name}},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=role_name,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
    description="Decodes the Bearer JWT and returns the caller's profile.",
)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    GET /api/v1/auth/me

    - Returns **401** if the token is missing, expired, or invalid.
    - Returns **200** with the authenticated user's profile on success.
    """
    # Fetch the user's primary role name for the response
    role_result = await db.execute(
        select(Role.name)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == current_user.id)
        .limit(1)
    )
    role_name: str = role_result.scalar_one_or_none() or "UNKNOWN"

    logger.info(
        "Returning current user profile",
        extra={"extra_data": {"user_id": str(current_user.id)}},
    )

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role_name,
        created_at=current_user.created_at,
    )
