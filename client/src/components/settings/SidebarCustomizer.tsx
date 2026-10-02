import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GripVertical,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { soundService, SoundPreferences, DEFAULT_SOUND_PREFERENCES } from '../../services/sound';

interface SidebarItemDef {
  id: string;
  name: string;
  category: string;
  route: string;
}

const ALL_SIDEBAR_ITEMS: SidebarItemDef[] = [
  { id: 'dashboard', name: 'Panel Principal', category: 'PRINCIPAL & AGENDA', route: '/' },
  { id: 'calendar', name: 'Calendario & Agenda', category: 'PRINCIPAL & AGENDA', route: '/calendar' },
  { id: 'appointments', name: 'Citas & Servicios', category: 'PRINCIPAL & AGENDA', route: '/appointments' },
  { id: 'my-time', name: 'Mi Tiempo', category: 'PRINCIPAL & AGENDA', route: '/my-time' },
  { id: 'logistics', name: 'Logística & Envíos', category: 'PRINCIPAL & AGENDA', route: '/logistics' },

  { id: 'pipeline', name: 'Oportunidades & Pipeline', category: 'GESTIÓN COMERCIAL', route: '/pipeline' },
  { id: 'contacts', name: 'Contactos & Leads', category: 'GESTIÓN COMERCIAL', route: '/contacts' },
  { id: 'companies', name: 'Empresas & Cuentas', category: 'GESTIÓN COMERCIAL', route: '/companies' },
  { id: 'lead-capture', name: 'Captura de Leads', category: 'GESTIÓN COMERCIAL', route: '/lead-capture' },

  { id: 'invoicing', name: 'Facturación & Cobros', category: 'OPERACIONES & FINANZAS', route: '/invoicing' },
  { id: 'expenses', name: 'Gastos & Compras', category: 'OPERACIONES & FINANZAS', route: '/expenses' },
  { id: 'inventory', name: 'Inventario & Stock', category: 'OPERACIONES & FINANZAS', route: '/inventory' },
  { id: 'agile', name: 'Proyectos & Tareas', category: 'OPERACIONES & FINANZAS', route: '/agile' },
  { id: 'portal-empleado', name: 'Portal del Empleado', category: 'OPERACIONES & FINANZAS', route: '/portal-empleado' },

  { id: 'tickets', name: 'Mesa de Ayuda / Tickets', category: 'COMUNICACIÓN & SERVICIOS', route: '/tickets' },
  { id: 'omnichannel', name: 'Omnicanal / WhatsApp', category: 'COMUNICACIÓN & SERVICIOS', route: '/omnichannel' },
  { id: 'workflows', name: 'Flujos de Trabajo', category: 'COMUNICACIÓN & SERVICIOS', route: '/workflows' },
  { id: 'integrations', name: 'Conectores & Integraciones', category: 'COMUNICACIÓN & SERVICIOS', route: '/integrations' },

  { id: 'reports', name: 'Informes BI & Analytics', category: 'SISTEMA & RECURSOS', route: '/reports' },
  { id: 'settings', name: 'Configuración', category: 'SISTEMA & RECURSOS', route: '/settings' },
  { id: 'portal', name: 'Portal Cliente', category: 'SISTEMA & RECURSOS', route: '/portal' },
  { id: 'faq', name: 'Preguntas Frecuentes', category: 'SISTEMA & RECURSOS', route: '/faq' },
  { id: 'privacy', name: 'Política de Privacidad', category: 'SISTEMA & RECURSOS', route: '/privacy' },
];

export const SidebarCustomizer: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SidebarItemDef[]>(() => {
    const savedOrder = user?.preferences?.sidebarOrder;
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
      const ordered = [...ALL_SIDEBAR_ITEMS];
      ordered.sort((a, b) => {
        const idxA = savedOrder.indexOf(a.id);
        const idxB = savedOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      return ordered;
    }
    return ALL_SIDEBAR_ITEMS;
  });

  const [hiddenItems, setHiddenItems] = useState<string[]>(
    user?.preferences?.sidebarHiddenItems || []
  );

  const [soundPrefs, setSoundPrefs] = useState<SoundPreferences>(() => {
    const fromUser = user?.preferences?.soundPreferences;
    if (fromUser) {
      return { ...DEFAULT_SOUND_PREFERENCES, ...(fromUser as unknown as SoundPreferences) };
    }
    return soundService.getPreferences();
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleVisibility = (id: string) => {
    soundService.play('toggle');
    setHiddenItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    soundService.play('dragDrop');
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSoundToggle = (key: keyof SoundPreferences) => {
    const newStatus = !soundPrefs[key];
    soundService.play('toggle');
    const updated = { ...soundPrefs, [key]: newStatus };
    setSoundPrefs(updated);
    soundService.setCategoryEnabled(key, newStatus);
  };

  const testSound = (key: keyof SoundPreferences) => {
    soundService.play(key as any);
  };

  const handleReset = () => {
    soundService.play('action');
    setItems(ALL_SIDEBAR_ITEMS);
    setHiddenItems([]);
    setSoundPrefs(DEFAULT_SOUND_PREFERENCES);
    soundService.loadPreferences(DEFAULT_SOUND_PREFERENCES);
    toast.success('Configuración restablecida', 'Los módulos de la barra lateral y sonidos han vuelto a su orden predeterminado.');
  };

  const handleSaveToDB = async () => {
    setSaving(true);
    soundService.play('action');
    try {
      const orderIds = items.map((i) => i.id);
      const ok = await updatePreferences({
        sidebarOrder: orderIds,
        sidebarHiddenItems: hiddenItems,
        soundPreferences: soundPrefs as unknown as Record<string, boolean>,
      });

      if (ok) {
        soundService.play('success');
        toast.success(
          'Personalización guardada',
          'El orden de los módulos y las preferencias de sonido han sido persisitidas en la base de datos.'
        );
      } else {
        soundService.play('error');
        toast.error('Error', 'No se pudo guardar la configuración en la base de datos.');
      }
    } catch (err: any) {
      soundService.play('error');
      toast.error('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const soundCatalog: Array<{ key: keyof SoundPreferences; label: string; desc: string }> = [
    { key: 'action', label: 'Acciones & Clics', desc: 'Sonido sutil al interactuar con botones y tarjetas' },
    { key: 'success', label: 'Éxito & Guardado', desc: 'Acorde alegre al completar una operación' },
    { key: 'error', label: 'Errores & Alertas', desc: 'Aviso suave cuando ocurre un fallo o error' },
    { key: 'navigation', label: 'Navegación de Barra Lateral', desc: 'Cambio de vista y módulo' },
    { key: 'dragDrop', label: 'Arrastrar y Soltar (Drag & Drop)', desc: 'Movimiento de elementos en Kanban y listas' },
    { key: 'clockIn', label: 'Fichaje de Jornada (Mi Tiempo)', desc: 'Notificación de entrada y salida laboral' },
    { key: 'toggle', label: 'Interruptores Toggle', desc: 'Activación y desactivación de opciones' },
    { key: 'delete', label: 'Eliminar Registros', desc: 'Borrado de contactos o facturas' },
    { key: 'chat', label: 'Mensajes & Omnicanal', desc: 'Chime marimba al recibir chat de cliente' },
    { key: 'pop', label: 'Efectos Pop Flotantes', desc: 'Apertura de desplegables y modales' },
  ];

  return (
    <div className="space-y-6">
      {/* Sidebar Personalization Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-brand-color/10 text-brand-color rounded-2xl shrink-0">
            <PanelLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Personalización de la Barra Lateral &amp; Efectos de Sonido
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reordena los módulos arrastrándolos (Drag &amp; Drop), activa o desactiva su visibilidad y personaliza los efectos de sonido uno a uno con persistencia directa en la base de datos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
          <button
            onClick={handleSaveToDB}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-brand-color text-white text-xs font-bold shadow-sm hover:opacity-90 transition flex items-center space-x-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando en BD...' : 'Guardar en Base de Datos'}</span>
          </button>
        </div>
      </div>

      {/* Grid container for Sidebar Order & Sound Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Drag & Drop Sidebar Modules Customization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-brand-color" />
                <span>Orden &amp; Visibilidad de Módulos (Drag &amp; Drop)</span>
              </h4>
              <p className="text-xs text-slate-500">Arrastra para reordenar o usa los botones de subir/bajar.</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {items.length - hiddenItems.length} visibles / {items.length} totales
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item, index) => {
              const isHidden = hiddenItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    draggedIndex === index
                      ? 'border-brand-color bg-brand-color/5 shadow-md scale-[1.01]'
                      : isHidden
                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 w-4 text-center">{index + 1}</span>
                    <div className="truncate">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                      title="Mover arriba"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === items.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                      title="Mover abajo"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isHidden
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                      title={isHidden ? 'Mostrar en barra lateral' : 'Ocultar en barra lateral'}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Granular Sound Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-brand-color" />
                <span>Control Granular de Efectos de Sonido</span>
              </h4>
              <p className="text-xs text-slate-500">Activa o desactiva tipos de sonidos individualmente.</p>
            </div>
            <button
              onClick={() => {
                const globalState = !soundService.isMuted();
                soundService.setMuted(globalState);
                toast.info(globalState ? 'Silencio General Activado' : 'Sonidos Generales Habilitados');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                soundService.isMuted()
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {soundService.isMuted() ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{soundService.isMuted() ? 'Silencio General' : 'Audio General OK'}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {soundCatalog.map((sound) => {
              const isEnabled = soundPrefs[sound.key];

              return (
                <div
                  key={sound.key}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/70 transition"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{sound.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{sound.desc}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => testSound(sound.key)}
                      className="px-2.5 py-1 bg-brand-color/10 hover:bg-brand-color/20 text-brand-color rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Probar reproducción de este sonido"
                    >
                      <Play className="w-3 h-3" />
                      <span>Probar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSoundToggle(sound.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
