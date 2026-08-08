"""
Seeds package for UrbanCore database population scripts.

All seed scripts in this package must be:
- Idempotent (safe to run multiple times)
- Async (using session_scope from backend.app.db.session)
- Self-contained (no external dependencies beyond the existing models)
"""
