import axios from "axios";

/** Extrae un mensaje de error desde respuestas FastAPI. */
export const getApiErrorMessage = (err: unknown, fallback = "Ocurrió un error inesperado."): string => {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim() !== "") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d: { msg?: string }) => d.msg ?? JSON.stringify(d))
        .join(" ");
    }
    if (err.response?.status === 403) return "No tienes permisos para realizar esta acción.";
    if (err.message && !err.response) return "No se pudo conectar con el servidor.";
  }
  return fallback;
};
