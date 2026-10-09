import { FieldDefinition } from "../types";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
import { FIELD_TYPES, TYPE_LABELS } from "../types";
import { newField } from "./defaults";
import { DefinitionPatch, label } from "./sectionControls";
export function DefinitionSettings({ definition: f, depth, onChange }: { definition: FieldDefinition; depth: number; onChange: DefinitionPatch }) {
  return <>
    <div className="grid sm:grid-cols-3 gap-3">
      {label(
        "Etiqueta",
        <input
          className={inputClass}
          value={f.label}
          onChange={(e) => onChange({ label: e.target.value })}
        />,
      )}
      {label(
        "Clave del campo",
        <input
          className={inputClass}
          value={f.key}
          onChange={(e) => onChange({ key: e.target.value })}
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
            onChange({
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
            onChange={(e) => onChange({ [key]: e.target.checked })}
          />
          {title}
        </label>
      ))}
    </div>
  </>;
}
