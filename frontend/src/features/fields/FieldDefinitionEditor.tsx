import { useState } from "react";
import { FIELD_TYPES, FieldDefinition, TYPE_LABELS } from "./types";
import { inputClass } from "./FieldControls";

export const newField = (index: number): FieldDefinition => ({
  key: `campo_${index}`,
  label: `Campo ${index}`,
  field_type: "text",
  display_order: index,
  nullable: true,
  active: true,
});
export function FieldDefinitionEditor({
  fields,
  onChange,
  depth = 0,
}: {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const patch = (index: number, changes: Partial<FieldDefinition>) =>
    onChange(fields.map((f, i) => (i === index ? { ...f, ...changes } : f)));
  const reorder = (index: number, delta: number) => {
    const list = [...fields];
    [list[index], list[index + delta]] = [list[index + delta], list[index]];
    onChange(list.map((f, i) => ({ ...f, display_order: i })));
    setExpanded(index + delta);
  };
  const add = () => {
    let index = fields.length + 1;
    while (fields.some((f) => f.key === `campo_${index}`)) index++;
    onChange([...fields, newField(index)]);
    setExpanded(fields.length);
  };
  return (
    <div className="space-y-3">
      {fields.map((f, index) => {
        const options = f.options_json || {};
        const optionPatch = (
          change: NonNullable<FieldDefinition["options_json"]>,
        ) => patch(index, { options_json: { ...options, ...change } });
        const label = (title: string, control: React.ReactNode) => (
      <label key={title} className="block text-sm space-y-1">
            <span>{title}</span>
            {control}
          </label>
        );
        const text = (
          title: string,
          key: keyof FieldDefinition,
          type = "text",
        ) =>
          label(
            title,
            <input
              type={type}
              className={inputClass}
              value={String(f[key] ?? "")}
              onChange={(e) => patch(index, { [key]: e.target.value || null })}
            />,
          );
        return (
          <fieldset
            key={index}
            className="border rounded-xl p-4 bg-white space-y-3"
          >
            <legend className="text-sm px-1">
              {index + 1}. {f.label}
            </legend>
            <div className="grid sm:grid-cols-3 gap-3">
              {label(
                "Etiqueta",
                <input
                  className={inputClass}
                  value={f.label}
                  onChange={(e) => patch(index, { label: e.target.value })}
                />,
              )}
              {label(
                "Clave del campo",
                <input
                  className={inputClass}
                  value={f.key}
                  onChange={(e) => patch(index, { key: e.target.value })}
                />,
              )}
              {label(
                "Tipo de campo",
                <select
                  className={inputClass}
                  value={f.field_type}
                  onChange={(e) => {
                    const kind = e.target
                      .value as FieldDefinition["field_type"];
                    patch(index, {
                      field_type: kind,
                      calculated: kind === "computed",
                      readonly: kind === "computed",
                      source: kind === "relation" ? "clients" : "manual",
                      calculation_expression: kind === "computed" ? "0" : null,
                      options_json:
                        kind === "list"
                          ? { fields: [newField(1)] }
                          : kind === "select"
                            ? {
                                choices: [
                                  {
                                    label: "Opción 1",
                                    value: "opcion_1",
                                    active: true,
                                    order: 0,
                                  },
                                ],
                              }
                            : {},
                    });
                  }}
                >
                  {FIELD_TYPES.filter((t) => depth < 3 || t !== "list").map(
                    (t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ),
                  )}
                </select>,
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["required", "Obligatorio"],
                  ["nullable", "Admite nulos"],
                  ["readonly", "Solo lectura"],
                  ["active", "Activo"],
                ] as const
              ).map(([key, title]) => (
                <label key={key} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(f[key])}
                    disabled={key === "readonly" && f.field_type === "computed"}
                    onChange={(e) => patch(index, { [key]: e.target.checked })}
                  />
                  {title}
                </label>
              ))}
            </div>
            {f.field_type === "select" && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Opciones del catálogo</p>
                {(options.choices || []).map((o, i) => (
                  <div className="flex flex-wrap gap-2" key={i}>
                    <input
                      className="border rounded p-2"
                      aria-label={`Etiqueta de opción ${i + 1}`}
                      value={o.label}
                      onChange={(e) =>
                        optionPatch({
                          choices: options.choices!.map((v, j) =>
                            j === i ? { ...v, label: e.target.value } : v,
                          ),
                        })
                      }
                    />
                    <input
                      className="border rounded p-2"
                      aria-label={`Valor de opción ${i + 1}`}
                      value={o.value}
                      onChange={(e) =>
                        optionPatch({
                          choices: options.choices!.map((v, j) =>
                            j === i ? { ...v, value: e.target.value } : v,
                          ),
                        })
                      }
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={o.active !== false}
                        onChange={(e) =>
                          optionPatch({
                            choices: options.choices!.map((v, j) =>
                              j === i ? { ...v, active: e.target.checked } : v,
                            ),
                          })
                        }
                      />{" "}
                      Activa
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        optionPatch({
                          choices: options.choices!.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Quitar opción {i + 1}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-brand-700"
                  onClick={() =>
                    optionPatch({
                      choices: [
                        ...(options.choices || []),
                        {
                          label: "Nueva opción",
                          value: `opcion_${(options.choices?.length || 0) + 1}`,
                          active: true,
                          order: options.choices?.length || 0,
                        },
                      ],
                    })
                  }
                >
                  Agregar opción
                </button>
              </div>
            )}
            {f.field_type === "list" && (
              <FieldDefinitionEditor
                fields={options.fields || []}
                onChange={(children) => optionPatch({ fields: children })}
                depth={depth + 1}
              />
            )}
            {f.field_type === "relation" && (
              <div className="space-y-3">
                {label(
                  "Buscar en",
                  <select
                    className={inputClass}
                    value={f.source}
                    onChange={(e) =>
                      patch(index, {
                        source: e.target.value as "clients" | "cases",
                        options_json: { ...options, autofill: {} },
                      })
                    }
                  >
                    <option value="clients">Clientes</option>
                    <option value="cases">Expedientes</option>
                  </select>,
                )}
                {f.source === "clients" && (
                  <div>
                    <p className="text-sm">
                      Completar otros campos al seleccionar un cliente:
                    </p>
                    {fields
                      .filter(
                        (target) =>
                          target.key !== f.key &&
                          [
                            "text",
                            "name",
                            "dpi",
                            "nit",
                            "textarea",
                            "phone",
                            "email",
                            "select",
                          ].includes(target.field_type),
                      )
                      .map((target) =>
                        label(
                          target.label,
                          <select
                            key={target.key}
                            className={inputClass}
                            value={options.autofill?.[target.key] || ""}
                            onChange={(e) => {
                              const map = { ...options.autofill };
                              if (e.target.value)
                                map[target.key] = e.target.value;
                              else delete map[target.key];
                              optionPatch({ autofill: map });
                            }}
                          >
                            <option value="">Sin autocompletado</option>
                            {Object.entries({
                              full_name: "Nombre completo",
                              dpi: "DPI",
                              nit: "NIT",
                              address: "Dirección",
                              marital_status: "Estado civil",
                              phone: "Teléfono",
                              email: "Correo",
                            }).map(([key, title]) => (
                              <option key={key} value={key}>
                                {title}
                              </option>
                            ))}
                          </select>,
                        ),
                      )}
                  </div>
                )}
              </div>
            )}
            {f.field_type === "computed" && (
              <div>
                {text("Expresión del cálculo", "calculation_expression")}
                <small>
                  Use claves de campo: precio * cantidad, monto * porcentaje /
                  100, suma(bienes.valor). El resultado se redondea a dos
                  decimales.
                </small>
              </div>
            )}
            {f.field_type === "currency" &&
              label(
                "Moneda",
                <select
                  className={inputClass}
                  value={options.currency || "GTQ"}
                  onChange={(e) =>
                    optionPatch({ currency: e.target.value as "GTQ" | "USD" })
                  }
                >
                  <option value="GTQ">Quetzales (Q)</option>
                  <option value="USD">Dólares ($)</option>
                </select>,
              )}
            {f.field_type === "file" && (
              <div className="space-y-2">
                <p>Extensiones permitidas</p>
                <div className="flex gap-4">
                  {[".pdf", ".docx", ".xlsx", ".csv"].map((ext) => (
                    <label key={ext}>
                      <input
                        type="checkbox"
                        checked={(
                          options.extensions || [
                            ".pdf",
                            ".docx",
                            ".xlsx",
                            ".csv",
                          ]
                        ).includes(ext)}
                        onChange={(e) => {
                          const existing = options.extensions || [
                            ".pdf",
                            ".docx",
                            ".xlsx",
                            ".csv",
                          ];
                          optionPatch({
                            extensions: e.target.checked
                              ? [...existing, ext]
                              : existing.filter((x) => x !== ext),
                          });
                        }}
                      />
                      {ext}
                    </label>
                  ))}
                </div>
                {label(
                  "Tamaño máximo (bytes, hasta 10485760)",
                  <input
                    type="number"
                    className={inputClass}
                    min={1}
                    max={10485760}
                    value={options.max_bytes ?? 10485760}
                    onChange={(e) =>
                      optionPatch({ max_bytes: Number(e.target.value) })
                    }
                  />,
                )}
              </div>
            )}
            <button
              type="button"
              className="text-sm text-brand-700"
              aria-expanded={expanded === index}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              Restricciones y ayuda
            </button>
            {expanded === index && (
              <div className="grid sm:grid-cols-2 gap-3">
                {text("Ayuda contextual", "help_text")}
                {text("Variable del documento", "docx_variable")}
                {text("Máscara (0 representa un dígito)", "mask")}
                {text("Formato de presentación", "format")}
                {text("Expresión regular", "regex")}
                {["min_length", "max_length"].map((key) =>
                  label(
                    key === "min_length"
                      ? "Longitud / elementos mínimos"
                      : "Longitud / elementos máximos",
                    <input
                      key={key}
                      className={inputClass}
                      type="number"
                      min={0}
                      max={10000}
                      value={f[key as "min_length"] ?? ""}
                      onChange={(e) =>
                        patch(index, {
                          [key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />,
                  ),
                )}
                {text("Valor mínimo (o fecha ISO)", "min_value")}
                {text("Valor máximo (o fecha ISO)", "max_value")}
                {!["list", "file", "relation", "computed"].includes(
                  f.field_type,
                ) &&
                  label(
                    "Valor predeterminado",
                    f.field_type === "boolean" ? (
                      <select
                        className={inputClass}
                        value={String(f.default_value ?? "")}
                        onChange={(e) =>
                          patch(index, {
                            default_value:
                              e.target.value === ""
                                ? null
                                : e.target.value === "true",
                          })
                        }
                      >
                        <option value="">Sin predeterminado</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        className={inputClass}
                        value={String(f.default_value ?? "")}
                        onChange={(e) =>
                          patch(index, {
                            default_value: e.target.value || null,
                          })
                        }
                      />
                    ),
                  )}
                {[
                  "date",
                  "datetime",
                  "integer",
                  "decimal",
                  "currency",
                  "percentage",
                ].includes(f.field_type) && (
                  <>
                    {label(
                      "Comparar con",
                      <select
                        className={inputClass}
                        value={options.compare_to || ""}
                        onChange={(e) =>
                          optionPatch({ compare_to: e.target.value || null })
                        }
                      >
                        <option value="">Sin comparación</option>
                        {fields
                          .filter(
                            (v) =>
                              v.key !== f.key && v.field_type === f.field_type,
                          )
                          .map((v) => (
                            <option value={v.key} key={v.key}>
                              {v.label}
                            </option>
                          ))}
                      </select>,
                    )}
                    {label(
                      "Condición",
                      <select
                        className={inputClass}
                        value={options.comparison || "ge"}
                        onChange={(e) =>
                          optionPatch({
                            comparison: e.target.value as "ge" | "le",
                          })
                        }
                      >
                        <option value="ge">Mayor o igual</option>
                        <option value="le">Menor o igual</option>
                      </select>,
                    )}
                  </>
                )}
                {f.field_type === "email" && (
                  <label>
                    <input
                      type="checkbox"
                      checked={options.lowercase !== false}
                      onChange={(e) =>
                        optionPatch({ lowercase: e.target.checked })
                      }
                    />
                    Convertir a minúsculas
                  </label>
                )}
              </div>
            )}
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => reorder(index, -1)}
              >
                Subir campo
              </button>
              <button
                type="button"
                disabled={index === fields.length - 1}
                onClick={() => reorder(index, 1)}
              >
                Bajar campo
              </button>
              <button
                type="button"
                className="text-red-700"
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                Eliminar campo
              </button>
            </div>
          </fieldset>
        );
      })}
      <button
        type="button"
        className="border rounded-lg px-3 py-2"
        disabled={fields.length >= (depth ? 50 : 100)}
        onClick={add}
      >
        Agregar campo{depth ? " al elemento" : ""}
      </button>
    </div>
  );
}
