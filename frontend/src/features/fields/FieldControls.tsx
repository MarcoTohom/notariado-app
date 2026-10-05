import { createContext, useContext, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  caseService,
  clientService,
  getApiErrorMessage,
} from "../../services/api";
import { fieldsApi } from "./api";
import { FieldDefinition } from "./types";
import {
  defaults,
  displayMoney,
  fixedMoney,
  maskDigits,
  normalizeText,
} from "./validation";

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 focus:ring-2 focus:ring-brand-500";
export const FileActivityContext = createContext<
  ((delta: number) => void) | null
>(null);
export interface ControlProps {
  definition: FieldDefinition;
  name: string;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  caseId: string;
  versionId: string;
  invalid?: boolean;
  describedBy?: string;
}
const textValue = (value: unknown) => (value == null ? "" : String(value));
function BasicInput(
  p: ControlProps & {
    type?: string;
    inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
    normalize?: (value: string) => string;
  },
) {
  return (
    <input
      id={p.id}
      name={p.name}
      className={inputClass}
      type={p.type || "text"}
      inputMode={p.inputMode}
      value={textValue(p.value)}
      disabled={p.disabled}
      aria-invalid={p.invalid}
      aria-describedby={p.describedBy}
      aria-required={p.definition.required}
      placeholder={p.definition.mask || undefined}
      min={p.definition.min_value ?? undefined}
      max={p.definition.max_value ?? undefined}
      step={p.type === "datetime-local" ? "1" : undefined}
      onChange={(e) => p.onChange(e.target.value)}
      onBlur={() => {
        if (p.normalize) p.onChange(p.normalize(textValue(p.value)));
        p.onBlur();
      }}
    />
  );
}
export const TextInput = (p: ControlProps) => (
  <BasicInput {...p} normalize={normalizeText} />
);
export const NameInput = TextInput;
export const DpiInput = (p: ControlProps) => (
  <BasicInput
    {...p}
    inputMode="numeric"
    normalize={(v) =>
      maskDigits(
        v.replace(/[\s-]/g, ""),
        p.definition.mask || "0000 00000 0000",
      )
    }
  />
);
export const NitInput = (p: ControlProps) => (
  <BasicInput
    {...p}
    normalize={(v) => v.trim().toUpperCase().replace(/\s/g, "")}
  />
);
export const PhoneInput = (p: ControlProps) => (
  <BasicInput
    {...p}
    type="tel"
    normalize={(v) =>
      p.definition.mask ? maskDigits(v, p.definition.mask) : v.trim()
    }
  />
);
export const EmailInput = (p: ControlProps) => (
  <BasicInput
    {...p}
    type="email"
    normalize={(v) =>
      p.definition.options_json?.lowercase === false
        ? v.trim()
        : v.trim().toLowerCase()
    }
  />
);
export const IntegerInput = (p: ControlProps) => (
  <BasicInput {...p} inputMode="numeric" />
);
export const DecimalInput = (p: ControlProps) => (
  <BasicInput {...p} inputMode="decimal" />
);
export const PercentageInput = (p: ControlProps) => (
  <div className="flex items-center gap-2">
    <DecimalInput {...p} />
    <span>%</span>
  </div>
);
export const CurrencyInput = (p: ControlProps) => (
  <div>
    <BasicInput {...p} inputMode="decimal" normalize={fixedMoney} />
    <output
      className="text-xs text-slate-500"
      aria-label={`Importe de ${p.definition.label}`}
    >
      {displayMoney(textValue(p.value), p.definition.options_json?.currency)}
    </output>
  </div>
);
export const DateInput = (p: ControlProps) => <BasicInput {...p} type="date" />;
export const DateTimeInput = (p: ControlProps) => (
  <BasicInput {...p} type="datetime-local" />
);
export const BooleanInput = (p: ControlProps) => (
  <input
    type="checkbox"
    id={p.id}
    name={p.name}
    checked={p.value === true}
    disabled={p.disabled}
    aria-invalid={p.invalid}
    aria-describedby={p.describedBy}
    onChange={(e) => p.onChange(e.target.checked)}
    onBlur={p.onBlur}
    className="h-5 w-5"
  />
);
export const ComputedInput = (p: ControlProps) => (
  <input
    id={p.id}
    name={p.name}
    className={inputClass}
    value={textValue(p.value)}
    readOnly
    aria-describedby={p.describedBy}
    aria-invalid={p.invalid}
  />
);
export function TextArea(p: ControlProps) {
  return (
    <div>
      <textarea
        id={p.id}
        name={p.name}
        rows={4}
        className={inputClass}
        value={textValue(p.value)}
        disabled={p.disabled}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
        aria-invalid={p.invalid}
        aria-describedby={p.describedBy}
      />
      <span className="text-xs text-slate-500">
        {textValue(p.value).length}
        {p.definition.max_length != null
          ? ` / ${p.definition.max_length}`
          : ""}{" "}
        caracteres
      </span>
    </div>
  );
}
export function RichTextInput(p: ControlProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (tag: string) => {
    const text = textValue(p.value),
      start = ref.current?.selectionStart ?? text.length,
      end = ref.current?.selectionEnd ?? text.length;
    p.onChange(
      `${text.slice(0, start)}<${tag}>${text.slice(start, end)}</${tag}>${text.slice(end)}`,
    );
    ref.current?.focus();
  };
  return (
    <div>
      <div className="flex gap-3 mb-1">
        <button
          type="button"
          disabled={p.disabled}
          onClick={() => wrap("strong")}
          className="font-bold"
        >
          Negrita
        </button>
        <button
          type="button"
          disabled={p.disabled}
          onClick={() => wrap("em")}
          className="italic"
        >
          Cursiva
        </button>
        <button type="button" disabled={p.disabled} onClick={() => wrap("p")}>
          Párrafo
        </button>
      </div>
      <textarea
        ref={ref}
        id={p.id}
        name={p.name}
        rows={5}
        className={inputClass}
        disabled={p.disabled}
        value={textValue(p.value)}
        aria-invalid={p.invalid}
        aria-describedby={p.describedBy}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
      <small>
        Seleccione texto y aplique formato. El contenido se limpia al guardar.
      </small>
    </div>
  );
}
export function SelectInput(p: ControlProps) {
  return (
    <select
      id={p.id}
      name={p.name}
      value={textValue(p.value)}
      disabled={p.disabled}
      className={inputClass}
      onChange={(e) => p.onChange(e.target.value)}
      onBlur={p.onBlur}
      aria-invalid={p.invalid}
      aria-describedby={p.describedBy}
    >
      <option value="">Seleccione…</option>
      {[...(p.definition.options_json?.choices || [])]
        .filter((o) => o.active !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
    </select>
  );
}
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
export function FileInput(p: ControlProps) {
  const fileActivity = useContext(FileActivityContext);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const opts = p.definition.options_json;
  const upload = async (file?: File) => {
    if (!file) return;
    setError("");
    if (
      file.size > (opts?.max_bytes ?? 10485760) ||
      !(opts?.extensions || [".pdf", ".docx", ".xlsx", ".csv"]).some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      )
    ) {
      setError("Archivo demasiado grande o extensión no permitida.");
      return;
    }
    setBusy(true);
    fileActivity?.(1);
    try {
      const saved = await fieldsApi.upload(p.caseId, p.versionId, p.name, file);
      p.onChange(saved.id);
      p.onBlur();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
      fileActivity?.(-1);
    }
  };
  return (
    <div className="space-y-2">
      <input
        type="file"
        className="w-full max-w-full text-sm"
        id={p.id}
        name={p.name}
        disabled={p.disabled || busy}
        accept={(opts?.extensions || [".pdf", ".docx", ".xlsx", ".csv"]).join(
          ",",
        )}
        aria-describedby={p.describedBy}
        aria-invalid={p.invalid}
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {busy && <p role="status">Cargando archivo…</p>}
      {p.value ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              fieldsApi
                .download(p.caseId, String(p.value))
                .catch((e) => setError(getApiErrorMessage(e)))
            }
          >
            Descargar archivo
          </button>
          <button
            type="button"
            disabled={p.disabled || busy}
            onClick={() => p.onChange("")}
          >
            Desvincular
          </button>
        </div>
      ) : null}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
export function ListInput(p: ControlProps) {
  const { control } = useFormContext();
  const array = useFieldArray({ control, name: p.name });
  return (
    <div className="space-y-3" id={p.id}>
      {array.fields.map((row, index) => (
        <fieldset key={row.id} className="border rounded-lg p-3 space-y-3">
          <legend className="px-1 text-sm">
            {p.definition.label} {index + 1}
          </legend>
          <DynamicFields
            fields={p.definition.options_json?.fields || []}
            prefix={`${p.name}.${index}.`}
            caseId={p.caseId}
            versionId={p.versionId}
            disabled={p.disabled}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <button
              type="button"
              disabled={p.disabled || index === 0}
              onClick={() => array.move(index, index - 1)}
              aria-label={`Subir ${p.definition.label} ${index + 1}`}
            >
              Subir
            </button>
            <button
              type="button"
              disabled={p.disabled || index === array.fields.length - 1}
              onClick={() => array.move(index, index + 1)}
              aria-label={`Bajar ${p.definition.label} ${index + 1}`}
            >
              Bajar
            </button>
            <button
              type="button"
              disabled={p.disabled}
              onClick={() => array.remove(index)}
              aria-label={`Eliminar ${p.definition.label} ${index + 1}`}
            >
              Eliminar
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={
          p.disabled ||
          array.fields.length >= Math.min(100, p.definition.max_length ?? 100)
        }
        className="rounded border px-3 py-2 text-sm"
        onClick={() =>
          array.append(defaults(p.definition.options_json?.fields || []))
        }
      >
        Agregar {p.definition.label}
      </button>
    </div>
  );
}
export const CONTROLS = {
  text: TextInput,
  textarea: TextArea,
  name: NameInput,
  dpi: DpiInput,
  nit: NitInput,
  phone: PhoneInput,
  email: EmailInput,
  integer: IntegerInput,
  decimal: DecimalInput,
  currency: CurrencyInput,
  percentage: PercentageInput,
  date: DateInput,
  datetime: DateTimeInput,
  boolean: BooleanInput,
  select: SelectInput,
  relation: RelationInput,
  file: FileInput,
  list: ListInput,
  computed: ComputedInput,
  richtext: RichTextInput,
};
export function DynamicFields({
  fields,
  prefix = "",
  caseId,
  versionId,
  disabled = false,
}: {
  fields: FieldDefinition[];
  prefix?: string;
  caseId: string;
  versionId: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext();
  const filledTargets = new Set(
    fields.flatMap((f) => Object.keys(f.options_json?.autofill || {})),
  );
  return (
    <>
      {fields
        .filter((f) => f.active !== false)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((f) => {
          const name = `${prefix}${f.key}`,
            id = `field-${name}`,
            Control = CONTROLS[f.field_type];
          return (
            <Controller
              key={f.key}
              name={name}
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label
                    htmlFor={id}
                    className="block text-sm font-semibold text-slate-700"
                  >
                    {f.label}
                    {f.required ? " *" : ""}
                  </label>
                  <Control
                    definition={f}
                    name={name}
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={
                      disabled ||
                      Boolean(
                        f.readonly || f.calculated || filledTargets.has(f.key),
                      )
                    }
                    caseId={caseId}
                    versionId={versionId}
                    invalid={Boolean(fieldState.error)}
                    describedBy={`${id}-help ${id}-error`}
                  />
                  <p id={`${id}-help`} className="text-xs text-slate-500">
                    {f.help_text}
                    {f.format ? ` · Formato: ${f.format}` : ""}
                  </p>
                  <p
                    id={`${id}-error`}
                    role={fieldState.error ? "alert" : undefined}
                    className="text-sm text-red-700"
                  >
                    {fieldState.error?.message}
                  </p>
                </div>
              )}
            />
          );
        })}
    </>
  );
}
