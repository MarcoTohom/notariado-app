/** Utilidades de presentación compartidas. */

export const formatBytes = (bytes?: number | null): string => {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-GT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const shortHash = (hash?: string | null, length = 12): string => {
  if (!hash) return "—";
  return `${hash.slice(0, length)}…`;
};
