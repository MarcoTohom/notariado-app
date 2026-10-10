import { Modal, ModalBody } from "../../components/common/Modal";
import { LoadingState } from "../../components/common/Feedback";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { documentService } from "./api";
import { DocumentVersionsList } from "./DocumentVersionsList";
import { formatDateTime } from "../../lib/format";
import { FileText } from "lucide-react";

interface DocumentDetailModalProps {
  documentId: string | null;
  onClose: () => void;
}

/** Historial completo de versiones de un borrador con descarga autenticada. */
export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  documentId,
  onClose,
}) => {
  const detailQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => documentService.getDocument(documentId as string),
    enabled: Boolean(documentId),
  });

  if (!documentId) return null;
  const detail = detailQuery.data;

  return (
    <Modal
      title={<>{detail?.title ?? "Cargando…"}</>}
      subtitle={<>{detail?.case_number} • Creado {detail ? formatDateTime(detail.created_at) : "…"} • Versionamiento inmutable</>}
      icon={<FileText className="w-5 h-5" />}
      onClose={onClose}
      size="2xl"
    >

      {/* Cuerpo */}
      <ModalBody>
        {detailQuery.isLoading ? (
          <LoadingState className="py-16">

            <span className="text-xs">Cargando historial…</span>
          </LoadingState>
        ) : detail ? (
          <DocumentVersionsList versions={detail.versions} />
        ) : (
          <p className="py-16 text-center text-xs text-red-600">
            No se pudo cargar el documento.
          </p>
        )}
      </ModalBody>
    </Modal>
  );
};
