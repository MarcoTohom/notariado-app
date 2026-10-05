"""phase4_fields: schema required by dynamic forms."""

from alembic import op
import sqlalchemy as sa

revision = "phase4_fields"
down_revision = "phase3_subjects"
branch_labels = None
depends_on = None


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    if "templates" not in existing:
        op.create_table(
            "templates",
            sa.Column("name", sa.String(length=150), nullable=False),
            sa.Column("case_type", sa.String(length=30), nullable=False),
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
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_templates_id"), "templates", ["id"], unique=False)
    if "template_versions" not in existing:
        op.create_table(
            "template_versions",
            sa.Column("template_id", sa.String(length=36), nullable=False),
            sa.Column("version_number", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False),
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
            sa.ForeignKeyConstraint(
                ["template_id"],
                ["templates.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("template_id", "version_number"),
        )
        op.create_index(
            op.f("ix_template_versions_id"), "template_versions", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_template_versions_template_id"),
            "template_versions",
            ["template_id"],
            unique=False,
        )
    if "case_field_values" not in existing:
        op.create_table(
            "case_field_values",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("values", sa.JSON(), nullable=False),
            sa.Column("revision", sa.Integer(), nullable=False),
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
            sa.ForeignKeyConstraint(
                ["case_id"],
                ["cases.id"],
            ),
            sa.ForeignKeyConstraint(
                ["template_version_id"],
                ["template_versions.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("case_id", "template_version_id"),
        )
        op.create_index(
            op.f("ix_case_field_values_case_id"),
            "case_field_values",
            ["case_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_case_field_values_id"), "case_field_values", ["id"], unique=False
        )
    if "field_attachments" not in existing:
        op.create_table(
            "field_attachments",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("field_key", sa.String(length=250), nullable=False),
            sa.Column("original_name", sa.String(length=200), nullable=False),
            sa.Column("storage_name", sa.String(length=50), nullable=False),
            sa.Column("media_type", sa.String(length=150), nullable=False),
            sa.Column("size", sa.Integer(), nullable=False),
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
            sa.ForeignKeyConstraint(
                ["case_id"],
                ["cases.id"],
            ),
            sa.ForeignKeyConstraint(
                ["template_version_id"],
                ["template_versions.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("storage_name"),
        )
        op.create_index(
            op.f("ix_field_attachments_case_id"),
            "field_attachments",
            ["case_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_field_attachments_id"), "field_attachments", ["id"], unique=False
        )
    if "template_fields" not in existing:
        op.create_table(
            "template_fields",
            sa.Column("template_version_id", sa.String(length=36), nullable=False),
            sa.Column("key", sa.String(length=64), nullable=False),
            sa.Column("label", sa.String(length=150), nullable=False),
            sa.Column("field_type", sa.String(length=20), nullable=False),
            sa.Column("required", sa.Boolean(), nullable=False),
            sa.Column("nullable", sa.Boolean(), nullable=False),
            sa.Column("default_value", sa.JSON(), nullable=True),
            sa.Column("min_length", sa.Integer(), nullable=True),
            sa.Column("max_length", sa.Integer(), nullable=True),
            sa.Column("min_value", sa.String(length=64), nullable=True),
            sa.Column("max_value", sa.String(length=64), nullable=True),
            sa.Column("regex", sa.String(length=200), nullable=True),
            sa.Column("mask", sa.String(length=80), nullable=True),
            sa.Column("format", sa.String(length=80), nullable=True),
            sa.Column("options_json", sa.JSON(), nullable=False),
            sa.Column("source", sa.String(length=20), nullable=False),
            sa.Column("source_reference", sa.String(length=64), nullable=True),
            sa.Column("readonly", sa.Boolean(), nullable=False),
            sa.Column("calculated", sa.Boolean(), nullable=False),
            sa.Column("calculation_expression", sa.String(length=500), nullable=True),
            sa.Column("docx_variable", sa.String(length=150), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("help_text", sa.Text(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False),
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
            sa.ForeignKeyConstraint(
                ["template_version_id"],
                ["template_versions.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("template_version_id", "key"),
        )
        op.create_index(
            op.f("ix_template_fields_id"), "template_fields", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_template_fields_template_version_id"),
            "template_fields",
            ["template_version_id"],
            unique=False,
        )


def downgrade():
    op.drop_index(
        op.f("ix_template_fields_template_version_id"), table_name="template_fields"
    )
    op.drop_index(op.f("ix_template_fields_id"), table_name="template_fields")
    op.drop_table("template_fields")
    op.drop_index(op.f("ix_field_attachments_id"), table_name="field_attachments")
    op.drop_index(op.f("ix_field_attachments_case_id"), table_name="field_attachments")
    op.drop_table("field_attachments")
    op.drop_index(op.f("ix_case_field_values_id"), table_name="case_field_values")
    op.drop_index(op.f("ix_case_field_values_case_id"), table_name="case_field_values")
    op.drop_table("case_field_values")
    op.drop_index(
        op.f("ix_template_versions_template_id"), table_name="template_versions"
    )
    op.drop_index(op.f("ix_template_versions_id"), table_name="template_versions")
    op.drop_table("template_versions")
    op.drop_index(op.f("ix_templates_id"), table_name="templates")
    op.drop_table("templates")
