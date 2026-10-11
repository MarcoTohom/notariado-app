import { useEffect, useMemo, useRef, useState } from "react";
import { Values } from "../fields/types";

/** Lógica del editor de borradores (WP-07): debounce del preview y
 *  operaciones de incisos. Las funciones puras viven al nivel del módulo
 *  para probarlas sin React. */

export const PREVIEW_DEBOUNCE_MS = 800;

/** Clave estable de los valores para disparar el preview una vez por ráfaga. */
export const valuesSignature = (values: Values): string => JSON.stringify(values);

/** Encuentra el primer campo lista cuyo nombre sugiere cláusulas/incisos. */
export const findClausesKey = (values: Values): string | null => {
  for (const key of Object.keys(values)) {
    if (/clausula|inciso/i.test(key) && Array.isArray(values[key])) return key;
  }
  return null;
};

/**
 * Renumera los incisos de una lista según su orden actual (numero = índice+1).
 * Devuelve una lista NUEVA (inmutable) con subcampo `numero` ajustado.
 */
export const renumberClauses = (
  items: Record<string, unknown>[]
): Record<string, unknown>[] =>
  items.map((item, index) => ({ ...item, numero: index + 1 }));

/** Hook de debounce para la firma de valores del preview. */
export function useDebouncedSignature(values: Values, delay = PREVIEW_DEBOUNCE_MS): string {
  const signature = useMemo(() => valuesSignature(values), [values]);
  const [debounced, setDebounced] = useState(signature);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(signature), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [signature, delay]);

  return debounced;
}
