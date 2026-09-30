import React, { useEffect, useState } from "react";
import { systemService } from "../services/api";
import { HealthResponse } from "../types";
import { CheckCircle2, AlertCircle, RefreshCw, Database, Server } from "lucide-react";

export const SystemHealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemService.getHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el backend FastAPI");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Estado del Backend FastAPI</h3>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          title="Recargar estado"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !health ? (
        <div className="text-xs text-slate-500 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></span>
          Verificando servicios backend y SQLite...
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-2.5 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Backend Desconectado</p>
            <p className="text-red-600">{error}</p>
            <p className="mt-1 text-[11px] text-red-500">Ejecuta: <code>scripts/dev.ps1</code> o <code>uvicorn app.main:app</code></p>
          </div>
        </div>
      ) : health ? (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Estado General:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Base de Datos:</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              {health.system.database.toUpperCase()} ({health.checks.database})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Versión Core:</span>
            <span className="font-mono text-slate-700">v{health.system.version} ({health.system.environment})</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Almacenamiento Local:</span>
            <span>{health.checks.uploads_dir && health.checks.generated_dir ? "✓ Carpetas listas" : "Pendiente"}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};