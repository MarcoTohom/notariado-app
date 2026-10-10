import { ReactNode } from "react";
import { FieldDefinition } from "../types";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
export type DefinitionPatch = (changes: Partial<FieldDefinition>) => void;
export const label = (title: string, control: ReactNode) => (
  <label key={title} className="block text-sm space-y-1"><span>{title}</span>{control}</label>
);
export const textControl = (f: FieldDefinition, onChange: DefinitionPatch) => (title: string, key: keyof FieldDefinition, type = "text") =>
  label(title, <input type={type} className={inputClass} value={String(f[key] ?? "")} onChange={(e) => onChange({ [key]: e.target.value || null })} />);
export const optionControl = (f: FieldDefinition, onChange: DefinitionPatch) => (change: NonNullable<FieldDefinition["options_json"]>) =>
  onChange({ options_json: { ...(f.options_json || {}), ...change } });
