from app.core.config import settings


def test_settings_loaded():
    assert settings.PROJECT_NAME == "Sistema de Borradores de Escrituras Públicas"
    assert settings.VERSION == "1.0.0"
    assert settings.API_V1_STR == "/api/v1"
    assert "sqlite" in settings.DATABASE_URL
    assert settings.DEFAULT_BASELINE_MINUTES == 240
    assert settings.TARGET_MINUTES == 60
