import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ControlProps } from "./types";
import { clientService } from "../../clients/api";
import { caseService } from "../../cases/api";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
export function RelationInput(p: ControlProps) {
  const [search, setSearch] = useState("");
  const source = p.definition.source;
  const results = useQuery({
    queryKey: ["field-relations", source, search],
    queryFn: async () => {
      if (source === "clients")
        return (
          await clientService.getClients(0, 20, search, "ACTIVE")
        ).items.map((c) => ({
          id: c.id,
          label: `${c.first_name} ${c.last_name}`,
        }));
      return (await caseService.getCases(0, 20, search)).items.map((c) => ({
        id: c.id,
        label: `${c.case_number} · ${c.title}`,
      }));
    },
    enabled: !p.disabled,
  });
  const selected = useQuery({
    queryKey: ["field-relation", source, p.value],
    queryFn: async () => {
      if (source === "clients") {
        const c = await clientService.getClient(String(p.value));
        return `${c.first_name} ${c.last_name}`;
      }
      const c = await caseService.getCase(String(p.value));
      return `${c.case_number} · ${c.title}`;
    },
    enabled: Boolean(p.value),
  });
  return (
    <div className="space-y-2">
      <input
        id={p.id}
        className={inputClass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={p.disabled}
        placeholder="Buscar registro…"
        role="combobox"
        aria-expanded={Boolean(search)}
        aria-controls={`${p.id}-results`}
        aria-autocomplete="list"
        aria-invalid={p.invalid}
        aria-describedby={p.describedBy}
      />
      {p.value ? (
        <div className="flex gap-3 text-sm">
          <span>Seleccionado: {selected.data || "Cargando…"}</span>
          <button
            type="button"
            disabled={p.disabled}
            onClick={() => {
              p.onChange("");
              p.onBlur();
            }}
          >
            Quitar selección
          </button>
        </div>
      ) : null}
      {(results.isError || selected.isError) && (
        <p role="alert">No se pudieron cargar los registros.</p>
      )}
      {results.isFetching && <p role="status">Buscando…</p>}
      {!p.disabled && (
        <ul
          id={`${p.id}-results`}
          role="listbox"
          aria-label={`Resultados de ${p.definition.label}`}
          className="max-h-36 overflow-auto rounded border"
        >
          {(results.data || []).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={p.value === item.id}
                className="w-full text-left px-3 py-2 hover:bg-brand-50"
                onClick={() => {
                  p.onChange(item.id);
                  p.onBlur();
                  setSearch("");
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
          {results.data?.length === 0 && (
            <li className="p-2 text-sm">Sin resultados.</li>
          )}
        </ul>
      )}
    </div>
  );
}
