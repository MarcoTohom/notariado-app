import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export const AppLayout: React.FC = () => {
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
