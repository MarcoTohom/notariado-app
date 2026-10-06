"""phase7_documents: tablas documents y document_versions (Fase 7)."""

import sqlalchemy as sa

from alembic import op

revision = "phase7_documents"
down_revision = "phase6_rules"
branch_labels = None
depends_on = None


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    if "documents" not in existing:
        op.create_table(
            "documents",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("title", sa.String(length=250), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
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
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_documents_case_id"), "documents", ["case_id"])
        op.create_index(op.f("ix_documents_status"), "documents", ["status"])
        op.create_index(op.f("ix_documents_id"), "documents", ["id"])

    if "document_versions" not in existing:
        op.create_table(
            "document_versions",
            sa.Column("document_id", sa.String(length=36), nullable=False),
            sa.Column("version_number", sa.Integer(), nullable=False),
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("data_snapshot", sa.JSON(), nullable=False),
            sa.Column("file_path", sa.String(length=500), nullable=False),
            sa.Column("file_hash", sa.String(length=64), nullable=False),
            sa.Column("file_size", sa.Integer(), nullable=False),
            sa.Column("validation_status", sa.String(length=40), nullable=False),
            sa.Column("placeholders_free", sa.Boolean(), nullable=False),
            sa.Column("residual_variables", sa.JSON(), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by_id", sa.String(length=36), nullable=False),
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
            sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
            sa.ForeignKeyConstraint(
                ["template_version_id"], ["template_versions.id"]
            ),
            sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_document_versions_document_id"),
            "document_versions",
            ["document_id"],
        )
        op.create_index(op.f("ix_document_versions_id"), "document_versions", ["id"])


def downgrade():
    op.drop_index(op.f("ix_document_versions_id"), table_name="document_versions")
    op.drop_index(
        op.f("ix_document_versions_document_id"), table_name="document_versions"
    )
    op.drop_table("document_versions")
    op.drop_index(op.f("ix_documents_id"), table_name="documents")
    op.drop_index(op.f("ix_documents_status"), table_name="documents")
    op.drop_index(op.f("ix_documents_case_id"), table_name="documents")
    op.drop_table("documents")
