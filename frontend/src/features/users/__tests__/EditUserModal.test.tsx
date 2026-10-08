import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditUserModal } from "../EditUserModal";
import { UserItem } from "../../../types";
import { userService } from "../../../services/api";
import * as AuthContextModule from "../../../context/AuthContext";

const mockUser: UserItem = {
  id: "u-notario-1",
  username: "notario.titular",
  email: "notario@bufete.gt",
  full_name: "Lic. Notario Titular",
  role: "ABOGADO_NOTARIO",
  status: "ACTIVE",
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
  permission_overrides: {
    grant: ["users:read"],
    revoke: ["quotes:delete"],
  },
};

describe("EditUserModal (WP-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: "u-admin",
        username: "admin",
        email: "admin@bufete.gt",
        full_name: "Administrador",
        role: "ADMINISTRADOR",
        status: "ACTIVE",
        permissions: ["users:read", "users:update"],
      },
      token: "tok",
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(() => true),
      hasPermission: vi.fn(() => true),
    });

    vi.spyOn(userService, "getPermissionCatalog").mockResolvedValue([
      "users:read",
      "users:update",
      "clients:read",
      "templates:activate",
      "quotes:delete",
    ]);
  });

  it("renderiza los datos iniciales del usuario y sus overrides existentes", async () => {
    render(
      <EditUserModal
        user={mockUser}
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText(/Editar Usuario:/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lic. Notario Titular")).toBeInTheDocument();
    expect(screen.getByDisplayValue("notario@bufete.gt")).toBeInTheDocument();

    // Esperar carga del catálogo de permisos
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Overrides Granulares de Permisos/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Permisos adicionales \(Grant\)/i)).toBeInTheDocument();
    });
  });

  it("permite cambiar datos y enviar el payload con overrides actualizados", async () => {
    const updateSpy = vi.spyOn(userService, "updateUser").mockResolvedValue({
      ...mockUser,
      full_name: "Lic. Notario Actualizado",
    });
    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <EditUserModal
        user={mockUser}
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    const user = userEvent.setup();

    const nameInput = screen.getByDisplayValue("Lic. Notario Titular");
    await user.clear(nameInput);
    await user.type(nameInput, "Lic. Notario Actualizado");

    const submitBtn = screen.getByRole("button", { name: /Guardar Cambios/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "u-notario-1",
        expect.objectContaining({
          full_name: "Lic. Notario Actualizado",
          email: "notario@bufete.gt",
          role: "ABOGADO_NOTARIO",
          status: "ACTIVE",
          permission_overrides: {
            grant: ["users:read"],
            revoke: ["quotes:delete"],
          },
        })
      );
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("deshabilita el cambio de rol y estado cuando el administrador edita su propia cuenta", () => {
    const adminSelfUser: UserItem = {
      ...mockUser,
      id: "u-admin",
      username: "admin",
      role: "ADMINISTRADOR",
    };

    render(
      <EditUserModal
        user={adminSelfUser}
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Estás editando tu propia cuenta de administrador/i)
    ).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    for (const select of selects) {
      expect(select).toBeDisabled();
    }
  });
});
