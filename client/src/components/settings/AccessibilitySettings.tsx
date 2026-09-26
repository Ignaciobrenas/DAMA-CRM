import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Type,
  ZoomIn,
  Sparkles,
  CheckCircle2,
  Sliders,
  Eye,
  Database,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppearance, FontSizeOption, IconStyleOption, FONT_SIZE_PX_MAP } from '../../context/AppearanceContext';
import { useToast } from '../../context/ToastContext';
import { DynamicIcon } from '../ui/DynamicIcon';

export const AccessibilitySettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const {
    fontSize,
    uiScale,
    iconStyle,
    setFontSize,
    setUiScale,
    setIconStyle,
    saveAppearance,
  } = useAppearance();

  const [saving, setSaving] = useState(false);

  const fontOptions: Array<{
    value: FontSizeOption;
    label: string;
    description: string;
    px: string;
  }> = [
    {
      value: 'xs',
      label: t('accessibility.fontXS', 'Extra Pequeña'),
      description: t('accessibility.fontXSDesc', 'Máxima densidad de datos en pantalla'),
      px: '13px',
    },
    {
      value: 'sm',
      label: t('accessibility.fontSM', 'Pequeña'),
      description: t('accessibility.fontSMDesc', 'Compacta para pantallas portátiles'),
      px: '14px',
    },
    {
      value: 'md',
      label: t('accessibility.fontMD', 'Estándar'),
      description: t('accessibility.fontMDDesc', 'Equilibrio óptimo recomendado'),
      px: '16px',
    },
    {
      value: 'lg',
      label: t('accessibility.fontLG', 'Grande'),
      description: t('accessibility.fontLGDesc', 'Lectura descansada y cómoda'),
      px: '18px',
    },
    {
      value: 'xl',
      label: t('accessibility.fontXL', 'Extra Grande'),
      description: t('accessibility.fontXLDesc', 'Máxima legibilidad y accesibilidad visual'),
      px: '20px',
    },
  ];

  const scaleOptions: Array<{
    value: number;
    label: string;
    percentage: string;
    description: string;
  }> = [
    {
      value: 0.85,
      label: t('accessibility.scale85', '85% (Compacto)'),
      percentage: '85%',
      description: t('accessibility.scale85Desc', 'Reduce el tamaño global para ver más información simultánea'),
    },
    {
      value: 0.9,
      label: t('accessibility.scale90', '90% (Equilibrado)'),
      percentage: '90%',
      description: t('accessibility.scale90Desc', 'Escala ligeramente reducida'),
    },
    {
      value: 1.0,
      label: t('accessibility.scale100', '100% (Estándar)'),
      percentage: '100%',
      description: t('accessibility.scale100Desc', 'Escala nativa original del sistema'),
    },
    {
      value: 1.1,
      label: t('accessibility.scale110', '110% (Ampliado)'),
      percentage: '110%',
      description: t('accessibility.scale110Desc', 'Controles y ventanas ampliados un 10%'),
    },
    {
      value: 1.25,
      label: t('accessibility.scale125', '125% (Accesibilidad Alta)'),
      percentage: '125%',
      description: t('accessibility.scale125Desc', 'Elementos y botones ampliados para facilitar el clic y visualización'),
    },
  ];

  const iconOptions: Array<{
    value: IconStyleOption;
    label: string;
    description: string;
  }> = [
    {
      value: 'animated',
      label: t('accessibility.iconAnimated', 'Dinámicos & Vivos'),
      description: t('accessibility.iconAnimatedDesc', 'Micro-animaciones interactivas al pasar el cursor y pulsar'),
    },
    {
      value: 'solid',
      label: t('accessibility.iconSolid', 'Sólidos & Estáticos'),
      description: t('accessibility.iconSolidDesc', 'Iconos fijos sin animaciones de movimiento'),
    },
    {
      value: 'minimal',
      label: t('accessibility.iconMinimal', 'Minimalistas'),
      description: t('accessibility.iconMinimalDesc', 'Trazos limpios con mínima distracción'),
    },
  ];

  const handleManualSave = async () => {
    setSaving(true);
    try {
      const ok = await saveAppearance({ fontSize, uiScale, iconStyle });
      if (ok) {
        toast.success(t('accessibility.savedSuccess', 'Preferencias visuales guardadas permanentemente en la base de datos'));
      } else {
        toast.error(t('accessibility.savedError', 'Error al guardar las preferencias en el servidor'));
      }
    } catch {
      toast.error(t('accessibility.savedError', 'Error al guardar las preferencias en el servidor'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-500/10 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {t('accessibility.title', 'Personalización Visual & Accesibilidad')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {t('accessibility.subtitle', 'Ajuste el tamaño tipográfico global, la escala de interfaz (zoom) y los iconos dinámicos. Toda configuración se sincroniza con su usuario en la base de datos.')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-2"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            <span>{saving ? t('saving', 'Guardando...') : t('accessibility.saveToDatabase', 'Persistir en BD')}</span>
          </button>
        </div>
      </div>

      {/* Live Visual Preview Sandbox */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 border border-blue-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-blue-200/40 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 dark:text-blue-300">
            <Eye className="w-4 h-4" />
            <span>{t('accessibility.livePreviewTitle', 'Vista Previa en Tiempo Real de Tipografía y Escala')}</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-slate-700">
            Fuente: {fontSize.toUpperCase()} ({FONT_SIZE_PX_MAP[fontSize]}) • Zoom: {Math.round(uiScale * 100)}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
              {t('accessibility.previewSampleCard', 'Tarjeta de Muestra CRM')}
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">
              DAMA CRM Enterprise v1.2.0
            </h4>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              {t('accessibility.sampleText', 'Gestión modular adaptada con control horario, facturación ISO, inventario y soporte multi-tenant.')}
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                {t('accessibility.previewKPI', 'Indicador Financiero')}
              </span>
              <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                €42,850.00
              </div>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1">
              <span>+18.4% vs mes anterior</span>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
                <DynamicIcon icon={Sparkles} variant="bounce" size={20} />
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white block">
                  {t('accessibility.interactiveIcons', 'Iconos Interactivos')}
                </span>
                <span className="text-[11px] text-gray-400">
                  {iconStyle === 'animated' ? t('accessibility.animatedActive', 'Animaciones activas') : t('accessibility.staticActive', 'Modo estático')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Global UI Scaling Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <ZoomIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {t('accessibility.scaleSectionTitle', '1. Escala de Toda la Interfaz (UI Zoom)')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('accessibility.scaleSectionDesc', 'Aumenta o reduce proporcionalmente el tamaño de todos los componentes, botones, tablas y paneles.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {scaleOptions.map((opt) => {
            const isSelected = Math.abs(uiScale - opt.value) < 0.01;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUiScale(opt.value)}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black text-gray-900 dark:text-white">
                      {opt.percentage}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <span className="font-bold text-xs text-gray-800 dark:text-slate-200 block mt-1">
                    {opt.label}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Global Typography Font Size Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {t('accessibility.fontSectionTitle', '2. Tamaño de Fuente & Tipografía Global')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('accessibility.fontSectionDesc', 'Controla la escala tipográfica de todo el CRM para mejorar la legibilidad y descanso visual.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {fontOptions.map((opt) => {
            const isSelected = fontSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontSize(opt.value)}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {opt.px}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <span className="font-bold text-xs text-gray-800 dark:text-slate-200 block mt-1">
                    {opt.label}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Icon Style & Micro-Interactions */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {t('accessibility.iconSectionTitle', '3. Estilo de Iconos & Micro-animaciones')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('accessibility.iconSectionDesc', 'Personalice los efectos dinámicos de los iconos en menús, acciones y botones del sistema.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {iconOptions.map((opt) => {
            const isSelected = iconStyle === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIconStyle(opt.value)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/50 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
