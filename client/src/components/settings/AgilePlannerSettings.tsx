import React, { useState } from 'react';
import {
  Kanban,
  Clock,
  Bell,
  Shield,
  Sliders,
  Check,
  Save,
  Layers,
  AlertTriangle,
  Send,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { soundService } from '../../services/sound';

export const AgilePlannerSettings: React.FC = () => {
  const toast = useToast();

  const [settings, setSettings] = useState({
    defaultMethodology: 'scrum',
    defaultWipLimit: 5,
    autoArchiveCompleted: false,
    archiveDaysThreshold: 30,
    budgetAlertThreshold90: true,
    budgetAlertThreshold100: true,
    reminderFrequencyMinutes: 15,
    enableWebPush: true,
    enableEmailDigest: true,
    digestScheduleTime: '09:00',
    harvestAccountId: '',
    harvestAccessToken: '',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    soundService.play('action');

    try {
      // Simulate API call to save Agile Planner config
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Configuración de Agile Planner guardada correctamente');
      soundService.play('success');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Configuración de DAMA Agile Planner
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personaliza la metodología por defecto, alertas presupuestarias, recordatorios y sincronización de tareas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Metodología & Límites WIP */}
        <div className="bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/80 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            Parámetros del Tablero Ágil
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Metodología por Defecto
              </label>
              <select
                value={settings.defaultMethodology}
                onChange={(e) => setSettings({ ...settings, defaultMethodology: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="scrum">Scrum (Sprints + Backlog)</option>
                <option value="kanban">Kanban Flujo Continuo</option>
                <option value="hybrid">Híbrido Ágil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Límite Trabajo en Progreso (WIP) Recomendado
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.defaultWipLimit}
                onChange={(e) => setSettings({ ...settings, defaultWipLimit: parseInt(e.target.value, 10) || 5 })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Alertas de Presupuesto de Horas */}
        <div className="bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/80 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas de Presupuesto y Horas
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.budgetAlertThreshold90}
                onChange={(e) => setSettings({ ...settings, budgetAlertThreshold90: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">
                Notificar por email y push al alcanzar el <strong>90% del presupuesto de horas</strong> del tablero.
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.budgetAlertThreshold100}
                onChange={(e) => setSettings({ ...settings, budgetAlertThreshold100: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">
                Notificar inmediatamente al superar el <strong>100% del presupuesto asignado</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* Recordatorios y Notificaciones */}
        <div className="bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/80 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" />
            Recordatorios y Extensión de Navegador (VAPID Push)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Antelación de Alertas de Tarea (minutos)
              </label>
              <select
                value={settings.reminderFrequencyMinutes}
                onChange={(e) => setSettings({ ...settings, reminderFrequencyMinutes: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 minutos antes</option>
                <option value={15}>15 minutos antes</option>
                <option value={30}>30 minutos antes</option>
                <option value={60}>1 hora antes</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableWebPush}
                  onChange={(e) => setSettings({ ...settings, enableWebPush: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  Activar notificaciones Web Push nativas en Extensión Chrome/Firefox
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
