import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import TimestampMixin


class IdentifiableMixin(TimestampMixin):
    """Mixin providing UUID string primary keys and timestamps."""

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
