import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  Download,
  Save,
  RotateCcw,
  QrCode,
  Stamp,
  Landmark,
  AlignLeft,
  AlignRight,
  CheckCircle2,
  Upload,
  Sparkles,
  Scale,
  Eye,
} from 'lucide-react';
import { useBranding, BrandingConfig, PdfTemplateStyle, DEFAULT_BRANDING } from '../../context/BrandingContext';
import { useToast } from '../../context/ToastContext';
import { downloadFile } from '../../services/api';

const TEMPLATE_OPTIONS: Array<{
  id: PdfTemplateStyle;
  name: string;
  badge: string;
  description: string;
  defaultColor: string;
}> = [
  {
    id: 'MODERN_STRIPE',
    name: 'Modern Stripe / Linear',
    badge: 'Recomendado',
    description: 'Banda superior de color, tarjetas de emisor/receptor con micro-contraste y tabla de alta legibilidad.',
    defaultColor: '#2563EB',
  },
  {
    id: 'CORPORATE_SAGE',
    name: 'Corporativo Sage ERP',
    badge: 'Industrial & Logística',
    description: 'Doble franja ejecutiva, estructurado para auditoría contable, albaranes LOTT y trazabilidad Veri*Factu.',
    defaultColor: '#059669',
  },
  {
    id: 'CLASSIC_EXECUTIVE',
    name: 'Clásico Despacho Legal',
    badge: 'Sobrio',
    description: 'Diseño formal de consultoría y bufete con filetes ejecutivos y máxima densidad documental.',
    defaultColor: '#0F172A',
  },
  {
    id: 'MINIMAL_SWISS',
    name: 'Minimalista Suizo',
    badge: 'Editorial',
    description: 'Retícula tipográfica pura con líneas nítidas sin fondos rellenos para impresión rápida en monocromo o color.',
    defaultColor: '#1E293B',
  },
];

const ACCENT_PRESETS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'DAMA Navy', hex: '#072053' },
  { name: 'Sage Emerald', hex: '#059669' },
  { name: 'Indigo Pro', hex: '#4F46E5' },
  { name: 'Executive Slate', hex: '#0F172A' },
  { name: 'Crimson Legal', hex: '#B91C1C' },
  { name: 'Amber Industrial', hex: '#D97706' },
  { name: 'Teal Ocean', hex: '#0D9488' },
];

export const PdfDesignSettings: React.FC = () => {
  const { branding, updateBranding } = useBranding();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BrandingConfig>(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const hasCustomCompanyLogo =
    Boolean(form.logoUrl) &&
    !form.logoUrl.includes('dama-symbol') &&
    !form.logoUrl.includes('dama-logo');

  const resolvedPreviewLogo = hasCustomCompanyLogo
    ? form.logoUrl
    : './assets/logos/dama-logo-dark.png';

  const activeTemplate = form.pdfTemplate || 'MODERN_STRIPE';
  const activeAccent = form.pdfAccentColor || form.primaryColor || '#2563EB';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Archivo demasiado grande', 'El logotipo debe pesar menos de 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, logoUrl: base64, logoLightUrl: base64 }));
      toast.success('Logotipo cargado', 'El logotipo de tu empresa se ha aplicado a la vista previa del PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleUseDamaPlaceholder = () => {
    setForm((prev) => ({ ...prev, logoUrl: '', logoLightUrl: '', logoDarkUrl: '' }));
    toast.info(
      'Placeholder Oficial DAMA Activo',
      'Al no especificar logotipo propio, todos los PDFs usarán automáticamente el logotipo oficial de DAMA.'
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBranding(form);
      toast.success(
        'Diseño de PDF Guardado',
        'La plantilla, logotipos, colores y textos legales Veri*Factu se han guardado en la base de datos.'
      );
    } catch {
      toast.error('Error al guardar', 'No se pudo guardar la configuración de diseño PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSample = async () => {
    setIsDownloading(true);
    try {
      await updateBranding(form);
      await downloadFile(
        `/branding/sample-pdf?template=${encodeURIComponent(activeTemplate)}&accentColor=${encodeURIComponent(activeAccent)}`,
        `Muestra-PDF-${activeTemplate}-${form.companyName || 'DAMA'}.pdf`
      );
      toast.success('PDF de Muestra Generado', 'Se ha descargado el documento PDF oficial con tu diseño actual.');
    } catch {
      toast.error('Error al generar PDF', 'No se pudo descargar el PDF de muestra.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreDefaults = () => {
    setForm((prev) => ({
      ...prev,
      pdfTemplate: DEFAULT_BRANDING.pdfTemplate,
      pdfAccentColor: DEFAULT_BRANDING.pdfAccentColor,
      pdfSecondaryColor: DEFAULT_BRANDING.pdfSecondaryColor,
      pdfShowLogo: DEFAULT_BRANDING.pdfShowLogo,
      pdfLogoPosition: DEFAULT_BRANDING.pdfLogoPosition,
      pdfShowVerifactuQr: DEFAULT_BRANDING.pdfShowVerifactuQr,
      pdfShowBankDetails: DEFAULT_BRANDING.pdfShowBankDetails,
      pdfShowSignatureBox: DEFAULT_BRANDING.pdfShowSignatureBox,
      pdfShowWatermark: DEFAULT_BRANDING.pdfShowWatermark,
      pdfWatermarkText: DEFAULT_BRANDING.pdfWatermarkText,
      pdfHeaderSubtitle: DEFAULT_BRANDING.pdfHeaderSubtitle,
      pdfMercantileRegistry: DEFAULT_BRANDING.pdfMercantileRegistry,
      pdfLopdText: DEFAULT_BRANDING.pdfLopdText,
      pdfFooterLegalText: DEFAULT_BRANDING.pdfFooterLegalText,
    }));
    toast.info('Diseño predeterminado', 'Se han restaurado los parámetros por defecto del Estudio PDF.');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-10" data-testid="pdf-design-studio">
      {/* Header Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: activeAccent }}
          >
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Estudio de Diseño de Documentos & PDF (Veri*Factu)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                RD 1007/2023 & Orden HAC/1177/2024
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personaliza plantillas para Facturas, Presupuestos, Albaranes de Traspaso LOTT e Informes Financieros con logotipo propio o placeholder oficial de DAMA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            data-testid="btn-restore-pdf-defaults"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSample}
            disabled={isDownloading}
            data-testid="btn-download-sample-pdf"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition shadow-2xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{isDownloading ? 'Generando PDF...' : 'Descargar PDF de Muestra'}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            data-testid="btn-save-pdf-design"
            style={{ backgroundColor: activeAccent }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Diseño PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Panels (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* 1. Template Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  1. Plantilla Estructural del Documento
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">ISO 216 (DIN A4)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_OPTIONS.map((tpl) => {
                const isSelected = activeTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`select-pdf-template-${tpl.id}`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        pdfTemplate: tpl.id,
                        pdfAccentColor: prev.pdfAccentColor || tpl.defaultColor,
                      }))
                    }
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-600 ring-2 ring-blue-500/15'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{tpl.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Logo Management (Company Logo vs Official DAMA Placeholder) & Palette */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. Logotipo en PDFs & Paleta Corporativa
                </h3>
              </div>
              <span
                data-testid="badge-logo-mode"
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  hasCustomCompanyLogo
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                {hasCustomCompanyLogo ? 'Logo Personalizado de Empresa Activo' : 'Placeholder Oficial DAMA Activo'}
              </span>
            </div>

            {/* Logo Preview & Uploader Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-36 h-16 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-2 shrink-0">
                  <img
                    src={resolvedPreviewLogo}
                    alt="Logo PDF actual"
                    data-testid="img-pdf-logo-preview"
                    className="max-h-12 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './assets/logos/dama-logo-dark.png';
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {hasCustomCompanyLogo ? 'Logotipo de tu Empresa' : 'Logotipo Oficial DAMA (Placeholder por defecto)'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                    {hasCustomCompanyLogo
                      ? 'Este logotipo se incrusta automáticamente en todas las facturas, presupuestos, albaranes e informes.'
                      : 'Si la empresa no define un logotipo propio, DAMA-CRM estampa su logotipo oficial de marca como placeholder.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  data-testid="input-upload-company-logo" aria-label="Subir archivo de logotipo de empresa"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="btn-upload-company-logo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Logo de Empresa</span>
                </button>
                {hasCustomCompanyLogo && (
                  <button
                    type="button"
                    onClick={handleUseDamaPlaceholder}
                    data-testid="btn-use-dama-placeholder"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <span>Usar Placeholder DAMA</span>
                  </button>
                )}
              </div>
            </div>

            {/* URL Direct Input & Logo Alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL o Data URI del Logotipo de Empresa (vacío = Placeholder Oficial DAMA)
                </label>
                <input
                  type="text"
                  value={form.logoUrl || ''}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://tu-empresa.es/logo.png (o dejar vacío para usar logo oficial DAMA)"
                  data-testid="input-pdf-logo-url" aria-label="URL o Data URI del logotipo de empresa"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Posición del Logo en Cabecera
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    data-testid="btn-logo-pos-left"
                    onClick={() => setForm({ ...form, pdfLogoPosition: 'LEFT' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      (form.pdfLogoPosition || 'LEFT') === 'LEFT'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Izquierda</span>
                  </button>
                  <button
                    type="button"
                    data-testid="btn-logo-pos-right"
                    onClick={() => setForm({ ...form, pdfLogoPosition: 'RIGHT' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      form.pdfLogoPosition === 'RIGHT'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    <span>Derecha</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker & Presets */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>Color de Acento en Cabeceras y Totales del PDF</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeAccent}
                    onChange={(e) => setForm({ ...form, pdfAccentColor: e.target.value, primaryColor: e.target.value })}
                    aria-label="Selector de color de acento PDF"
                    className="w-6 h-6 rounded-md cursor-pointer border border-slate-300"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{activeAccent}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setForm({ ...form, pdfAccentColor: preset.hex, primaryColor: preset.hex })}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      activeAccent.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.hex }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Functional Blocks & Veri*Factu Toggles */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <QrCode className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                3. Bloques Documentales & Certificación Criptográfica Veri*Factu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'pdfShowLogo' as const,
                  label: 'Mostrar Logotipo en Cabecera',
                  desc: 'Incrusta el logo de empresa o el placeholder de DAMA.',
                  icon: ImageIcon,
                  defaultVal: true,
                },
                {
                  key: 'pdfShowVerifactuQr' as const,
                  label: 'Bloque QR & Huella SHA-256 Veri*Factu',
                  desc: 'Obligatorio por Orden HAC/1177/2024 en facturas.',
                  icon: QrCode,
                  defaultVal: true,
                },
                {
                  key: 'pdfShowBankDetails' as const,
                  label: 'Mostrar Cuenta Bancaria / IBAN',
                  desc: 'Incluye el IBAN y condiciones de pago en el pie.',
                  icon: Landmark,
                  defaultVal: true,
                },
                {
                  key: 'pdfShowSignatureBox' as const,
                  label: 'Recuadro de Sello y Firma',
                  desc: 'Espacio para firma de conformidad o sello mercantil.',
                  icon: Stamp,
                  defaultVal: true,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = form[item.key] !== undefined ? Boolean(form[item.key]) : item.defaultVal;
                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                      data-testid={`toggle-${item.key}`}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Watermark Settings */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(form.pdfShowWatermark)}
                  onChange={(e) => setForm({ ...form, pdfShowWatermark: e.target.checked })}
                  data-testid="toggle-pdfShowWatermark"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Activar Marca de Agua Diagonal:</span>
              </label>
              <input
                type="text"
                value={form.pdfWatermarkText || ''}
                onChange={(e) => setForm({ ...form, pdfWatermarkText: e.target.value })}
                placeholder="ORIGINAL · VERI*FACTU"
                data-testid="input-pdf-watermark-text" aria-label="Texto de marca de agua diagonal"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 4. Legal & Fiscal Clauses (Mercantile Registry & LOPDGDD) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Scale className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                4. Datos Registrales, Cláusula RGPD / LOPDGDD & Pie Legal
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Datos de Inscripción en el Registro Mercantil (Art. 24 Código de Comercio)
                </label>
                <input
                  type="text"
                  value={form.pdfMercantileRegistry || ''}
                  onChange={(e) => setForm({ ...form, pdfMercantileRegistry: e.target.value })}
                  data-testid="input-pdf-mercantile-registry" aria-label="Datos de inscripción en el Registro Mercantil"
                  placeholder="Inscrita en el Registro Mercantil de Madrid · Tomo 41.205 · Folio 112 · Hoja M-730412"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cláusula de Protección de Datos (RGPD UE 2016/679 y LOPDGDD 3/2018)
                </label>
                <textarea
                  rows={2}
                  value={form.pdfLopdText || ''}
                  onChange={(e) => setForm({ ...form, pdfLopdText: e.target.value })}
                  data-testid="input-pdf-lopd-text" aria-label="Cláusula de Protección de Datos RGPD y LOPDGDD" placeholder="Cláusula informativa RGPD / LOPDGDD..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Texto Normativo de Pie de Página
                </label>
                <input
                  type="text"
                  value={form.pdfFooterLegalText || ''}
                  onChange={(e) => setForm({ ...form, pdfFooterLegalText: e.target.value })}
                  data-testid="input-pdf-footer-legal" aria-label="Texto normativo de pie de página" placeholder="Factura verificable en la sede electrónica de la AEAT..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive A4 Sheet Preview (5 cols) */}
        <div className="xl:col-span-5 xl:sticky xl:top-4 space-y-3">
          <div className="bg-slate-200/70 dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Vista Previa Interactiva A4 en Vivo</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {activeTemplate}
              </span>
            </div>

            {/* Simulated A4 Paper Sheet */}
            <div
              data-testid="pdf-live-preview-sheet"
              className="relative bg-white text-slate-900 rounded-lg shadow-lg border border-slate-200 overflow-hidden p-5 space-y-4 text-[10px] select-none"
              style={{ minHeight: '540px' }}
            >
              {/* Top Template Bar */}
              {activeTemplate === 'CORPORATE_SAGE' && (
                <div className="absolute top-0 left-0 right-0 h-2.5" style={{ backgroundColor: activeAccent }} />
              )}
              {activeTemplate === 'MODERN_STRIPE' && (
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: activeAccent }} />
              )}
              {activeTemplate === 'CLASSIC_EXECUTIVE' && (
                <div className="h-0.5 w-full mb-2" style={{ backgroundColor: activeAccent }} />
              )}

              {/* Diagonal Watermark Preview */}
              {form.pdfShowWatermark && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                  <span className="text-2xl font-black uppercase tracking-widest text-slate-200/70 -rotate-35 whitespace-nowrap">
                    {form.pdfWatermarkText || 'ORIGINAL · VERI*FACTU'}
                  </span>
                </div>
              )}

              {/* Document Header */}
              <div
                className={`relative z-10 flex items-start justify-between gap-3 pt-1 pb-3 border-b border-slate-200 ${
                  form.pdfLogoPosition === 'RIGHT' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className="space-y-1">
                  {form.pdfShowLogo !== false ? (
                    <img
                      src={resolvedPreviewLogo}
                      alt="Logo en documento"
                      className="h-9 max-w-[130px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './assets/logos/dama-logo-dark.png';
                      }}
                    />
                  ) : (
                    <div className="text-sm font-black" style={{ color: activeAccent }}>
                      {form.companyName || 'DAMA CRM'}
                    </div>
                  )}
                  <div className="text-[8px] text-slate-500">
                    {form.pdfHeaderSubtitle || 'Sistemas de Gestión Empresarial & ERP Cloud'}
                  </div>
                </div>

                <div className={form.pdfLogoPosition === 'RIGHT' ? 'text-left' : 'text-right'}>
                  <div className="text-xs font-black tracking-tight" style={{ color: activeAccent }}>
                    FACTURA ORDINARIA
                  </div>
                  <div className="text-[9px] font-bold text-slate-800">
                    Nº Serie: {form.invoicePrefix || 'FAC-2026-'}0042 · Tipo: F1
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PAGADA
                  </span>
                </div>
              </div>

              {/* Issuer & Client Columns */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5">
                <div
                  className={`p-2 rounded ${
                    activeTemplate === 'MODERN_STRIPE' || activeTemplate === 'CORPORATE_SAGE'
                      ? 'bg-slate-50 border border-slate-200/80'
                      : ''
                  }`}
                >
                  <div className="text-[7px] font-bold uppercase" style={{ color: activeAccent }}>
                    EMISOR / RAZÓN SOCIAL
                  </div>
                  <div className="font-bold text-slate-900 truncate">{form.companyName || 'DAMA CRM'}</div>
                  <div className="text-[8px] text-slate-600">NIF/CIF: {form.companyTaxId || 'B87654323'}</div>
                  <div className="text-[8px] text-slate-500 truncate">
                    {form.companyAddress || 'Av. Tecnológica 42, Madrid'}
                  </div>
                </div>

                <div
                  className={`p-2 rounded ${
                    activeTemplate === 'MODERN_STRIPE' || activeTemplate === 'CORPORATE_SAGE'
                      ? 'bg-slate-50 border border-slate-200/80'
                      : ''
                  }`}
                >
                  <div className="text-[7px] font-bold uppercase" style={{ color: activeAccent }}>
                    CLIENTE / DESTINATARIO FISCAL
                  </div>
                  <div className="font-bold text-slate-900 truncate">Industrias Aeroespaciales S.A.</div>
                  <div className="text-[8px] text-slate-600">NIF/CIF: A28015865</div>
                  <div className="text-[8px] text-slate-500 truncate">Parque Empresarial La Finca, Madrid</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="relative z-10">
                <div
                  className="grid grid-cols-12 px-2 py-1 text-[8px] font-bold rounded-t"
                  style={
                    activeTemplate === 'MINIMAL_SWISS'
                      ? { borderTop: '1.5px solid #0F172A', borderBottom: '1px solid #CBD5E1', color: '#0F172A' }
                      : { backgroundColor: activeAccent, color: '#FFFFFF' }
                  }
                >
                  <span className="col-span-7">CONCEPTO / DESCRIPCIÓN</span>
                  <span className="col-span-2 text-right">CANT.</span>
                  <span className="col-span-3 text-right">IMPORTE</span>
                </div>
                <div className="divide-y divide-slate-100 border-b border-slate-200 text-[8.5px]">
                  <div className="grid grid-cols-12 px-2 py-1.5">
                    <span className="col-span-7 font-medium text-slate-800 truncate">
                      Licencia Corporativa DAMA-CRM Enterprise Multi-Almacén
                    </span>
                    <span className="col-span-2 text-right text-slate-600">1</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">1.650,00 EUR</span>
                  </div>
                  <div className="grid grid-cols-12 px-2 py-1.5 bg-slate-50/70">
                    <span className="col-span-7 font-medium text-slate-800 truncate">
                      Módulo Certificación Criptográfica Veri*Factu (AEAT)
                    </span>
                    <span className="col-span-2 text-right text-slate-600">1</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">450,00 EUR</span>
                  </div>
                  <div className="grid grid-cols-12 px-2 py-1.5">
                    <span className="col-span-7 font-medium text-slate-800 truncate">
                      Consultoría Implantación Logística & Traspasos Sage LOTT
                    </span>
                    <span className="col-span-2 text-right text-slate-600">4</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">350,00 EUR</span>
                  </div>
                </div>
              </div>

              {/* Totals & Bank / Signature */}
              <div className="relative z-10 grid grid-cols-12 gap-3 pt-1">
                <div className="col-span-7 space-y-1.5">
                  {form.pdfShowBankDetails !== false && (
                    <div className="text-[8px] text-slate-600">
                      <span className="font-bold text-slate-800">IBAN: </span>
                      <span className="font-mono">{form.bankAccount || 'ES91 2100 0418 4502 0005 1332'}</span>
                    </div>
                  )}
                  {form.pdfShowSignatureBox !== false && (
                    <div className="w-36 h-10 rounded border border-dashed border-slate-300 p-1 flex flex-col justify-between">
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase">Sello y Conformidad</span>
                      <span className="text-[6.5px] text-slate-400">Firmado digitalmente</span>
                    </div>
                  )}
                </div>

                <div className="col-span-5 space-y-1">
                  <div className="flex justify-between text-[8px] text-slate-600">
                    <span>Base Imponible:</span>
                    <span className="font-bold text-slate-900">2.450,00 EUR</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600">
                    <span>IVA ({form.defaultTaxRate ?? 21}%):</span>
                    <span className="font-bold text-slate-900">514,50 EUR</span>
                  </div>
                  <div
                    className="flex justify-between items-center px-2 py-1.5 rounded text-white font-bold text-[9px]"
                    style={{ backgroundColor: activeAccent }}
                  >
                    <span>TOTAL:</span>
                    <span>2.964,50 EUR</span>
                  </div>
                </div>
              </div>

              {/* Veri*Factu QR Block Preview */}
              {form.pdfShowVerifactuQr !== false && (
                <div
                  data-testid="preview-verifactu-block"
                  className="relative z-10 p-2 rounded bg-slate-50 border border-slate-300 flex items-center gap-2.5"
                >
                  <div className="w-11 h-11 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-slate-900" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-[7.5px] font-bold text-slate-900 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span className="truncate">VERI*FACTU · Factura verificable en la sede electrónica AEAT</span>
                    </div>
                    <div className="text-[6.5px] font-mono text-slate-600 truncate">
                      Huella SHA-256: 7D8F9A2B4C1E6F0A3B5D...9E2C1A4F | Ant: 8F434346...
                    </div>
                    <div className="text-[6.5px] text-slate-500 truncate">
                      Expedida conforme al RD 1007/2023 y Orden HAC/1177/2024
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Preview */}
              <div className="relative z-10 pt-2 border-t border-slate-200 space-y-0.5">
                {form.pdfLopdText && (
                  <div className="text-[6px] text-slate-400 line-clamp-2 leading-tight">{form.pdfLopdText}</div>
                )}
                <div className="flex items-center justify-between text-[6.5px] font-semibold text-slate-500 pt-0.5">
                  <span className="truncate max-w-[80%]">
                    {form.companyName || 'DAMA CRM'} · {form.pdfMercantileRegistry || 'Registro Mercantil de Madrid'}
                  </span>
                  <span style={{ color: activeAccent }}>Página 1 de 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
