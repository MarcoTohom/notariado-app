import os

tests_base = r"C:\git\apps\notariado-app\backend\tests"

conftest_code = '''import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db

# Isolated in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
'''

test_config_code = '''from app.core.config import settings

def test_settings_loaded():
    assert settings.PROJECT_NAME == "Sistema de Borradores de Escrituras Públicas"
    assert settings.VERSION == "1.0.0"
    assert settings.API_V1_STR == "/api/v1"
    assert "sqlite" in settings.DATABASE_URL
    assert settings.DEFAULT_BASELINE_MINUTES == 240
    assert settings.TARGET_MINUTES == 60
'''

test_health_code = '''def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "version" in data
    assert data["health"] == "/api/v1/health"

def test_health_check_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Sistema de Borradores de Escrituras Públicas"
    assert data["system"]["database"] == "sqlite"
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["uploads_dir"] is True
    assert data["checks"]["generated_dir"] is True
'''

test_db_code = '''from sqlalchemy import text

def test_db_session_execution(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_db_session_isolation(db_session):
    db_session.execute(text("CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)"))
    db_session.execute(text("INSERT INTO test_table (name) VALUES ('Test notarial')"))
    row = db_session.execute(text("SELECT name FROM test_table WHERE id = 1")).scalar()
    assert row == "Test notarial"
'''

with open(os.path.join(tests_base, "conftest.py"), "w", encoding="utf-8") as f:
    f.write(conftest_code)

with open(os.path.join(tests_base, "unit", "test_config.py"), "w", encoding="utf-8") as f:
    f.write(test_config_code)

with open(os.path.join(tests_base, "integration", "test_health.py"), "w", encoding="utf-8") as f:
    f.write(test_health_code)

with open(os.path.join(tests_base, "integration", "test_db.py"), "w", encoding="utf-8") as f:
    f.write(test_db_code)

print("Tests created successfully.")
