import { Controller, useFormContext } from "react-hook-form";
import { ControlProps, DynamicFieldsProps } from "./controls/types";
import {
  TextInput,
  NameInput,
  DpiInput,
  NitInput,
  PhoneInput,
  EmailInput,
  IntegerInput,
  DecimalInput,
  PercentageInput,
  CurrencyInput,
  DateInput,
  DateTimeInput,
  BooleanInput,
  ComputedInput,
} from "./controls/BasicInputs";
import { TextArea, RichTextInput } from "./controls/TextInputs";
import { SelectInput } from "./controls/SelectInput";
import { RelationInput } from "./controls/RelationInput";
import { FileInput } from "./controls/FileInput";
import { ListInput } from "./controls/ListInput";

function ListControl(p: ControlProps) {
  return <ListInput {...p} renderFields={DynamicFields} />;
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
  list: ListControl,
  computed: ComputedInput,
  richtext: RichTextInput,
};
export function DynamicFields({
  fields,
  prefix = "",
  caseId,
  versionId,
  disabled = false,
}: DynamicFieldsProps) {
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
