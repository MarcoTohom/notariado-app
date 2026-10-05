"""Isolated local server for Playwright; never reads or writes the user's database."""

import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def main():
    with TemporaryDirectory(prefix="notariado-e2e-") as directory:
        root = Path(directory)
        os.environ["DATABASE_URL"] = f"sqlite:///{(root / 'test.sqlite').as_posix()}"
        os.environ["UPLOAD_DIR"] = str(root / "uploads")
        os.environ["GENERATED_DIR"] = str(root / "generated")
        import uvicorn
        from alembic.config import Config

        from alembic import command
        from app.core.security import get_password_hash
        from app.db.session import SessionLocal
        from app.models.user import User

        command.upgrade(
            Config(str(Path(__file__).resolve().parents[1] / "alembic.ini")), "head"
        )
        with SessionLocal() as db:
            db.add(
                User(
                    username="e2e_sintetico",
                    email="e2e@example.com",
                    full_name="Notario sintético",
                    password_hash=get_password_hash("Synthetic-test-42!"),
                    role="ADMINISTRADOR",
                    status="ACTIVE",
                )
            )
            db.commit()
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8011,
            log_level="error",
            access_log=False,
        )


if __name__ == "__main__":
    main()
