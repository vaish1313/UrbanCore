"""
Foundational SQLAlchemy ORM Metadata Layer.

Why this file exists:
This module defines the single, global `MetaData` object and the base declarative class 
(`Base`) for all SQLAlchemy models in UrbanCore. It ensures that every database constraint 
(indexes, foreign keys, primary keys) is named deterministically, which is critical for 
Alembic autogeneration and safe migrations in production.

Why it belongs here:
`backend/app/db/` is the core infrastructure layer. The ORM metadata sits precisely at the 
boundary between Python objects and the relational database schema.

Dependencies:
- `sqlalchemy.orm.DeclarativeBase`: The SQLAlchemy 2.0 foundation for all models.
- `sqlalchemy.MetaData`: Manages the collection of table definitions and constraints.

Interaction:
Every future ORM model (e.g., Users, Projects, AOIs) MUST inherit from the `Base` class 
defined in this file (usually via an intermediary `BaseModel` that adds IDs and timestamps). 
Alembic will import `Base.metadata` in its `env.py` to detect schema changes.

Future Extension Points:
- Multi-schema support: `MetaData(schema="core")` can be used to isolate tables into 
  different PostgreSQL namespaces.
- Table Partitioning: Future models can declare `__table_args__ = {"postgresql_partition_by": "..."}`.
- Sharding: We can extend `Base` to support routing keys for Citus or horizontal sharding.
"""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# ==========================================
# Deterministic Naming Conventions
# ==========================================
# Why this exists:
# By default, PostgreSQL assigns arbitrary names to constraints (e.g., `users_email_key`).
# If you run an Alembic auto-migration on a different developer's machine or server, Alembic 
# might see a mismatch in the random names and generate false-positive migration scripts that 
# attempt to drop and recreate constraints, corrupting the production database.
#
# Defining a strict naming convention forces SQLAlchemy and Alembic to generate explicit, 
# identical constraint names across all environments.
NAMING_CONVENTION = {
    # Index: `ix_table_name_column_name`
    "ix": "ix_%(column_0_label)s",
    
    # Unique Constraint: `uq_table_name_column_name`
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    
    # Check Constraint: `ck_table_name_constraint_name`
    # Note: Requires naming the check constraint explicitly in the model definition.
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    
    # Foreign Key: `fk_table_name_column_name_referred_table_name`
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    
    # Primary Key: `pk_table_name`
    "pk": "pk_%(table_name)s",
}

# The global metadata registry holding the schema state for the entire application.
metadata = MetaData(naming_convention=NAMING_CONVENTION)


# ==========================================
# Declarative Base Class
# ==========================================
class Base(DeclarativeBase):
    """
    The foundational class for all SQLAlchemy 2.0 ORM models.

    Usage:
    Do not inherit from this class directly for standard models. Instead, inherit from 
    `BaseModel` (which will be defined in `base_model.py`) to inherit standard UUIDs 
    and audit timestamps. 
    
    If creating a pure join-table for a many-to-many relationship without primary keys, 
    inheriting from `Base` directly is permissible.

    Architecture Design:
    This class binds the globally configured `metadata` object (with our deterministic 
    naming conventions) to every derived class.
    """
    metadata = metadata
