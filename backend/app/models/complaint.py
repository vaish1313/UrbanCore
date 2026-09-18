import uuid
import enum
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bbox_key = Column(String, index=True)
    area_name = Column(String)
    
    min_lat = Column(Float)
    min_lon = Column(Float)
    max_lat = Column(Float)
    max_lon = Column(Float)
    
    description = Column(Text)
    satellite_evidence_year = Column(Integer)
    construction_type = Column(String, nullable=True)
    
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False)
    municipal_notes = Column(Text, nullable=True)
    
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    submitted_by_user = relationship("User", back_populates="complaints")
