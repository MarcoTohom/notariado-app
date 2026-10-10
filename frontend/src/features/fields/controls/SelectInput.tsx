import { ControlProps } from "./types";
import { textValue } from "./BasicInputs";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
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
