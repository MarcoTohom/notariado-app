import { useState } from "react";
import { FieldDefinition } from "./types";
import { newField } from "./editor/defaults";
import { DefinitionSettings } from "./editor/DefinitionSettings";
import { DefinitionOptions } from "./editor/DefinitionOptions";
import { DefinitionRestrictions } from "./editor/DefinitionRestrictions";

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
      {fields.map((f, index) => (
        <fieldset key={index} className="border rounded-xl p-4 bg-white space-y-3">
          <legend className="text-sm px-1">
            {index + 1}. {f.label}
          </legend>
          <DefinitionSettings definition={f} depth={depth} onChange={(changes) => patch(index, changes)} />
          <DefinitionOptions definition={f} fields={fields} onChange={(changes) => patch(index, changes)}>
            {f.field_type === "list" && (
              <FieldDefinitionEditor
                fields={f.options_json?.fields || []}
                onChange={(children) => patch(index, { options_json: { ...f.options_json, fields: children } })}
                depth={depth + 1}
              />
            )}
          </DefinitionOptions>
          <button
            type="button"
            className="text-sm text-brand-700"
            aria-expanded={expanded === index}
            onClick={() => setExpanded(expanded === index ? null : index)}
          >
            Restricciones y ayuda
          </button>
          {expanded === index && <DefinitionRestrictions definition={f} fields={fields} onChange={(changes) => patch(index, changes)} />}
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
      ))}
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
