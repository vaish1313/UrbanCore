"""add address to user

Revision ID: a76eda20dc48
Revises: a76eda20dc47
Create Date: 2026-09-18 17:54:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a76eda20dc48'
down_revision = 'a76eda20dc47'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('address', sa.String(length=255), nullable=True))


def downgrade():
    op.drop_column('users', 'address')
