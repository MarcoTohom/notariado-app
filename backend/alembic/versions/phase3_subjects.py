"""phase3_subjects: schema required by dynamic forms."""

from alembic import op
import sqlalchemy as sa

revision = "phase3_subjects"
down_revision = "06f3bdb3abdb"
branch_labels = None
depends_on = None


def upgrade():
    existing = sa.inspect(op.get_bind()).get_table_names()
    if "clients" not in existing:
        op.create_table(
            "clients",
            sa.Column("first_name", sa.String(length=100), nullable=False),
            sa.Column("last_name", sa.String(length=100), nullable=False),
            sa.Column("dpi", sa.String(length=13), nullable=False),
            sa.Column("nit", sa.String(length=20), nullable=True),
            sa.Column("marital_status", sa.String(length=30), nullable=True),
            sa.Column("profession", sa.String(length=100), nullable=True),
            sa.Column("nationality", sa.String(length=50), nullable=False),
            sa.Column("birth_date", sa.String(length=10), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("phone", sa.String(length=20), nullable=True),
            sa.Column("email", sa.String(length=100), nullable=True),
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
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_clients_dpi"), "clients", ["dpi"], unique=True)
        op.create_index(
            op.f("ix_clients_first_name"), "clients", ["first_name"], unique=False
        )
        op.create_index(op.f("ix_clients_id"), "clients", ["id"], unique=False)
        op.create_index(
            op.f("ix_clients_last_name"), "clients", ["last_name"], unique=False
        )
        op.create_index(op.f("ix_clients_nit"), "clients", ["nit"], unique=False)
        op.create_index(op.f("ix_clients_status"), "clients", ["status"], unique=False)
    if "cases" not in existing:
        op.create_table(
            "cases",
            sa.Column("case_number", sa.String(length=20), nullable=False),
            sa.Column("case_type", sa.String(length=30), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("title", sa.String(length=250), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("internal_notes", sa.Text(), nullable=True),
            sa.Column("instrument_number", sa.String(length=30), nullable=True),
            sa.Column("protocol_folio", sa.String(length=30), nullable=True),
            sa.Column("protocol_book", sa.String(length=30), nullable=True),
            sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("assigned_user_id", sa.String(length=36), nullable=True),
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
                ["assigned_user_id"],
                ["users.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_cases_assigned_user_id"),
            "cases",
            ["assigned_user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_cases_case_number"), "cases", ["case_number"], unique=True
        )
        op.create_index(
            op.f("ix_cases_case_type"), "cases", ["case_type"], unique=False
        )
        op.create_index(op.f("ix_cases_id"), "cases", ["id"], unique=False)
        op.create_index(op.f("ix_cases_status"), "cases", ["status"], unique=False)
    if "legal_entities" not in existing:
        op.create_table(
            "legal_entities",
            sa.Column("business_name", sa.String(length=200), nullable=False),
            sa.Column("trade_name", sa.String(length=200), nullable=True),
            sa.Column("nit", sa.String(length=20), nullable=False),
            sa.Column("society_type", sa.String(length=50), nullable=False),
            sa.Column("registry_number", sa.String(length=50), nullable=True),
            sa.Column("registry_folio", sa.String(length=30), nullable=True),
            sa.Column("registry_book", sa.String(length=30), nullable=True),
            sa.Column("legal_representative_id", sa.String(length=36), nullable=True),
            sa.Column("representative_position", sa.String(length=100), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("phone", sa.String(length=20), nullable=True),
            sa.Column("email", sa.String(length=100), nullable=True),
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
            sa.ForeignKeyConstraint(
                ["legal_representative_id"],
                ["clients.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_legal_entities_business_name"),
            "legal_entities",
            ["business_name"],
            unique=False,
        )
        op.create_index(
            op.f("ix_legal_entities_id"), "legal_entities", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_legal_entities_legal_representative_id"),
            "legal_entities",
            ["legal_representative_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_legal_entities_nit"), "legal_entities", ["nit"], unique=True
        )
        op.create_index(
            op.f("ix_legal_entities_status"), "legal_entities", ["status"], unique=False
        )
    if "case_parties" not in existing:
        op.create_table(
            "case_parties",
            sa.Column("case_id", sa.String(length=36), nullable=False),
            sa.Column("client_id", sa.String(length=36), nullable=False),
            sa.Column("party_role", sa.String(length=30), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("order_index", sa.Integer(), nullable=True),
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
                ["client_id"],
                ["clients.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_case_parties_case_id"), "case_parties", ["case_id"], unique=False
        )
        op.create_index(
            op.f("ix_case_parties_client_id"),
            "case_parties",
            ["client_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_case_parties_id"), "case_parties", ["id"], unique=False
        )
        op.create_index(
            op.f("ix_case_parties_party_role"),
            "case_parties",
            ["party_role"],
            unique=False,
        )


def downgrade():
    op.drop_index(op.f("ix_case_parties_party_role"), table_name="case_parties")
    op.drop_index(op.f("ix_case_parties_id"), table_name="case_parties")
    op.drop_index(op.f("ix_case_parties_client_id"), table_name="case_parties")
    op.drop_index(op.f("ix_case_parties_case_id"), table_name="case_parties")
    op.drop_table("case_parties")
    op.drop_index(op.f("ix_legal_entities_status"), table_name="legal_entities")
    op.drop_index(op.f("ix_legal_entities_nit"), table_name="legal_entities")
    op.drop_index(
        op.f("ix_legal_entities_legal_representative_id"), table_name="legal_entities"
    )
    op.drop_index(op.f("ix_legal_entities_id"), table_name="legal_entities")
    op.drop_index(op.f("ix_legal_entities_business_name"), table_name="legal_entities")
    op.drop_table("legal_entities")
    op.drop_index(op.f("ix_cases_status"), table_name="cases")
    op.drop_index(op.f("ix_cases_id"), table_name="cases")
    op.drop_index(op.f("ix_cases_case_type"), table_name="cases")
    op.drop_index(op.f("ix_cases_case_number"), table_name="cases")
    op.drop_index(op.f("ix_cases_assigned_user_id"), table_name="cases")
    op.drop_table("cases")
    op.drop_index(op.f("ix_clients_status"), table_name="clients")
    op.drop_index(op.f("ix_clients_nit"), table_name="clients")
    op.drop_index(op.f("ix_clients_last_name"), table_name="clients")
    op.drop_index(op.f("ix_clients_id"), table_name="clients")
    op.drop_index(op.f("ix_clients_first_name"), table_name="clients")
    op.drop_index(op.f("ix_clients_dpi"), table_name="clients")
    op.drop_table("clients")
