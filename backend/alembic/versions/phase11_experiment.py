"""phase11_experiment: tablas del módulo de medición de tesis (Fase 11)."""

import sqlalchemy as sa

from alembic import op

revision = "phase11_experiment"
down_revision = "phase7_documents"
branch_labels = None
depends_on = None


def _timestamps() -> list[sa.Column]:
    return [
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
    ]


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    if "test_cases" not in existing:
        op.create_table(
            "test_cases",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("case_type", sa.String(length=30), nullable=False),
            sa.Column("title", sa.String(length=250), nullable=False),
            sa.Column("has_anomalies", sa.Boolean(), nullable=False),
            sa.Column("anomaly_types", sa.JSON(), nullable=False),
            sa.Column("expected_findings", sa.JSON(), nullable=False),
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.ForeignKeyConstraint(["case_id"], ["cases.id"]),
            sa.ForeignKeyConstraint(
                ["template_version_id"], ["template_versions.id"]
            ),
            sa.PrimaryKeyConstraint("id"),
            *_timestamps(),
        )
        op.create_index(op.f("ix_test_cases_case_id"), "test_cases", ["case_id"])
        op.create_index(op.f("ix_test_cases_case_type"), "test_cases", ["case_type"])
        op.create_index(
            op.f("ix_test_cases_has_anomalies"), "test_cases", ["has_anomalies"]
        )
        op.create_index(op.f("ix_test_cases_id"), "test_cases", ["id"])

    if "test_executions" not in existing:
        op.create_table(
            "test_executions",
            sa.Column("test_case_id", sa.String(length=36), nullable=False),
            sa.Column("method", sa.String(length=20), nullable=False),
            sa.Column("started_at", sa.String(length=40), nullable=False),
            sa.Column("finished_at", sa.String(length=40), nullable=True),
            sa.Column("duration_seconds", sa.Integer(), nullable=True),
            sa.Column("duration_minutes", sa.String(length=20), nullable=True),
            sa.Column("errors_found", sa.Integer(), nullable=False),
            sa.Column("errors_missed", sa.Integer(), nullable=False),
            sa.Column("corrections", sa.Integer(), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("executed_by_id", sa.String(length=36), nullable=False),
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.ForeignKeyConstraint(["test_case_id"], ["test_cases.id"]),
            sa.ForeignKeyConstraint(["executed_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            *_timestamps(),
        )
        op.create_index(
            op.f("ix_test_executions_test_case_id"),
            "test_executions",
            ["test_case_id"],
        )
        op.create_index(op.f("ix_test_executions_id"), "test_executions", ["id"])

    if "time_measurements" not in existing:
        op.create_table(
            "time_measurements",
            sa.Column("execution_id", sa.String(length=36), nullable=False),
            sa.Column("stage", sa.String(length=20), nullable=False),
            sa.Column("started_at", sa.String(length=40), nullable=False),
            sa.Column("finished_at", sa.String(length=40), nullable=True),
            sa.Column("duration_seconds", sa.Integer(), nullable=True),
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.ForeignKeyConstraint(["execution_id"], ["test_executions.id"]),
            sa.PrimaryKeyConstraint("id"),
            *_timestamps(),
        )
        op.create_index(
            op.f("ix_time_measurements_execution_id"),
            "time_measurements",
            ["execution_id"],
        )
        op.create_index(op.f("ix_time_measurements_id"), "time_measurements", ["id"])


def downgrade():
    op.drop_table("time_measurements")
    op.drop_table("test_executions")
    op.drop_table("test_cases")
