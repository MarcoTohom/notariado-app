import { describe, expect, it } from "vitest";
import { findClausesKey, renumberClauses, valuesSignature } from "../useDraftEditor";
import { resolveShortcut, EDITOR_SHORTCUTS } from "../useEditorShortcuts";

/**
 * Pruebas de la lógica del editor de borradores (WP-07) y de los
 * atajos de teclado (WP-08).
 */

const keyEvent = (key: string, mods: Partial<{ ctrl: boolean; alt: boolean }> = {}) => ({
  key,
  ctrlKey: mods.ctrl ?? false,
  altKey: mods.alt ?? false,
  metaKey: false,
});

describe("findClausesKey", () => {
  it("detecta la lista de cláusulas por nombre", () => {
    expect(findClausesKey({ clausulas: [{ numero: 1 }], precio: "100" })).toBe("clausulas");
    expect(findClausesKey({ incisos: [] })).toBe("incisos");
    expect(findClausesKey({ precio: "100" })).toBeNull();
    expect(findClausesKey({ clausulas: "no-es-lista" })).toBeNull();
  });
});

describe("renumberClauses", () => {
  it("renumera por orden actual sin mutar la lista original", () => {
    const original = [
      { numero: 3, texto: "tercera" },
      { numero: 1, texto: "primera" },
      { numero: 2, texto: "segunda" },
    ];
    const result = renumberClauses(original);
    expect(result.map((c) => c.numero)).toEqual([1, 2, 3]);
    expect(original[0].numero).toBe(3); // inmutable
  });

  it("conserva el resto de subcampos", () => {
    const result = renumberClauses([{ numero: 9, texto: "objeto", nota: "x" }]);
    expect(result[0]).toEqual({ numero: 1, texto: "objeto", nota: "x" });
  });
});

describe("valuesSignature", () => {
  it("es estable para el mismo contenido y cambia con el contenido", () => {
    const a = valuesSignature({ dpi: "1234567890101" });
    const b = valuesSignature({ dpi: "1234567890101" });
    const c = valuesSignature({ dpi: "1234567890102" });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("resolveShortcut (WP-08)", () => {
  it("mapea los combos de acciones principales", () => {
    expect(resolveShortcut(keyEvent("s", { ctrl: true }))).toBe("save");
    expect(resolveShortcut(keyEvent("Enter", { ctrl: true }))).toBe("validate");
    expect(resolveShortcut(keyEvent("g", { ctrl: true }))).toBe("generate");
    expect(resolveShortcut(keyEvent("n", { alt: true }))).toBe("addClause");
    expect(resolveShortcut(keyEvent("ArrowUp", { alt: true }))).toBe("clauseUp");
    expect(resolveShortcut(keyEvent("ArrowDown", { alt: true }))).toBe("clauseDown");
    expect(resolveShortcut(keyEvent("Delete", { alt: true }))).toBe("clauseDelete");
  });

  it("ignora teclas sin modificador o combos desconocidos", () => {
    expect(resolveShortcut(keyEvent("s"))).toBeNull();
    expect(resolveShortcut(keyEvent("n"))).toBeNull();
    expect(resolveShortcut(keyEvent("F5"))).toBeNull();
    expect(resolveShortcut(keyEvent("Delete"))).toBeNull();
  });

  it("el catálogo visible cubre todas las acciones con combo", () => {
    const actions = EDITOR_SHORTCUTS.map((s) => s.action);
    for (const action of ["save", "validate", "generate", "addClause", "clauseUp", "clauseDown", "clauseDelete"]) {
      expect(actions).toContain(action);
    }
    expect(EDITOR_SHORTCUTS.every((s) => s.combo.length > 0 && s.label.length > 0)).toBe(true);
  });
});
