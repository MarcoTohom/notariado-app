import { FieldDefinition } from "../types";
export interface ControlProps {
  definition: FieldDefinition;
  name: string;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  caseId: string;
  versionId: string;
  invalid?: boolean;
  describedBy?: string;
}
export interface DynamicFieldsProps {
  fields: FieldDefinition[];
  prefix?: string;
  caseId: string;
  versionId: string;
  disabled?: boolean;
}
