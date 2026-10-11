"""wp03_user_permission_overrides: columna permission_overrides en users (WP-03)."""

import sqlalchemy as sa
from alembic import op

revision = "wp03_user_permission_overrides"
down_revision = "phase11_experiment"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("permission_overrides", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("users", "permission_overrides")
