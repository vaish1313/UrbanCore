"""
Project management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse


router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new project.
    
    Args:
        project_data: Project creation data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created project
    """
    project = Project(
        **project_data.model_dump(),
        owner_id=current_user.id
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's projects.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of projects
    """
    query = db.query(Project)
    
    # Regular users see only their projects, MUNICIPAL_CORP sees all
    if current_user.role != UserRole.MUNICIPAL_CORP:
        query = query.filter(Project.owner_id == current_user.id)
    
    total = query.count()
    projects = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "projects": projects
    }


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get project by ID.
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Project information
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if current_user.role != UserRole.MUNICIPAL_CORP and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update project.
    
    Args:
        project_id: Project ID
        project_data: Updated project data
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Updated project
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if current_user.role != UserRole.MUNICIPAL_CORP and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete project.
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if current_user.role != UserRole.MUNICIPAL_CORP and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}
