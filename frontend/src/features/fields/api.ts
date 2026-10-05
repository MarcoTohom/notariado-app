import { apiClient } from "../../services/api";
import {
  FieldDefinition,
  FormVersion,
  SavedValues,
  ValidationResult,
  Values,
} from "./types";

const base = "/fields";
const casePath = (caseId: string, versionId: string) =>
  `${base}/cases/${caseId}/versions/${versionId}`;
export const fieldsApi = {
  versions: async (caseType?: string): Promise<FormVersion[]> =>
    (
      await apiClient.get(`${base}/versions`, {
        params: { case_type: caseType },
      })
    ).data,
  create: async (
    name: string,
    caseType: string,
    fields: FieldDefinition[],
  ): Promise<FormVersion> =>
    (
      await apiClient.post(`${base}/definitions`, {
        name,
        case_type: caseType,
        fields,
      })
    ).data,
  revise: async (
    templateId: string,
    fields: FieldDefinition[],
  ): Promise<FormVersion> =>
    (
      await apiClient.post(`${base}/definitions/${templateId}/versions`, {
        fields,
      })
    ).data,
  load: async (caseId: string, versionId: string): Promise<SavedValues> =>
    (await apiClient.get(casePath(caseId, versionId))).data,
  validate: async (
    caseId: string,
    versionId: string,
    values: Values,
  ): Promise<ValidationResult> =>
    (
      await apiClient.post(`${casePath(caseId, versionId)}/validate`, {
        values,
      })
    ).data,
  save: async (
    caseId: string,
    versionId: string,
    values: Values,
    revision: number,
  ): Promise<SavedValues> =>
    (await apiClient.put(casePath(caseId, versionId), { values, revision }))
      .data,
  upload: async (
    caseId: string,
    versionId: string,
    field: string,
    file: File,
  ): Promise<{ id: string; name: string }> => {
    const body = new FormData();
    body.append("file", file);
    return (
      await apiClient.post(`${casePath(caseId, versionId)}/files`, body, {
        params: { field },
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },
  download: async (caseId: string, id: string): Promise<void> => {
    const response = await apiClient.get(
      `${base}/cases/${caseId}/files/${id}`,
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    const disposition = String(response.headers["content-disposition"] || "");
    const utfName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    link.download = utfName
      ? decodeURIComponent(utfName)
      : disposition.match(/filename="([^"]+)"/)?.[1] || "archivo";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
