import React, { useEffect, useRef, useState } from "react";
import { Client } from "../../types";
import { clientService } from "../../services/api";
import { Search, X, UserCheck } from "lucide-react";

interface ClientSearchSelectProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  disabled?: boolean;
  inputId?: string;
}

/**
 * Autocompletado de clientes (personas individuales) con búsqueda debounced.
 * Busca por nombre, DPI o NIT usando el endpoint paginado del backend.
 */
export const ClientSearchSelect: React.FC<ClientSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Buscar cliente por nombre o DPI…",
  disabled = false,
  inputId,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el desplegable al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda debounced (350 ms)
  useEffect(() => {
    if (value || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await clientService.getClients(0, 8, query.trim(), "ACTIVE");
        setResults(data.items);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (client: Client) => {
    onChange(client);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 border border-brand-200 bg-brand-50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {value.first_name} {value.last_name}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">DPI: {value.dpi}</p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors shrink-0"
            title="Quitar selección"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
        />
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
            buscando…
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-xs text-slate-500">Sin resultados activos.</li>
          ) : (
            results.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {client.first_name} {client.last_name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    DPI: {client.dpi}
                    {client.nit ? ` • NIT: ${client.nit}` : ""}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
