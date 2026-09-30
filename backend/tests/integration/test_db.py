from sqlalchemy import text


def test_db_session_execution(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_db_session_isolation(db_session):
    db_session.execute(
        text("CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)")
    )
    db_session.execute(text("INSERT INTO test_table (name) VALUES ('Test notarial')"))
    row = db_session.execute(text("SELECT name FROM test_table WHERE id = 1")).scalar()
    assert row == "Test notarial"
