import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { RequireAuth } from "../features/auth/RequireAuth";
import { LandingPage } from "../features/landing/LandingPage";
import { ProjectPanelPage } from "../features/admin/ProjectPanelPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ClientsPage } from "../features/clients/ClientsPage";
import { CasesPage } from "../features/cases/CasesPage";
import { FieldsPage } from "../features/fields/FieldsPage";
import { TemplatesPage } from "../features/templates/TemplatesPage";
import { DocumentsPage } from "../features/documents/DocumentsPage";
import { ExperimentPage } from "../features/experiment/ExperimentPage";
import { FilesPage } from "../features/files/FilesPage";
import { DraftEditorPage } from "../features/editor/DraftEditorPage";
import { GuidePage } from "../features/guide/GuidePage";

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/panel"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/proyecto"
        element={
          <RequireAuth adminOnly>
            <ProjectPanelPage />
          </RequireAuth>
        }
      />
      <Route
        path="/clientes"
        element={
          <RequireAuth permission="clients:read">
            <ClientsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/expedientes"
        element={
          <RequireAuth permission="cases:read">
            <CasesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/plantillas"
        element={
          <RequireAuth permission="templates:read">
            <TemplatesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/documentos"
        element={
          <RequireAuth permission="documents:read">
            <DocumentsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tesis"
        element={
          <RequireAuth permission="experiment:read">
            <ExperimentPage />
          </RequireAuth>
        }
      />
      <Route
        path="/archivos"
        element={
          <RequireAuth permission="files:read">
            <FilesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/editor"
        element={
          <RequireAuth permission="cases:update">
            <DraftEditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/guia"
        element={
          <RequireAuth>
            <GuidePage />
          </RequireAuth>
        }
      />
      <Route
        path="/formularios"
        element={
          <RequireAuth permission="templates:read">
            <FieldsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
