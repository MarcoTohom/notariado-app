import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PROJECT_PHASES } from "../projectPhases";
import { ProjectPanelPage } from "../ProjectPanelPage";
import { RequireAuth } from "../../../App";
import * as AuthContextModule from "../../../context/AuthContext";
import { UserSession } from "../../../types";

const mockUseAuth = (user: UserSession | null = null) => {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user,
    token: user ? "mock-token" : null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn((...roles) => (user ? roles.includes(user.role) : false)),
    hasPermission: vi.fn((perm) => (user ? user.permissions.includes(perm) : false)),
  });
};

describe("ProjectPhases Data Integrity (WP-02)", () => {
  it("cada fase tiene un id único, título y estado válido", () => {
    const ids = new Set<string>();
    const validStatuses = new Set(["DONE", "IN_PROGRESS", "PENDING"]);

    for (const phase of PROJECT_PHASES) {
      expect(ids.has(phase.id)).toBe(false);
      ids.add(phase.id);
      expect(phase.title.length).toBeGreaterThan(5);
      expect(phase.summary.length).toBeGreaterThan(10);
      expect(validStatuses.has(phase.status)).toBe(true);
    }

    expect(ids.has("F1")).toBe(true);
    expect(ids.has("F7")).toBe(true);
    expect(ids.has("F11")).toBe(true);
    expect(ids.has("WP-01")).toBe(true);
    expect(ids.has("WP-02")).toBe(true);
    expect(ids.has("WP-08")).toBe(true);
  });
});

describe("ProjectPanelPage Component (WP-02)", () => {
  it("renderiza el panel de seguimiento de fases para el administrador", () => {
    const adminUser: UserSession = {
      id: "u-admin",
      username: "admin",
      email: "admin@bufete.gt",
      full_name: "Administrador Notarial",
      role: "ADMINISTRADOR",
      status: "ACTIVE",
      permissions: ["users:read", "clients:read"],
    };
    mockUseAuth(adminUser);

    render(
      <BrowserRouter>
        <ProjectPanelPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Seguimiento de Ingeniería del Proyecto de Tesis/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Fase 1: Fundación Arquitectónica, Entorno y CI")).toBeInTheDocument();
    expect(screen.getByText("WP-01: Landing Page Profesional de Mercado Legal")).toBeInTheDocument();
    expect(screen.getByText("WP-02: Panel Técnico Solo-Admin y Seguimiento de Fases")).toBeInTheDocument();
    expect(screen.getByText("Scripts de Control en Windows")).toBeInTheDocument();
  });

  it("bloquea el acceso a usuarios con rol no administrador mediante RequireAuth adminOnly", () => {
    const auxiliarUser: UserSession = {
      id: "u-aux",
      username: "auxiliar",
      email: "auxiliar@bufete.gt",
      full_name: "Auxiliar Jurídico",
      role: "AUXILIAR",
      status: "ACTIVE",
      permissions: ["clients:read"],
    };
    mockUseAuth(auxiliarUser);

    render(
      <RequireAuth adminOnly>
        <div data-testid="admin-secret">Panel Confidencial</div>
      </RequireAuth>
    );

    expect(screen.queryByTestId("admin-secret")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Acceso restringido/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Esta sección está reservada exclusivamente para el rol/i)
    ).toBeInTheDocument();
  });
});
