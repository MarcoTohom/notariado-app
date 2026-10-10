import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal, ModalActions, ModalBody } from "../Modal";
import { ConfirmDialog } from "../ConfirmDialog";
import { ErrorNotice, FieldError, LoadingState } from "../Feedback";

describe("Modal compartido", () => {
  it("permite cerrar con teclado sin enviar el formulario contenedor", async () => {
    const close = vi.fn(), submit = vi.fn();
    render(
      <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <Modal title="Cliente sintético" subtitle="Datos de prueba" icon={<span />} onClose={close}>
          <ModalBody><input aria-label="Nombre" /></ModalBody>
          <ModalActions><button type="submit">Guardar</button></ModalActions>
        </Modal>
      </form>,
    );
    const user = userEvent.setup();
    const dialog = screen.getByRole("dialog", { name: "Cliente sintético" });
    await user.tab();
    expect(within(dialog).getByRole("button", { name: "Cerrar" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(close).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("conserva tamaños, altura y etiquetas independientes en diálogos simultáneos", () => {
    render(<>
      <Modal title="Accesos" subtitle="Usuarios" icon={<span />} onClose={vi.fn()} size="4xl" height="85vh"><ModalBody>Lista</ModalBody></Modal>
      <Modal title="Ingreso" subtitle="Sesión" icon={<span />} onClose={vi.fn()} size="md" height="content" animated><input aria-label="Usuario" /></Modal>
    </>);
    const large = screen.getByRole("dialog", { name: "Accesos" });
    const small = screen.getByRole("dialog", { name: "Ingreso" });
    expect(large).toHaveClass("max-w-4xl", "max-h-[85vh]", "flex-col");
    expect(small).toHaveClass("max-w-md", "animate-in");
    expect(small).not.toHaveClass("max-h-[90vh]", "flex-col");
    expect(large.getAttribute("aria-labelledby")).not.toBe(small.getAttribute("aria-labelledby"));
  });

  it("no cierra al pulsar el fondo y conserva la separación de confirmar y cancelar", async () => {
    const confirm = vi.fn(), cancel = vi.fn();
    const props = { isOpen: true, title: "Desactivar", message: "Cliente sintético", onConfirm: confirm, onCancel: cancel };
    const view = render(<ConfirmDialog {...props} />);
    const user = userEvent.setup();
    const dialog = screen.getByRole("alertdialog", { name: "Desactivar" });
    expect(dialog.parentElement).toHaveClass("z-[60]");
    await user.click(dialog.parentElement!);
    expect(cancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
    view.rerender(<ConfirmDialog {...props} loading />);
    expect(screen.getByRole("button", { name: "Procesando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Volver" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(cancel).toHaveBeenCalledTimes(1);
    view.rerender(<ConfirmDialog {...props} isOpen={false} />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("expone errores y carga sin alterar sus mensajes", () => {
    render(<><FieldError>DPI inválido.</FieldError><ErrorNotice className="mb-4">No se pudo guardar.</ErrorNotice><LoadingState className="py-16">Cargando…</LoadingState></>);
    expect(screen.getAllByRole("alert").map(node => node.textContent)).toEqual(["DPI inválido.", "No se pudo guardar."]);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
  });
});
