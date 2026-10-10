import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientFormModal } from "../ClientFormModal";
import type { Client, ClientCreate } from "../types";

/**
 * Pruebas del formulario de registro de cliente (Fase 3):
 * validación en cliente con Zod + React Hook Form, máscara de DPI
 * y envío del payload saneado al servicio.
 */

const renderModal = (onSave = vi.fn().mockResolvedValue(undefined), initialData?: Client | null) => {
  render(
    <ClientFormModal
      isOpen={true}
      onClose={() => {}}
      onSave={onSave}
      initialData={initialData}
    />
  );
  return onSave;
};

describe("ClientFormModal", () => {
  it("renderiza los campos obligatorios del formulario", () => {
    renderModal();
    expect(screen.getByLabelText(/Nombres/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apellidos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/DPI/)).toBeInTheDocument();
    expect(screen.getByLabelText(/NIT/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nacionalidad/)).toBeInTheDocument();
  });

  it("muestra errores de validación al enviar el formulario vacío", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Registrar Cliente/i }));

    expect(await screen.findByText(/nombres deben tener al menos 2 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/apellidos deben tener al menos 2 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/13 dígitos numéricos/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rechaza un DPI con menos de 13 dígitos y no envía el formulario", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nombres/), "Juan Carlos");
    await user.type(screen.getByLabelText(/Apellidos/), "Pérez López");
    await user.type(screen.getByLabelText(/DPI/), "12345");

    await user.click(screen.getByRole("button", { name: /Registrar Cliente/i }));

    expect(await screen.findByText(/13 dígitos numéricos/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("aplica la máscara de DPI eliminando caracteres no numéricos", async () => {
    renderModal();
    const user = userEvent.setup();
    const dpiInput = screen.getByLabelText(/DPI/) as HTMLInputElement;

    await user.type(dpiInput, "12ab34-5678 90101");

    expect(dpiInput.value).toBe("1234567890101");
  });

  it("envía el payload saneado cuando todos los datos son válidos", async () => {
    const onSave = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nombres/), "María Fernanda");
    await user.type(screen.getByLabelText(/Apellidos/), "López García");
    await user.type(screen.getByLabelText(/DPI/), "1234567890101");
    await user.type(screen.getByLabelText(/NIT/), "1234567-8");

    await user.click(screen.getByRole("button", { name: /Registrar Cliente/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0] as ClientCreate;
    expect(payload.first_name).toBe("María Fernanda");
    expect(payload.last_name).toBe("López García");
    expect(payload.dpi).toBe("1234567890101");
    expect(payload.nit).toBe("1234567-8");
    expect(payload.nationality).toBe("GUATEMALTECA");
    // Campos opcionales vacíos se envían como undefined
    expect(payload.email).toBeUndefined();
  });

  it("en modo edición el DPI se muestra deshabilitado con el valor original", () => {
    const existing: Client = {
      id: "uuid-1",
      first_name: "Ana",
      last_name: "Morales",
      dpi: "9876543210901",
      nit: "7654321-9",
      marital_status: "SOLTERO",
      profession: "Doctora",
      nationality: "GUATEMALTECA",
      birth_date: "1988-01-20",
      address: "Zona 1",
      phone: "55550000",
      email: "ana@example.com",
      status: "ACTIVE",
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    };
    renderModal(vi.fn().mockResolvedValue(undefined), existing);

    const dpiInput = screen.getByLabelText(/DPI/) as HTMLInputElement;
    expect(dpiInput.value).toBe("9876543210901");
    expect(dpiInput).toBeDisabled();
    expect(screen.getByRole("button", { name: /Guardar Cambios/i })).toBeInTheDocument();
  });
});
