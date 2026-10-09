import { ReactNode } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ControlProps, DynamicFieldsProps } from "./types";
import { defaults } from "../validation";
export function ListInput({ renderFields: DynamicFields, ...p }: ControlProps & { renderFields: (props: DynamicFieldsProps) => ReactNode }) {
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
