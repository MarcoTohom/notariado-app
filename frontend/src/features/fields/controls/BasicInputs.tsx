import { ControlProps } from "./types";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
import { normalizeText, maskDigits, fixedMoney, displayMoney } from "../validation";
export const textValue = (value: unknown) => (value == null ? "" : String(value));
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
