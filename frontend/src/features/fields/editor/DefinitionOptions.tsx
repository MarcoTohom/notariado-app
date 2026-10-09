import { FieldDefinition } from "../types";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
import { ReactNode } from "react";
import { DefinitionPatch, label, textControl, optionControl } from "./sectionControls";
export function DefinitionOptions({ definition: f, fields, onChange, children }: { definition: FieldDefinition; fields: FieldDefinition[]; onChange: DefinitionPatch; children?: ReactNode }) {
  const options = f.options_json || {};
  const optionPatch = optionControl(f, onChange);
  const text = textControl(f, onChange);
  return <>
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
    {children}
    {f.field_type === "relation" && (
      <div className="space-y-3">
        {label(
          "Buscar en",
          <select
            className={inputClass}
            value={f.source}
            onChange={(e) =>
              onChange({
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
  </>;
}
