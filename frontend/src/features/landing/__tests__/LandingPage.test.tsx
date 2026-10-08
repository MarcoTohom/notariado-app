import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { LandingPage } from "../LandingPage";
import * as AuthContextModule from "../../../context/AuthContext";
import { UserSession } from "../../../types";

const mockUseAuth = (user: UserSession | null = null) => {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    token: user ? "mock-token" : null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn((role) => (user ? user.role === role : false)),
    hasPermission: vi.fn((perm) => (user ? user.permissions.includes(perm) : false)),
  });
};

const renderLanding = () => {
  return render(
    <BrowserRouter>
      <LandingPage />
    </BrowserRouter>
  );
};

describe("LandingPage (WP-01)", () => {
  it("renderiza el titular hero y la propuesta de valor legal", () => {
    mockUseAuth(null);
    renderLanding();

    expect(
      screen.getByRole("heading", {
        name: /Borradores de escrituras públicas con validación documental automatizada/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Tecnología Jurídica Notarial • Ciudad de Guatemala/i)
    ).toBeInTheDocument();
  });

  it("renderiza las 3 tarjetas de la arquitectura notarial", () => {
    mockUseAuth(null);
    renderLanding();

    expect(
      screen.getByText(/Plantillas DOCX con Jinja2 y Versionamiento Inmutable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Motor de 20 Reglas Notariales Automatizadas/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Borradores Verificados sin Placeholders Residuales/i)
    ).toBeInTheDocument();
  });

  it("renderiza el flujo de trabajo en 4 pasos", () => {
    mockUseAuth(null);
    renderLanding();

    expect(screen.getByText(/Del Expediente al Borrador en 4 Pasos/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expediente" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plantilla" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Validación" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Borrador DOCX" })).toBeInTheDocument();
  });

  it("muestra la nota de cumplimiento legal y función notarial", () => {
    mockUseAuth(null);
    renderLanding();

    expect(
      screen.getByText(/Herramienta de Apoyo Profesional — Cumplimiento del Marco Jurídico/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No sustituye la fe pública del Notario/i)
    ).toBeInTheDocument();
  });

  it("ofrece botón de acceder al sistema que abre modal cuando no hay sesión", async () => {
    mockUseAuth(null);
    renderLanding();
    const user = userEvent.setup();

    const ctaButton = screen.getByRole("button", { name: /Acceder al Sistema/i });
    expect(ctaButton).toBeInTheDocument();

    await user.click(ctaButton);
    expect(screen.getByRole("heading", { name: /Acceso Notarial Seguro/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuario o Correo Electrónico/i)).toBeInTheDocument();
  });

  it("ofrece botón 'Ir al panel del sistema' cuando ya existe sesión autenticada", () => {
    const fakeUser: UserSession = {
      id: "u-admin",
      username: "admin",
      email: "admin@bufete.gt",
      full_name: "Lic. Administrador Notarial",
      role: "ADMINISTRADOR",
      status: "ACTIVE",
      permissions: ["clients:read", "cases:read"],
    };
    mockUseAuth(fakeUser);
    renderLanding();

    const panelLink = screen.getByRole("link", { name: /Ir al panel del sistema/i });
    expect(panelLink).toBeInTheDocument();
    expect(panelLink).toHaveAttribute("href", "/expedientes");
    expect(screen.getByText(/Lic\. Administrador Notarial/i)).toBeInTheDocument();
  });
});
