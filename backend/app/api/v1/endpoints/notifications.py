"""Notification endpoints."""
from fastapi import APIRouter
router = APIRouter()

# Full implementation would include:
# - GET / - List user notifications
# - GET /{notification_id} - Get notification
# - PUT /{notification_id}/read - Mark as read
# - PUT /read-all - Mark all as read
# - DELETE /{notification_id} - Delete notification
