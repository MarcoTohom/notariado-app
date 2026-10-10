import { useContext, useState } from "react";
import { ControlProps } from "./types";
import { FileActivityContext } from "./FileActivityContext";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { fieldsApi } from "../api";
export function FileInput(p: ControlProps) {
  const fileActivity = useContext(FileActivityContext);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const opts = p.definition.options_json;
  const upload = async (file?: File) => {
    if (!file) return;
    setError("");
    if (
      file.size > (opts?.max_bytes ?? 10485760) ||
      !(opts?.extensions || [".pdf", ".docx", ".xlsx", ".csv"]).some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      )
    ) {
      setError("Archivo demasiado grande o extensión no permitida.");
      return;
    }
    setBusy(true);
    fileActivity?.(1);
    try {
      const saved = await fieldsApi.upload(p.caseId, p.versionId, p.name, file);
      p.onChange(saved.id);
      p.onBlur();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
      fileActivity?.(-1);
    }
  };
  return (
    <div className="space-y-2">
      <input
        type="file"
        className="w-full max-w-full text-sm"
        id={p.id}
        name={p.name}
        disabled={p.disabled || busy}
        accept={(opts?.extensions || [".pdf", ".docx", ".xlsx", ".csv"]).join(
          ",",
        )}
        aria-describedby={p.describedBy}
        aria-invalid={p.invalid}
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {busy && <p role="status">Cargando archivo…</p>}
      {p.value ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              fieldsApi
                .download(p.caseId, String(p.value))
                .catch((e) => setError(getApiErrorMessage(e)))
            }
          >
            Descargar archivo
          </button>
          <button
            type="button"
            disabled={p.disabled || busy}
            onClick={() => p.onChange("")}
          >
            Desvincular
          </button>
        </div>
      ) : null}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
