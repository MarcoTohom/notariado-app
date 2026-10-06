import React, { useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginModal } from "./components/LoginModal";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ClientsPage } from "./features/clients/ClientsPage";
import { CasesPage } from "./features/cases/CasesPage";
import { FieldsPage } from "./features/fields/FieldsPage";
import { TemplatesPage } from "./features/templates/TemplatesPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { Loader2, LockKeyhole, ShieldX, LogIn } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

/** Layout principal: barra de navegación + contenido + pie de página. */
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Sistema de Borradores de Escrituras Públicas • Tesis de Grado UMG • Marco Antonio Lares Tohom</p>
      </footer>
    </div>
  );
};

interface RequireAuthProps {
  /** Permiso granular requerido (matriz RBAC, ej. "clients:read"). */
  permission?: string;
  children: React.ReactNode;
}

/**
 * Guardián de rutas privadas: exige sesión activa y, opcionalmente,
 * un permiso granular de la matriz RBAC.
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ permission, children }) => {
  const { user, loading, hasPermission } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Verificando sesión…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LockKeyhole className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Módulo protegido</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Esta sección requiere autenticación. Inicia sesión con una cuenta del bufete para continuar.
        </p>
        <button
          onClick={() => setLoginOpen(true)}
          className="mt-5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          Iniciar Sesión
        </button>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acceso restringido</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Tu rol <span className="font-mono font-semibold">{user.role}</span> no cuenta con el permiso{" "}
          <span className="font-mono font-semibold">{permission}</span> requerido para este módulo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
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
              <Route path="/formularios" element={<RequireAuth permission="templates:read"><FieldsPage /></RequireAuth>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
