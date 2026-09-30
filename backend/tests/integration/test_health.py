def test_root_endpoint(client):
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
