import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequireAuth } from "../RequireAuth";
import { useAuth } from "../AuthContext";
import type { UserSession } from "../types";

vi.mock("../AuthContext", () => ({ useAuth: vi.fn() }));

type AuthState = ReturnType<typeof useAuth>;
const syntheticUser: UserSession = {
  id: "usuario-sintetico",
  username: "prueba.sintetica",
  email: "prueba@example.test",
  full_name: "Persona Sintética",
  role: "AUXILIAR",
  status: "ACTIVE",
  permissions: ["cases:read"],
};
let auth: AuthState;

beforeEach(() => {
  auth = {
    user: null,
    token: null,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    hasRole: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(false),
  };
  vi.mocked(useAuth).mockImplementation(() => auth);
});

const show = (permission?: string) => render(
  <RequireAuth permission={permission}>
    <p>Contenido del expediente sintético</p>
  </RequireAuth>,
);

describe("acceso a pantallas protegidas", () => {
  it("espera la comprobación de sesión antes de mostrar contenido", () => {
    auth.loading = true;
    show("cases:read");
    expect(screen.getByText("Verificando sesión…")).toBeInTheDocument();
    expect(screen.queryByText("Contenido del expediente sintético")).not.toBeInTheDocument();
  });

  it("permite abrir el acceso cuando no hay sesión y mantiene oculto el contenido", async () => {
    show("cases:read");
    expect(screen.getByText("Módulo protegido")).toBeInTheDocument();
    expect(screen.queryByText("Contenido del expediente sintético")).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(screen.getByText("Acceso Notarial Seguro")).toBeInTheDocument();
  });

  it("rechaza el acceso de una sesión sin el permiso solicitado", () => {
    auth.user = syntheticUser;
    show("documents:read");
    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
    expect(auth.hasPermission).toHaveBeenCalledWith("documents:read");
    expect(screen.queryByText("Contenido del expediente sintético")).not.toBeInTheDocument();
  });

  it("muestra el contenido cuando la sesión tiene el permiso", () => {
    auth.user = syntheticUser;
    auth.hasPermission = vi.fn().mockReturnValue(true);
    show("cases:read");
    expect(screen.getByText("Contenido del expediente sintético")).toBeInTheDocument();
    expect(auth.hasPermission).toHaveBeenCalledWith("cases:read");
  });

  it("mantiene el acceso por sesión para rutas sin permiso adicional", () => {
    auth.user = syntheticUser;
    show();
    expect(screen.getByText("Contenido del expediente sintético")).toBeInTheDocument();
    expect(auth.hasPermission).not.toHaveBeenCalled();
  });
});
