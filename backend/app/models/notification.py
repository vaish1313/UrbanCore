"""
Notification model.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class NotificationType(str, enum.Enum):
    """Notification types."""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class NotificationChannel(str, enum.Enum):
    """Notification delivery channels."""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class Notification(Base):
    """Notification."""
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Notification content
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SQLEnum(NotificationType), default=NotificationType.INFO, nullable=False)
    
    # Channel
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.IN_APP, nullable=False)
    
    # Link to related resource
    resource_type = Column(String(50), nullable=True)  # 'project', 'report', 'complaint', etc.
    resource_id = Column(Integer, nullable=True)
    
    # Status
    is_read = Column(Integer, default=0, nullable=False)  # Boolean as integer
    is_sent = Column(Integer, default=0, nullable=False)  # Boolean as integer
    
    # Delivery tracking
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    delivery_status = Column(String(50), nullable=True)
    delivery_error = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.title} ({self.channel}) - {'Read' if self.is_read else 'Unread'}>"
