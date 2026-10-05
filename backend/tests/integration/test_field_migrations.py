from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command
from app.core.config import settings
from app.db.base import Base


def test_migrations_fresh_and_upgrade_preserve_data(tmp_path, monkeypatch):
    path = tmp_path / "migration.sqlite"
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite:///{path.as_posix()}")
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    config.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[2] / "alembic")
    )
    command.upgrade(config, "head")
    engine = create_engine(settings.DATABASE_URL)
    assert set(Base.metadata.tables) <= set(inspect(engine).get_table_names())
    with engine.begin() as db:
        db.execute(
            text(
                "INSERT INTO templates (id,name,case_type) VALUES ('test','Formulario sintético','COMPRAVENTA')"
            )
        )
        assert db.execute(text("SELECT created_at FROM templates")).scalar()
        assert db.execute(text("PRAGMA foreign_key_check")).fetchall() == []
    # A repeated upgrade must preserve rows and be a no-op.
    command.upgrade(config, "head")
    with engine.connect() as db:
        assert (
            db.execute(text("SELECT name FROM templates WHERE id='test'")).scalar()
            == "Formulario sintético"
        )
    engine.dispose()
    command.downgrade(config, "phase3_subjects")
    command.upgrade(config, "head")
    engine = create_engine(settings.DATABASE_URL)
    assert "template_fields" in inspect(engine).get_table_names()
    engine.dispose()


def test_upgrade_from_create_all_installation(tmp_path, monkeypatch):
    monkeypatch.setattr(
        settings, "DATABASE_URL", f"sqlite:///{(tmp_path / 'legacy.sqlite').as_posix()}"
    )
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    config.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[2] / "alembic")
    )
    command.upgrade(config, "06f3bdb3abdb")
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(engine)
    with engine.begin() as db:
        db.execute(
            text(
                "INSERT INTO clients (id,first_name,last_name,dpi,nationality,status) VALUES ('test','Persona','Sintética','0000000000101','GUATEMALTECA','ACTIVE')"
            )
        )
    command.upgrade(config, "head")
    with engine.connect() as db:
        assert (
            db.execute(text("SELECT dpi FROM clients WHERE id='test'")).scalar()
            == "0000000000101"
        )
        assert db.execute(text("PRAGMA foreign_key_check")).fetchall() == []
    engine.dispose()
