"""
AI-generated complaint letter model.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class ComplaintStatus(str, enum.Enum):
    """Complaint status."""
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class Complaint(Base):
    """AI-generated complaint letter."""
    
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Complaint details
    complaint_number = Column(String(50), unique=True, nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.DRAFT, nullable=False)
    
    # Target authority
    addressed_to = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    
    # AI-generated content
    letter_content = Column(Text, nullable=False)
    
    # Evidence attachments
    evidence_paths = Column(Text, nullable=True)  # JSON array of file paths
    
    # GPS coordinates of violation
    violation_lat = Column(String(50), nullable=True)
    violation_lon = Column(String(50), nullable=True)
    
    # Construction timeline
    construction_start_year = Column(Integer, nullable=True)
    construction_detected_year = Column(Integer, nullable=True)
    
    # Violation summary
    violation_summary = Column(Text, nullable=True)
    violation_severity = Column(String(20), nullable=True)
    
    # File paths
    pdf_path = Column(String(512), nullable=True)
    signed_pdf_path = Column(String(512), nullable=True)
    
    # Response tracking
    response_received = Column(Integer, default=0, nullable=False)  # Boolean as integer
    response_date = Column(DateTime, nullable=True)
    response_summary = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="complaints")
    created_by_user = relationship("User", back_populates="complaints")
    
    def __repr__(self):
        return f"<Complaint {self.complaint_number} - {self.status}>"
