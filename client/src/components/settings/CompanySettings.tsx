import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Paintbrush,
  Building2,
  Image,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  CreditCard,
  Receipt,
  Globe,
  Mail,
  Phone,
  MapPin,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { useBranding, BrandingConfig } from '../../context/BrandingContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

const COLOR_PRESETS = [
  { name: 'Azul DAMA', hex: '#072053' },
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Verde Éxito', hex: '#059669' },
  { name: 'Púrpura Tech', hex: '#7C3AED' },
  { name: 'Naranja Pro', hex: '#EA580C' },
  { name: 'Rojo Carmín', hex: '#DC2626' },
  { name: 'Cian Océano', hex: '#0891B2' },
  { name: 'Grafito Oscuro', hex: '#1E293B' },
];

const CURRENCY_OPTIONS = [
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'USD', label: 'USD ($) - Dólar Estadounidense' },
  { code: 'GBP', label: 'GBP (£) - Libra Esterlina' },
  { code: 'MXN', label: 'MXN ($) - Peso Mexicano' },
  { code: 'COP', label: 'COP ($) - Peso Colombiano' },
];

export const CompanySettings: React.FC = () => {
  const { branding, updateBranding, resetBranding } = useBranding();
  const { t } = useLanguage();
  const toast = useToast();

  const [form, setForm] = useState<BrandingConfig>(branding);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBranding(form);
      toast.success(
        'Configuración de Empresa Guardada',
        'Los datos corporativos, estilos y parámetros de facturación se han guardado con éxito en la base de datos.'
      );
    } catch {
      toast.error('Error al guardar', 'No se ha podido actualizar la configuración de la empresa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Deseas restablecer la identidad corporativa y datos a los valores predeterminados?')) {
      await resetBranding();
      toast.info('Valores Restablecidos', 'Se han restaurado los valores por defecto del CRM.');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 transition-colors"
              style={{ backgroundColor: form.primaryColor }}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('settings.brandIdentityLogo', 'Identidad Corporativa, Marca Blanca & Facturación')}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Nivel Empresa
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t('settings.brandIdentityDesc', 'Configura logotipo, colores corporativos, datos fiscales e impuestos para presupuestos y facturas.')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('settings.resetBrandingBtn', 'Restablecer')}</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: form.primaryColor }}
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : t('settings.saveBrand', 'Guardar Configuración')}</span>
            </button>
          </div>
        </div>

        {/* Section 1: Visual Identity & Styling */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Name and Logos */}
          <div className="space-y-4 bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <Paintbrush className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Nombre & Logotipo</h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Nombre de la Empresa / Marca
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                URL o Archivo del Logotipo Principal
              </label>
              <input
                type="text"
                placeholder="https://ejemplo.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 mb-1.5"
              />
              <label className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                <Image className="w-3.5 h-3.5" />
                <span>{t('settings.uploadLocalLogo', 'Subir logo desde este equipo')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setForm({ ...form, logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Col 2: Color and Curvature */}
          <div className="space-y-4 bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Color Corporativo & Bordes</h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Color Primario del CRM
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">
                  {form.primaryColor}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={color.name}
                    onClick={() => setForm({ ...form, primaryColor: color.hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      form.primaryColor === color.hex ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Curvatura de Bordes (Border Radius)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sm', label: 'Suave (8px)' },
                  { id: 'md', label: 'Moderno (14px)' },
                  { id: 'lg', label: 'Extra (20px)' },
                  { id: 'full', label: 'Curvado (28px)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, borderRadius: r.id as any })}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition text-center ${
                      form.borderRadius === r.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3: Live Preview Sandbox */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1 mb-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{t('settings.livePreview', 'Vista Previa en Vivo')}</span>
              </span>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                <div className="flex items-center space-x-2">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-6 h-6 rounded object-contain" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: form.primaryColor }}
                    >
                      {form.companyName.charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {form.companyName}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${form.primaryColor}20`, color: form.primaryColor }}
                  >
                    Etiqueta Activa
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {form.invoicePrefix || 'FAC-2026-'}0012
                  </span>
                </div>

                <button
                  type="button"
                  style={{ backgroundColor: form.primaryColor }}
                  className="w-full py-1.5 text-xs font-bold text-white rounded-lg shadow-xs"
                >
                  Botón Corporativo
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              Los cambios se sincronizan en tiempo real para todos los miembros de la empresa.
            </p>
          </div>
        </div>

        {/* Section 2: Legal & Invoicing Data */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">
              Datos Fiscales, Facturación & Cuentas de Cobro
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CIF/NIF */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                CIF / NIF / Tax ID
              </label>
              <input
                type="text"
                value={form.companyTaxId || ''}
                onChange={(e) => setForm({ ...form, companyTaxId: e.target.value })}
                placeholder="B-12345678"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Email Corporativo */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Email de Facturación / Contacto
              </label>
              <input
                type="email"
                value={form.companyEmail || ''}
                onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                placeholder="facturacion@miempresa.com"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Teléfono Corporativo
              </label>
              <input
                type="text"
                value={form.companyPhone || ''}
                onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                placeholder="+34 910 000 000"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Dirección Fiscal */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Dirección Fiscal Completa
              </label>
              <input
                type="text"
                value={form.companyAddress || ''}
                onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                placeholder="Calle Principal 12, 28001 Madrid, España"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sitio Web */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Sitio Web Oficial
              </label>
              <input
                type="text"
                value={form.companyWebsite || ''}
                onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                placeholder="https://miempresa.com"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Moneda por defecto */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Moneda por Defecto
              </label>
              <select
                value={form.currency || 'EUR'}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de IVA por defecto */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Tasa de IVA / Impuesto General (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.defaultTaxRate ?? 21}
                onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Prefijo Facturación */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Prefijo / Serie Facturas
              </label>
              <input
                type="text"
                value={form.invoicePrefix || 'FAC-2026-'}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                placeholder="FAC-2026-"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Prefijo Presupuestos */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Prefijo / Serie Presupuestos
              </label>
              <input
                type="text"
                value={form.quotePrefix || 'PRE-2026-'}
                onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })}
                placeholder="PRE-2026-"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Cuenta Bancaria IBAN */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                IBAN / Cuenta Bancaria
              </label>
              <input
                type="text"
                value={form.bankAccount || ''}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                placeholder="ES91 2100 0418 4502 0005 1332"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Condiciones de Pago */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Condiciones de Pago por Defecto
              </label>
              <input
                type="text"
                value={form.paymentTerms || ''}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                placeholder="Transferencia a 30 días"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
