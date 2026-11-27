import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface MassTestSummary {
  total: number;
  passed: number;
  failed: number;
  avgLatencyMs: number;
  results: Record<string, { success: boolean; message: string; latencyMs: number }>;
}

interface MassDiagnosticBannerProps {
  summary: MassTestSummary | null;
  onClose: () => void;
}

export const MassDiagnosticBanner: React.FC<MassDiagnosticBannerProps> = ({ summary, onClose }) => {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border shadow-sm ${
        summary.failed === 0
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-2.5 rounded-xl text-white shrink-0 ${
              summary.failed === 0 ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            {summary.failed === 0 ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {summary.failed === 0
                  ? 'Diagnóstico Masivo Exitoso: Conexiones al 100%'
                  : `Diagnóstico API: ${summary.passed} Exitosas / ${summary.failed} Con Error`}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Ping Medio: {summary.avgLatencyMs} ms
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {summary.failed === 0
                ? `Todas las ${summary.passed} integraciones auditadas respondieron con estado 200 OK y confirmación de handshake.`
                : `Se han detectado ${summary.failed} conexiones con respuesta errónea o falta de clave API. Haz clic en 'Configurar' para corregirlas.`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold underline self-start md:self-auto"
        >
          Cerrar informe
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
        {Object.entries(summary.results).map(([connId, res]) => (
          <div
            key={connId}
            className={`p-2 rounded-xl border text-xs flex flex-col justify-between ${
              res.success
                ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold uppercase text-[10px] text-slate-800 dark:text-slate-200 truncate">
                {connId}
              </span>
              <span className={`w-2 h-2 rounded-full ${res.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={
                  res.success
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-rose-700 dark:text-rose-400 font-bold'
                }
              >
                {res.success ? 'OK' : 'Error'}
              </span>
              <span className="font-mono text-slate-400">{res.latencyMs}ms</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
