"""Cliente y expediente sintéticos usados por validación y generación."""

from fastapi.testclient import TestClient

from tests.support.auth import auth_headers


def create_case_with_party(
    client: TestClient,
    token: str,
    title: str = "Compraventa de inmueble para motor de reglas",
) -> tuple[str, str]:
    response = client.post(
        "/api/v1/clients",
        json={
            "first_name": "Carlos",
            "last_name": "Mendez Ruiz",
            "dpi": "1234567890101",
            "nit": "1234567-8",
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 201, response.text
    client_id = response.json()["id"]
    response = client.post(
        "/api/v1/cases",
        json={
            "title": title,
            "case_type": "COMPRAVENTA",
            "parties": [{"client_id": client_id, "party_role": "COMPRADOR"}],
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 201, response.text
    return response.json()["id"], client_id
