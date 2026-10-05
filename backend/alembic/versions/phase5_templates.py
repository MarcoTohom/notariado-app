"""phase5_templates: metadata de archivos DOCX en plantillas (Fase 5).

Agrega a templates: description y status (baja logica).
Agrega a template_versions: file_path, original_filename, file_hash,
file_size, notes y uploaded_by_id para versiones DOCX inmutables.
Agrega a template_fields: auto_detected (proveniencia del extractor Jinja2).
"""

import sqlalchemy as sa

from alembic import op

revision = "phase5_templates"
down_revision = "phase4_fields"
branch_labels = None
depends_on = None


def _existing_columns(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade():
    template_cols = _existing_columns("templates")
    if "description" not in template_cols:
        op.add_column("templates", sa.Column("description", sa.Text(), nullable=True))
    if "status" not in template_cols:
        op.add_column(
            "templates",
            sa.Column(
                "status",
                sa.String(length=20),
                server_default="ACTIVE",
                nullable=False,
            ),
        )

    version_cols = _existing_columns("template_versions")
    if "file_path" not in version_cols:
        op.add_column(
            "template_versions",
            sa.Column("file_path", sa.String(length=500), nullable=True),
        )
    if "original_filename" not in version_cols:
        op.add_column(
            "template_versions",
            sa.Column("original_filename", sa.String(length=200), nullable=True),
        )
    if "file_hash" not in version_cols:
        op.add_column(
            "template_versions",
            sa.Column("file_hash", sa.String(length=64), nullable=True),
        )
    if "file_size" not in version_cols:
        op.add_column(
            "template_versions", sa.Column("file_size", sa.Integer(), nullable=True)
        )
    if "notes" not in version_cols:
        op.add_column(
            "template_versions", sa.Column("notes", sa.Text(), nullable=True)
        )
    if "uploaded_by_id" not in version_cols:
        # SQLite exige batch mode (copy-and-move) para agregar una FK por ALTER.
        with op.batch_alter_table("template_versions") as batch_op:
            batch_op.add_column(
                sa.Column("uploaded_by_id", sa.String(length=36), nullable=True)
            )
            batch_op.create_foreign_key(
                "fk_template_versions_uploaded_by", "users", ["uploaded_by_id"], ["id"]
            )

    field_cols = _existing_columns("template_fields")
    if "auto_detected" not in field_cols:
        op.add_column(
            "template_fields",
            sa.Column(
                "auto_detected",
                sa.Boolean(),
                server_default=sa.false(),
                nullable=False,
            ),
        )


def downgrade():
    op.drop_column("template_fields", "auto_detected")
    with op.batch_alter_table("template_versions") as batch_op:
        batch_op.drop_constraint(
            "fk_template_versions_uploaded_by", type_="foreignkey"
        )
        batch_op.drop_column("uploaded_by_id")
    op.drop_column("template_versions", "notes")
    op.drop_column("template_versions", "file_size")
    op.drop_column("template_versions", "file_hash")
    op.drop_column("template_versions", "original_filename")
    op.drop_column("template_versions", "file_path")
    op.drop_column("templates", "status")
    op.drop_column("templates", "description")
