"""phase6_rules: tabla validation_runs (historial del motor de reglas)."""

import sqlalchemy as sa

from alembic import op

revision = "phase6_rules"
down_revision = "phase5_templates"
branch_labels = None
depends_on = None


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    if "validation_runs" not in existing:
        op.create_table(
            "validation_runs",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("executed_by_id", sa.String(length=36), nullable=False),
            sa.Column("status", sa.String(length=25), nullable=False),
            sa.Column("total_findings", sa.Integer(), nullable=False),
            sa.Column("critical_count", sa.Integer(), nullable=False),
            sa.Column("error_count", sa.Integer(), nullable=False),
            sa.Column("warning_count", sa.Integer(), nullable=False),
            sa.Column("info_count", sa.Integer(), nullable=False),
            sa.Column("findings", sa.JSON(), nullable=False),
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
            sa.ForeignKeyConstraint(
                ["template_version_id"], ["template_versions.id"]
            ),
            sa.ForeignKeyConstraint(["executed_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_validation_runs_case_id"), "validation_runs", ["case_id"]
        )
        op.create_index(op.f("ix_validation_runs_id"), "validation_runs", ["id"])


def downgrade():
    op.drop_index(op.f("ix_validation_runs_id"), table_name="validation_runs")
    op.drop_index(op.f("ix_validation_runs_case_id"), table_name="validation_runs")
    op.drop_table("validation_runs")
