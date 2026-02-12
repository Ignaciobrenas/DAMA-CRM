import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Calendar,
  FileText,
  CheckSquare,
  Clock,
  Plus,
  Sliders,
  MessageSquare,
  Building2,
  User,
  CheckCircle2,
  Circle,
  Save,
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'CONTACT' | 'DEAL';
  entityId: string;
  title: string;
  subtitle?: string;
  extraBadge?: string;
  omniMessages?: any[];
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  title,
  subtitle,
  extraBadge,
  omniMessages = [],
}) => {
  const [activeTab, setActiveTab] = useState<'activities' | 'customFields' | 'messages'>('activities');
  
  // Activities state
  const [activities, setActivities] = useState<any[]>([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activityType, setActivityType] = useState<'CALL' | 'MEETING' | 'NOTE' | 'TASK'>('CALL');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 16));
  const [durationMinutes, setDurationMinutes] = useState('15');

  // Custom Fields state
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    // Load Activities
    const queryParam = entityType === 'CONTACT' ? `contactId=${entityId}` : `dealId=${entityId}`;
    apiRequest(`/activities?${queryParam}`).then((res) => {
      if (res.success) setActivities(res.data || []);
    });

    // Load Custom Fields Definitions & Current Values
    Promise.all([
      apiRequest(`/custom-fields?entity=${entityType}`),
      apiRequest(`/custom-fields/entity/${entityId}`),
    ]).then(([fieldsRes, valuesRes]) => {
      if (fieldsRes.success && fieldsRes.data) {
        setFieldDefinitions(fieldsRes.data);
      }
      if (valuesRes.success && valuesRes.data) {
        const valMap: Record<string, string> = {};
        valuesRes.data.forEach((v: any) => {
          valMap[v.customFieldId] = v.value;
        });
        setFieldValues(valMap);
      }
    });
  }, [isOpen, entityId, entityType]);

  if (!isOpen) return null;

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle) return;

    const payload: any = {
      type: activityType,
      title: activityTitle,
      description: activityDesc || null,
      scheduledAt: activityDate ? new Date(activityDate).toISOString() : new Date().toISOString(),
      durationMinutes: parseInt(durationMinutes) || null,
    };

    if (entityType === 'CONTACT') payload.contactId = entityId;
    if (entityType === 'DEAL') payload.dealId = entityId;

    const res = await apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setActivities([res.data, ...activities]);
      setIsAddingActivity(false);
      setActivityTitle('');
      setActivityDesc('');
    }
  };

  const handleToggleActivity = async (id: string, currentStatus: boolean) => {
    const res = await apiRequest(`/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted: !currentStatus }),
    });
    if (res.success && res.data) {
      setActivities(activities.map((a) => (a.id === id ? res.data : a)));
    }
  };

  const handleSaveCustomFields = async () => {
    setIsSavingFields(true);
    setSaveStatus(null);

    const valuesPayload = Object.entries(fieldValues).map(([customFieldId, value]) => ({
      customFieldId,
      value,
    }));

    const res = await apiRequest(`/custom-fields/entity/${entityId}`, {
      method: 'POST',
      body: JSON.stringify({ values: valuesPayload }),
    });

    setIsSavingFields(false);
    if (res.success) {
      setSaveStatus('Guardado correctamente');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'MEETING':
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      case 'NOTE':
        return <FileText className="w-3.5 h-3.5 text-amber-500" />;
      case 'TASK':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-gray-200 dark:border-slate-800 p-6 flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
              {extraBadge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  {extraBadge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-1 p-1 mt-3 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'activities'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Actividades ({activities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('customFields')}
            className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center space-x-1.5 ${
              activeTab === 'customFields'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Campos Meta</span>
          </button>
          {entityType === 'CONTACT' && (
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'messages'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mensajes ({omniMessages.length})</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* TAB 1: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Timeline de Interacciones
                </span>
                <button
                  onClick={() => setIsAddingActivity(!isAddingActivity)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingActivity ? 'Cancelar' : 'Registrar'}</span>
                </button>
              </div>

              {/* Quick Add Activity Form */}
              {isAddingActivity && (
                <form
                  onSubmit={handleCreateActivity}
                  className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex space-x-1 text-xs">
                    {(['CALL', 'MEETING', 'NOTE', 'TASK'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivityType(t)}
                        className={`flex-1 py-1 rounded text-center font-semibold transition-colors ${
                          activityType === t
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        {t === 'CALL' ? 'Llamada' : t === 'MEETING' ? 'Reunión' : t === 'NOTE' ? 'Nota' : 'Tarea'}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Título de la actividad..."
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />

                  <textarea
                    placeholder="Detalles, resumen o acuerdos..."
                    rows={2}
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">Duración (min)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                    >
                      Guardar Actividad
                    </button>
                  </div>
                </form>
              )}

              {/* Activities List */}
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                    No hay actividades registradas todavía.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 rounded-xl space-y-1.5 hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleActivity(act.id, act.isCompleted)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                          >
                            {act.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div className="flex items-center space-x-1.5">
                            {getActivityIcon(act.type)}
                            <span
                              className={`text-xs font-semibold ${
                                act.isCompleted
                                  ? 'line-through text-gray-400 dark:text-slate-500'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {act.title}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {new Date(act.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>

                      {act.description && (
                        <p className="text-xs text-gray-600 dark:text-slate-300 pl-6">{act.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 pl-6 pt-1 border-t border-gray-100 dark:border-slate-800">
                        <span>
                          {act.user ? `Por ${act.user.name}` : 'Registrado'}
                          {act.durationMinutes ? ` • ${act.durationMinutes} min` : ''}
                        </span>
                        <span className="uppercase tracking-wider font-semibold text-[9px]">
                          {act.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC CUSTOM FIELDS */}
          {activeTab === 'customFields' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Metadatos Personalizados
                </span>
                <button
                  onClick={handleSaveCustomFields}
                  disabled={isSavingFields || fieldDefinitions.length === 0}
                  className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md shadow-xs transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingFields ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>

              {saveStatus && (
                <div className="p-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                  {saveStatus}
                </div>
              )}

              {fieldDefinitions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                  No se han configurado campos adicionales para {entityType}. Configúralos en Ajustes o mediante API.
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldDefinitions.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                        <span>{field.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {field.key} ({field.type})
                        </span>
                      </label>

                      {field.type === 'TEXT' && (
                        <input
                          type="text"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                        />
                      )}

                      {field.type === 'NUMBER' && (
                        <input
                          type="number"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                        />
                      )}

                      {field.type === 'DATE' && (
                        <input
                          type="date"
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                        />
                      )}

                      {field.type === 'BOOLEAN' && (
                        <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={fieldValues[field.id] === 'true'}
                            onChange={(e) =>
                              setFieldValues({
                                ...fieldValues,
                                [field.id]: e.target.checked ? 'true' : 'false',
                              })
                            }
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          <span>Habilitado / Marcado</span>
                        </label>
                      )}

                      {field.type === 'SELECT' && (
                        <select
                          value={fieldValues[field.id] || ''}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                        >
                          <option value="">-- Seleccionar opción --</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OMNICHANNEL MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                Conversaciones WhatsApp / Email
              </span>

              {omniMessages && omniMessages.length > 0 ? (
                omniMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      msg.direction === 'INBOUND'
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white mr-6'
                        : 'bg-blue-600 text-white ml-6'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>
                        {msg.channel} ({msg.direction})
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p>{msg.content}</p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Sin interacciones registradas para este contacto.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
