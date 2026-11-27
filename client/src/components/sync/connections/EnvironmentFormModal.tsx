import React, { useEffect, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { SyncEnvironmentDto, syncHubService } from '../../../services/sync-hub.service';

interface EnvironmentFormModalProps {
  isOpen: boolean;
  editingEnvironment: SyncEnvironmentDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EnvironmentFormModal: React.FC<EnvironmentFormModalProps> = ({
  isOpen,
  editingEnvironment,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('2.0.0');
  const [status, setStatus] = useState<SyncEnvironmentDto['status']>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingEnvironment) {
      setName(editingEnvironment.name);
      setDescription(editingEnvironment.description || '');
      setUrl(editingEnvironment.url || '');
      setVersion(editingEnvironment.version || '2.0.0');
      setStatus(editingEnvironment.status);
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setVersion('2.0.0');
      setStatus('active');
    }
  }, [isOpen, editingEnvironment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, description, url: url || undefined, version, status };
      const res = editingEnvironment
        ? await syncHubService.updateEnvironment(editingEnvironment.id, payload)
        : await syncHubService.createEnvironment(payload);

      if (!res.success) {
        setError(res.message || 'No se pudo guardar el entorno');
        return;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al guardar el entorno');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEnvironment ? 'Editar Entorno' : 'Nuevo Entorno'}
              </h3>
              <p className="text-xs text-slate-500">Agrupa conexiones por ciclo de despliegue</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Entorno
            </label>
            <input
              required
              type="text"
              placeholder="Ej: Production, QA Europa, Sandbox ERP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                URL Base (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://api.empresa.es"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SyncEnvironmentDto['status'])}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="active">Activo</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
            >
              {saving ? 'Guardando...' : 'Guardar Entorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
