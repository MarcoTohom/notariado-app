import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("notariado_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Nombre de archivo sugerido por el backend a partir de `Content-Disposition`.
 *
 * FastAPI codifica los nombres no ASCII con `filename*=UTF-8''<valor>`, y el
 * `filename=` plano llega con caracteres literales. Se prioriza la forma
 * UTF-8 y se aplica el mismo criterio que en la descarga de adjuntos.
 */
export const filenameFromDisposition = (disposition: string | undefined): string | null => {
  if (!disposition) return null;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      return utf8;
    }
  }
  return disposition.match(/filename="([^"]+)"/i)?.[1] ?? disposition.match(/filename=([^;]+)/i)?.[1] ?? null;
};

/**
 * Normaliza rutas de descarga entregadas por la API.
 *
 * El backend devuelve rutas con el prefijo `/api/v1/...` y axios las concatena
 * a `baseURL`, que ya vale `/api/v1`. Sin retirar el prefijo se solicitaría
 * `/api/v1/api/v1/...` y el backend respondería 404. Se aceptan las dos formas
 * (con y sin prefijo) para no depender del esquema que devuelva la API.
 */
export const normalizeDownloadUrl = (url: string): string => {
  const path = url.startsWith("http") ? url : url.startsWith("/") ? url : `/${url}`;
  if (path.startsWith("http")) return path;

  const base = String(apiClient.defaults.baseURL || "/api/v1").replace(/\/$/, "");
  // La ruta ya trae el prefijo del backend y axios añadiría otro: 404 seguro.
  return base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
};

/**
 * Descarga un archivo protegido por JWT.
 *
 * Un `<a href download>` no envía la cabecera `Authorization`, por lo que el
 * backend responde 401 y el navegador guarda en su lugar un archivo de error
 * o nada. Aquí se pide el binario con el cliente autenticado y se dispara la
 * descarga mediante un enlace temporal, que es el mismo mecanismo que usan
 * los adjuntos de campos.
 */
export const downloadAuthenticated = async (
  url: string,
  fallbackName: string,
): Promise<void> => {
  const response = await apiClient.get<Blob>(normalizeDownloadUrl(url), {
    responseType: "blob",
  });

  // Un 404 o un 401 pueden llegar como blob JSON (axios no lanza si el estado
  // es 200): se reporta el detalle real del backend en lugar de un error
  // genérico, para que el usuario sepa si es permisos o un archivo ausente.
  const contentType = String(response.headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    const text = await response.data.text();
    let message = "No se pudo descargar el archivo.";
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (typeof parsed.detail === "string") message = parsed.detail;
    } catch {
      /* respuesta no JSON: se conserva el mensaje por defecto */
    }
    throw new Error(message);
  }

  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download =
    filenameFromDisposition(String(response.headers["content-disposition"] || "")) ??
    fallbackName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
