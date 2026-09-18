"""citizen_complaints_schema

Revision ID: a76eda20dc47
Revises: 001_area_cache
Create Date: 2026-09-18 06:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a76eda20dc47'
down_revision: Union[str, None] = '001_area_cache'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing table and type
    op.execute("DROP TABLE IF EXISTS complaints CASCADE")
    op.execute("DROP TYPE IF EXISTS complaintstatus CASCADE")
    
    # Recreate the table with new schema
    op.create_table('complaints',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('submitted_by_id', sa.Integer(), nullable=True),
        sa.Column('bbox_key', sa.String(), nullable=True),
        sa.Column('area_name', sa.String(), nullable=True),
        sa.Column('min_lat', sa.Float(), nullable=True),
        sa.Column('min_lon', sa.Float(), nullable=True),
        sa.Column('max_lat', sa.Float(), nullable=True),
        sa.Column('max_lon', sa.Float(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('satellite_evidence_year', sa.Integer(), nullable=True),
        sa.Column('construction_type', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('SUBMITTED', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'RESOLVED', name='complaintstatus'), nullable=False),
        sa.Column('municipal_notes', sa.Text(), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['submitted_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaints_bbox_key'), 'complaints', ['bbox_key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_complaints_bbox_key'), table_name='complaints')
    op.drop_table('complaints')
    op.execute("DROP TYPE IF EXISTS complaintstatus")
