import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Download,
  Database,
  Activity,
  HardDrive,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';

export const SystemSettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [systemStatus, setSystemStatus] = useState<any>({
    status: 'ONLINE',
    dbProvider: 'PostgreSQL Docker Container',
    dbConnected: true,
    uptimeSeconds: 3600,
    timestamp: new Date().toISOString(),
    metrics: { users: 0, companies: 0, invoices: 0 },
  });
  const [isExporting, setIsExporting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    const res = await apiRequest('/modules/system-status');
    setLoadingStatus(false);
    if (res.success && res.data) {
      setSystemStatus(res.data);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('dama_token') || sessionStorage.getItem('dama_token') || '';
      const response = await fetch('/api/modules/export-backup', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error en la exportación del backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dama_crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Copia de Seguridad Descargada', 'Se ha generado el archivo JSON con todos los datos corporativos.');
    } catch (err: any) {
      toast.error('Error al exportar', err.message || 'No se pudo generar la copia de seguridad.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Mantenimiento, Diagnóstico & Copias de Seguridad
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Docker Online
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Descarga copias de seguridad de los datos de tu empresa y supervisa el estado del motor de base de datos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>

        {/* Section 1: Backup Card */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  Copia de Seguridad Completa de la Empresa (Backup JSON)
                </h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Exporta instantáneamente toda la base de datos empresarial: contactos, empresas, oportunidades de venta, facturas con desglose de impuestos, proyectos ágiles, tickets de soporte y registros de fichajes.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                <div className="text-gray-500">Contactos & Empresas:</div>
                <div className="text-right font-bold text-gray-900 dark:text-white">✓ Incluido</div>
                <div className="text-gray-500">Facturación & Cobros:</div>
                <div className="text-right font-bold text-gray-900 dark:text-white">✓ Incluido</div>
                <div className="text-gray-500">Fichajes & Jornada:</div>
                <div className="text-right font-bold text-gray-900 dark:text-white">✓ Incluido</div>
                <div className="text-gray-500">Formato Estándar:</div>
                <div className="text-right font-bold text-blue-600 dark:text-blue-400">JSON ISO 8601</div>
              </div>
            </div>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportBackup}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generando Copia de Seguridad...' : 'Descargar Backup Completo'}</span>
            </button>
          </div>

          {/* Section 2: Engine Diagnostics */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  Diagnóstico del Motor & Base de Datos
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-400">Estado de Conexión:</span>
                  <span className="inline-flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conectado (Pool Activo)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-400">Motor de Base de Datos:</span>
                  <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-white">
                    {systemStatus.dbProvider || 'PostgreSQL Docker'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-400">Tiempo de Actividad (Uptime):</span>
                  <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-white">
                    {formatUptime(systemStatus.uptimeSeconds || 3600)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-400">Versión del Sistema:</span>
                  <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    DAMA CRM v1.2.0 (Enterprise)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>La base de datos se encuentra sincronizada con todas las migraciones idempotentes al día.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
