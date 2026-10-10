import { FieldDefinition } from "../types";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
import { DefinitionPatch, label, textControl, optionControl } from "./sectionControls";
export function DefinitionRestrictions({ definition: f, fields, onChange }: { definition: FieldDefinition; fields: FieldDefinition[]; onChange: DefinitionPatch }) {
  const options = f.options_json || {};
  const optionPatch = optionControl(f, onChange);
  const text = textControl(f, onChange);
  return (
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
              onChange({
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
                onChange({
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
                onChange({
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
  );
}
