import json
import sqlite3

import pytest
from scripts.backup import create_backup


def test_backup_includes_committed_wal_and_preserves_document_versions(tmp_path):
    source = tmp_path / "custom.sqlite"
    uploads = tmp_path / "uploads"
    generated = tmp_path / "generated"
    uploads.mkdir()
    generated.mkdir()
    (uploads / "template-v1.docx").write_bytes(b"synthetic-template-v1")
    (generated / "draft-v1.docx").write_bytes(b"synthetic-draft-v1")
    with sqlite3.connect(source) as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("CREATE TABLE synthetic (value TEXT)")
        connection.execute("INSERT INTO synthetic VALUES ('0.10')")
        connection.commit()
        first = create_backup(
            f"sqlite:///{source.as_posix()}", uploads, generated, tmp_path / "backups"
        )
        with sqlite3.connect(first / "app.db") as restored:
            assert restored.execute("SELECT value FROM synthetic").fetchall() == [
                ("0.10",)
            ]
        (generated / "draft-v2.docx").write_bytes(b"synthetic-draft-v2")
        second = create_backup(
            f"sqlite:///{source.as_posix()}", uploads, generated, tmp_path / "backups"
        )
        assert first != second
        assert (first / "generated/draft-v1.docx").read_bytes() == b"synthetic-draft-v1"
        assert not (first / "generated/draft-v2.docx").exists()
        assert (
            second / "generated/draft-v2.docx"
        ).read_bytes() == b"synthetic-draft-v2"
        assert (uploads / "template-v1.docx").read_bytes() == (
            first / "uploads/template-v1.docx"
        ).read_bytes()
        assert connection.execute("SELECT COUNT(*) FROM synthetic").fetchone() == (1,)
        assert (
            json.loads((second / "manifest.json").read_text())["status"] == "complete"
        )


def test_missing_database_is_not_created_during_backup(tmp_path):
    source = tmp_path / "missing.sqlite"
    with pytest.raises(FileNotFoundError):
        create_backup(
            f"sqlite:///{source.as_posix()}",
            tmp_path / "uploads",
            tmp_path / "generated",
            tmp_path / "backups",
        )
    assert not source.exists()
    assert not (tmp_path / "backups").exists()


@pytest.mark.parametrize("database_url", ["sqlite:///:memory:", "postgresql:///test"])
def test_backup_rejects_non_file_databases(tmp_path, database_url):
    with pytest.raises(ValueError):
        create_backup(database_url, tmp_path / "u", tmp_path / "g", tmp_path / "b")
    assert not (tmp_path / "b").exists()


@pytest.mark.parametrize("nested_directory", ["uploads", "generated"])
def test_backup_rejects_destination_inside_document_storage(tmp_path, nested_directory):
    source = tmp_path / "test.sqlite"
    with sqlite3.connect(source) as connection:
        connection.execute("CREATE TABLE synthetic (id INTEGER)")
    with pytest.raises(ValueError):
        create_backup(
            f"sqlite:///{source.as_posix()}",
            tmp_path / "uploads",
            tmp_path / "generated",
            tmp_path / nested_directory / "backups",
        )
    assert not (tmp_path / nested_directory).exists()
