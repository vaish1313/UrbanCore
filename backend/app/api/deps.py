"""
FastAPI Dependency Providers.

Why this file exists:
  Houses reusable dependencies that can be injected into any route via FastAPI's
  Depends() mechanism. This keeps authentication/authorisation logic DRY and
  decoupled from individual endpoint handlers.

Dependencies:
  get_current_user — Decodes + validates the Bearer JWT, fetches the User from DB,
                     and enforces that the account is active.
                     Raises HTTP 401 on any failure (expired token, bad signature,
                     missing sub claim, user not found, account suspended).

Other routes that need the authenticated user just do:

    from backend.app.api.deps import get_current_user
    ...
    async def my_endpoint(user: User = Depends(get_current_user)):
        ...
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.logger import get_logger
from backend.app.db.models.user import User
from backend.app.db.session import get_db

logger = get_logger(__name__)

# Points to the login URL so Swagger UI can auto-fill the Authorize dialog.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Shared 401 exception used for all token validation failures.
# We purposely keep the error message generic to avoid leaking information.
_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that validates the Bearer JWT and returns the User.

    Flow:
      1. Decode the JWT using the application secret and algorithm.
      2. Extract the `sub` claim (user UUID string).
      3. Parse `sub` into a proper UUID — reject malformed values immediately.
      4. Query the DB for the user by primary key.
      5. Verify the account is active (not suspended).

    Args:
        token: Raw JWT string extracted from the Authorization header.
        db:    Async DB session injected by FastAPI.

    Returns:
        The authenticated, active User ORM object.

    Raises:
        HTTPException 401: On any validation failure.
    """
    # -- Step 1 & 2: Decode token and extract subject claim ----------------
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            logger.warning("JWT rejected — missing 'sub' claim")
            raise _CREDENTIALS_EXCEPTION
    except JWTError as exc:
        logger.warning("JWT decode failed", extra={"extra_data": {"error": str(exc)}})
        raise _CREDENTIALS_EXCEPTION from exc

    # -- Step 3: Parse the UUID safely -------------------------------------
    try:
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, AttributeError):
        logger.warning(
            "JWT rejected — 'sub' is not a valid UUID",
            extra={"extra_data": {"sub": user_id_str}},
        )
        raise _CREDENTIALS_EXCEPTION

    # -- Step 4: Fetch user from DB ----------------------------------------
    result = await db.execute(select(User).where(User.id == user_uuid))
    user: User | None = result.scalar_one_or_none()

    if user is None:
        logger.warning(
            "JWT rejected — user not found in DB",
            extra={"extra_data": {"user_id": user_id_str}},
        )
        raise _CREDENTIALS_EXCEPTION

    # -- Step 5: Active-account guard --------------------------------------
    if not user.is_active:
        logger.warning(
            "JWT rejected — account is inactive",
            extra={"extra_data": {"user_id": user_id_str}},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been suspended.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

from typing import Callable

def require_role(*allowed_roles: str) -> Callable:
    """
    Returns a dependency that validates the current user has at least one of
    the specified roles.
    Raises HTTP 403 Forbidden if the user's role is not in the allowed list.
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        from backend.app.db.models.role import Role
        from backend.app.db.models.user_role import UserRole

        # Fetch the user's roles
        result = await db.execute(
            select(Role.name)
            .join(UserRole, Role.id == UserRole.role_id)
            .where(UserRole.user_id == current_user.id)
        )
        user_roles = result.scalars().all()

        allowed_upper = {r.upper() for r in allowed_roles}

        # Check for intersection
        if not any(r in allowed_upper for r in user_roles):
            logger.warning(
                "Access denied — insufficient permissions",
                extra={
                    "extra_data": {
                        "user_id": str(current_user.id),
                        "required": list(allowed_upper),
                        "actual": user_roles,
                    }
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return role_checker

require_municipal_corp = require_role("municipal_corp")
require_builder = require_role("builder", "municipal_corp")
