import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle, XCircle, Clock, Zap, Plus, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const Workflows: React.FC = () => {
  const { t } = useLanguage();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [resWorkflows, resLogs] = await Promise.all([
      apiRequest('/workflows'),
      apiRequest('/workflows/logs/all'),
    ]);

    if (resWorkflows.success) setWorkflows(resWorkflows.data || []);
    if (resLogs.success) setLogs(resLogs.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestRun = async (id: string) => {
    setTestResult('Disparando evento de prueba en segundo plano...');
    const res = await apiRequest(`/workflows/${id}/test`, { method: 'POST' });
    if (res.success) {
      setTestResult(`⚡ ${res.message}`);
      setTimeout(() => loadData(), 500);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await apiRequest(`/workflows/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !current }),
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('workflows')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Motor de reglas automatizadas en segundo plano (Disparadores 'Si X ocurre → Haz Y')
        </p>
      </div>

      {testResult && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>{testResult}</span>
          <button onClick={() => setTestResult('')} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Workflows Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {wf.name}
                  </h3>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">
                    Disparador: <span className="font-mono text-purple-600 dark:text-purple-400">{wf.trigger}</span>
                  </span>
                </div>
              </div>

              {/* Active Switch */}
              <button
                onClick={() => handleToggle(wf.id, wf.isActive)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  wf.isActive ? 'bg-blue-600 justify-end' : 'bg-gray-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-300">
              {wf.description}
            </p>

            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 text-[11px] font-mono space-y-1">
              <div><span className="text-gray-400">Acción:</span> <span className="text-blue-600 dark:text-blue-400 font-semibold">{wf.action}</span></div>
              <div><span className="text-gray-400">Ejecuciones totales:</span> <span className="text-gray-800 dark:text-slate-200 font-semibold">{wf.executionCount}</span></div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">
                Última vez: {wf.lastExecutedAt ? new Date(wf.lastExecutedAt).toLocaleTimeString() : 'Nunca'}
              </span>
              <button
                onClick={() => handleTestRun(wf.id)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 hover:bg-purple-100 transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Probar Ahora</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Logs Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white">Registro de Ejecuciones en Segundo Plano</h2>
          <button onClick={loadData} className="text-[11px] text-blue-600 hover:underline">Actualizar</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Workflow</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Resultado</th>
                <th className="px-4 py-2.5 text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">
                    {log.workflow?.name}
                  </td>
                  <td className="px-4 py-2">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center text-emerald-600 font-semibold text-[10px]">
                        <CheckCircle className="w-3 h-3 mr-1" /> Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600 font-semibold text-[10px]">
                        <XCircle className="w-3 h-3 mr-1" /> Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-[10px] text-gray-500 max-w-xs truncate">
                    {log.resultData || '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-[11px] text-gray-400">
                    {new Date(log.executedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
