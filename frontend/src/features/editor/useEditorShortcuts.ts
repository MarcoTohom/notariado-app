import { useEffect } from "react";

/** Mapa declarativo de atajos del editor de borradores (WP-08). */

export type EditorShortcutAction =
  | "save"
  | "validate"
  | "generate"
  | "addClause"
  | "clauseUp"
  | "clauseDown"
  | "clauseDelete";

export interface ShortcutDefinition {
  action: EditorShortcutAction;
  label: string;
  combo: string;
}

/** Catálogo visible en la interfaz (chips kbd junto a cada acción). */
export const EDITOR_SHORTCUTS: ShortcutDefinition[] = [
  { action: "save", label: "Guardar datos", combo: "Ctrl+S" },
  { action: "validate", label: "Validar consistencia", combo: "Ctrl+Enter" },
  { action: "generate", label: "Generar DOCX", combo: "Ctrl+G" },
  { action: "addClause", label: "Añadir inciso", combo: "Alt+N" },
  { action: "clauseUp", label: "Subir inciso", combo: "Alt+↑" },
  { action: "clauseDown", label: "Bajar inciso", combo: "Alt+↓" },
  { action: "clauseDelete", label: "Eliminar inciso", combo: "Alt+Supr" },
];

/** Resuelve un evento de teclado a una acción (función pura, testeable). */
export function resolveShortcut(event: {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}): EditorShortcutAction | null {
  const key = event.key.toLowerCase();
  if (event.ctrlKey && key === "s") return "save";
  if (event.ctrlKey && key === "enter") return "validate";
  if (event.ctrlKey && key === "g") return "generate";
  if (event.altKey && key === "n") return "addClause";
  if (event.altKey && event.key === "ArrowUp") return "clauseUp";
  if (event.altKey && event.key === "ArrowDown") return "clauseDown";
  if (event.altKey && (event.key === "Delete" || event.key === "Backspace")) {
    return "clauseDelete";
  }
  return null;
}

interface UseEditorShortcutsOptions {
  enabled: boolean;
  onAction: (action: EditorShortcutAction) => void;
}

/** Registra los atajos mientras la página del editor está montada. */
export function useEditorShortcuts({ enabled, onAction }: UseEditorShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      const action = resolveShortcut(event);
      if (!action) return;
      event.preventDefault();
      onAction(action);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onAction]);
}
