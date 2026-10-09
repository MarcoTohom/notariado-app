import { FieldDefinition } from "../types";
export const newField = (index: number): FieldDefinition => ({
  key: `campo_${index}`,
  label: `Campo ${index}`,
  field_type: "text",
  display_order: index,
  nullable: true,
  active: true,
});
