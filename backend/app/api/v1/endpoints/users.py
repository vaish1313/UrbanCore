"""
User management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user, get_current_active_admin, get_password_hash
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, UserChangePassword


router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    List all users (admin only).
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated admin user
        db: Database session
    
    Returns:
        List of users
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.
    
    Args:
        user_id: User ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        User information
    """
    # Users can only view their own profile unless they're MUNICIPAL_CORP
    if current_user.id != user_id and current_user.role != UserRole.MUNICIPAL_CORP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user information.
    
    Args:
        user_id: User ID
        user_data: Updated user data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated user
    """
    # Users can only update their own profile unless they're MUNICIPAL_CORP
    if current_user.id != user_id and current_user.role != UserRole.MUNICIPAL_CORP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/{user_id}/change-password")
async def change_password(
    user_id: int,
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.
    
    Args:
        user_id: User ID
        password_data: Old and new passwords
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # Users can only change their own password
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to change this password"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify old password
    from app.core.security import verify_password
    if not verify_password(password_data.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Delete user (admin only).
    
    Args:
        user_id: User ID
        current_user: Current authenticated admin user
        db: Database session
    
    Returns:
        Success message
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting self
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
