import { Modal, ModalBody } from "../../components/common/Modal";
import { ErrorNotice } from "../../components/common/Feedback";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Case } from "../cases/types";
import type { DocumentDetail } from "./types";
import { documentService } from "./api";
import { getApiErrorMessage } from "../../shared/api/errors";
import { templateService } from "../templates/api";
import { DocumentVersionsList } from "./DocumentVersionsList";
import { CASE_TYPE_LABELS } from "../../lib/labels";
import { FileOutput, Loader2, AlertTriangle } from "lucide-react";

interface GenerateDocumentModalProps {
  caseItem: Case | null;
  onClose: () => void;
}

/** Genera el borrador DOCX del expediente con la versión ACTIVA de la
 *  plantilla (o una elegida), mostrando la verificación post-generación. */
export const GenerateDocumentModal: React.FC<GenerateDocumentModalProps> = ({
  caseItem,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [templateVersionId, setTemplateVersionId] = useState("");
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentDetail | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["templates", "active", caseItem?.case_type],
    queryFn: () => templateService.getTemplates(0, 50, undefined, caseItem?.case_type),
    enabled: Boolean(caseItem),
  });

  useEffect(() => {
    setTemplateVersionId("");
    setNotes("");
    setActionError(null);
    setResult(null);
  }, [caseItem?.id]);

  // Preseleccionar la versión ACTIVA disponible.
  useEffect(() => {
    const withActive = (templatesQuery.data?.items ?? []).find((t) => t.active_version_id);
    if (withActive?.active_version_id) {
      setTemplateVersionId(withActive.active_version_id);
    }
  }, [templatesQuery.data]);

  const generateMutation = useMutation({
    mutationFn: () =>
      documentService.generate(
        caseItem?.id ?? "",
        templateVersionId || undefined,
        notes.trim() || undefined
      ),
    onSuccess: (detail) => {
      setResult(detail);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err) => {
      setResult(null);
      setActionError(getApiErrorMessage(err, "No se pudo generar el borrador."));
    },
  });

  if (!caseItem) return null;

  const activeTemplates = (templatesQuery.data?.items ?? []).filter(
    (t) => t.active_version_id
  );
  const latestVersion = result?.versions[0] ?? null;

  return (
    <Modal
      title={<>Generar Borrador DOCX</>}
      subtitle={<>{caseItem.case_number} • {CASE_TYPE_LABELS[caseItem.case_type]}</>}
      icon={<FileOutput className="w-5 h-5" />}
      onClose={onClose}
      size="2xl"
      subtitleClassName="font-mono"
    >

      {/* Cuerpo */}
      <ModalBody className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <label htmlFor="gen_template" className="block text-xs font-semibold text-slate-700 mb-1">
              Plantilla (versión ACTIVA)
            </label>
            <select
              id="gen_template"
              value={templateVersionId}
              onChange={(e) => setTemplateVersionId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {activeTemplates.length === 0 && (
                <option value="">Sin plantilla activa para este tipo</option>
              )}
              {activeTemplates.map((template) => (
                <option key={template.active_version_id} value={template.active_version_id ?? ""}>
                  {template.name}
                </option>
              ))}
            </select>
            {activeTemplates.length === 0 && (
              <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Carga y activa una plantilla DOCX en el módulo Plantillas antes de generar.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="gen_notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Notas de la versión (opcional)
            </label>
            <input
              id="gen_notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Primera revisión con el otorgante"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={!templateVersionId || generateMutation.isPending}
            className="w-full text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Renderizando y verificando…
              </>
            ) : (
              <>
                <FileOutput className="w-4 h-4" />
                Generar y verificar borrador
              </>
            )}
          </button>
        </div>

        {actionError && (
          <ErrorNotice className="whitespace-pre-line">
            {actionError}
          </ErrorNotice>
        )}

        {/* Resultado de la generación */}
        {result && latestVersion && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">
              Borrador generado — {result.title}
            </h4>
            <DocumentVersionsList versions={[latestVersion]} />
          </section>
        )}
      </ModalBody>
    </Modal>
  );
};
