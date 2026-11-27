import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, History, X, XCircle } from 'lucide-react';
import {
  SyncOperationDto,
  SyncTaskExecutionDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface SyncTaskHistoryModalProps {
  isOpen: boolean;
  taskId: string | null;
  taskName: string;
  onClose: () => void;
}

export const SyncTaskHistoryModal: React.FC<SyncTaskHistoryModalProps> = ({
  isOpen,
  taskId,
  taskName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<SyncTaskExecutionDto[]>([]);
  const [operations, setOperations] = useState<SyncOperationDto[]>([]);

  useEffect(() => {
    if (!isOpen || !taskId) return;
    setLoading(true);
    syncHubService
      .getTaskHistory(taskId)
      .then((res) => {
        setExecutions(res.executions || []);
        setOperations(res.operations || []);
      })
      .finally(() => setLoading(false));
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Historial de Ejecuciones — {taskName}
              </h3>
              <p className="text-xs text-slate-500">
                Auditoría real persistida en base de datos ({executions.length} ejecuciones, {operations.length} operaciones)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Esta tarea aún no tiene ejecuciones registradas. Pulsa «Ejecutar» para iniciar su primer ciclo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {exec.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                      )}
                      <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-100">
                        {exec.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">
                        trigger:{exec.triggerType}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(exec.startedAt).toLocaleString()} · {exec.durationMs != null ? `${exec.durationMs}ms` : 'En curso'}
                    </span>
                  </div>

                  {exec.summary && (
                    <p className="text-xs text-slate-700 dark:text-slate-300">{exec.summary}</p>
                  )}
                  {exec.errorMessage && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{exec.errorMessage}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
                    <span>Procesados: {exec.recordsProcessed}</span>
                    <span className="text-emerald-600">Éxitos: {exec.recordsSucceeded}</span>
                    <span className="text-rose-600">Fallos: {exec.recordsFailed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
