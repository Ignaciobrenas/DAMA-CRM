import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Plug,
  ShieldCheck,
  Building2,
  Sparkles,
  Zap,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Check,
  MessageCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';

interface FAQItem {
  id: string;
  category: 'general' | 'integrations' | 'security' | 'sales' | 'branding';
  question: string;
  answer: string;
  tags: string[];
}

export const FAQ: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { branding, getLogo } = useBranding();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-1': true,
  });
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean | null>>({});

  const faqData: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'general',
      question: '¿Qué es DAMA-CRM y qué módulos incluye?',
      answer:
        'DAMA-CRM es una plataforma integral modular para PYMES que unifica Embudo de Ventas (Pipeline), Planificador Ágil con metodologías Scrum/Kanban, Directorio de Contactos y Empresas, Facturación y Presupuestos con cálculo fiscal automático, Catálogo de Inventario con sincronización UnoPIM, Automatizaciones con motor de reglas y Centro de Mensajería Omnicanal 24/7 con WhatsApp Meta Cloud.',
      tags: ['crm', 'módulos', 'general', 'características'],
    },
    {
      id: 'faq-2',
      category: 'integrations',
      question: '¿Cómo conecto Odoo, WooCommerce o Shopify con el CRM?',
      answer:
        'Accede al apartado de "Conectores & Automatizaciones" (/integrations). Haz clic en "Configurar" sobre el conector deseado, ingresa tus credenciales (API Key o Consumer Secret) y copia la URL del Webhook generada para pegarla en el panel de tu tienda o ERP. Además, dispones del endpoint central `/api/integraciones-de-terceros` para auditar el estado de todos los conectores.',
      tags: ['odoo', 'woocommerce', 'shopify', 'webhooks', 'api'],
    },
    {
      id: 'faq-3',
      category: 'integrations',
      question: '¿Cómo funciona la integración con n8n?',
      answer:
        'DAMA-CRM ofrece enlace bidireccional con n8n: 1) Puedes configurar una URL de webhook de n8n para que reciba eventos salientes del CRM (como nuevo contacto, trato ganado o factura cobrada). 2) n8n puede enviar acciones entrantes mediante peticiones HTTP POST a `/api/integrations/n8n/action` para crear contactos, oportunidades, productos o actividades automáticamente.',
      tags: ['n8n', 'automatización', 'flujos', 'triggers'],
    },
    {
      id: 'faq-4',
      category: 'security',
      question: '¿Qué medidas de seguridad y autenticación 2FA incorpora el sistema?',
      answer:
        'El sistema cuenta con autenticación segura con hash de contraseñas bcrypt, tokens JWT criptográficos, autenticación en dos pasos (2FA) basada en RFC 6238 TOTP (Google Authenticator / Authy), control de accesos por roles dinámico (RBAC) con matriz granular de permisos, registro de auditoría legal de acciones y cabeceras de protección Helmet.',
      tags: ['2fa', 'seguridad', 'totp', 'rbac', 'jwt'],
    },
    {
      id: 'faq-5',
      category: 'security',
      question: '¿Cumple la plataforma con el RGPD y la LOPD europea?',
      answer:
        'Sí. La plataforma implementa consentimiento explícito en captura de leads con doble opt-in, derecho al olvido y portabilidad de datos en formato CSV estándar, trazabilidad de accesos con IP y timestamp legal en los registros de auditoría, y no transfiere datos personales a redes de publicidad externas sin autorización.',
      tags: ['rgpd', 'gdpr', 'privacidad', 'lopd'],
    },
    {
      id: 'faq-6',
      category: 'branding',
      question: '¿Cómo funciona el logotipo adaptativo en Modo Oscuro y Modo Claro?',
      answer:
        'DAMA-CRM cuenta con un sistema de marca inteligente. Si no has subido un logotipo personalizado de empresa, el imagotipo institucional de DAMA actúa automáticamente como placeholder de alta definición: renderiza en color navy corporativo (#072053) sobre fondo claro y conmuta instantáneamente a blanco puro (#FFFFFF) en Modo Oscuro para garantizar contraste y legibilidad óptimos.',
      tags: ['marca', 'logo', 'modo oscuro', 'dark mode', 'branding'],
    },
    {
      id: 'faq-7',
      category: 'sales',
      question: '¿Cómo convierto un presupuesto aprobado en una factura oficial?',
      answer:
        'Desde el módulo de Facturación (/invoicing), abre la pestaña "Presupuestos", localiza la propuesta aceptada y haz clic en el botón de acción "Convertir a Factura". El sistema generará una factura oficial con número correlativo, calculará los impuestos (IVA 21% configurable) y asociará las líneas de detalle automáticamente.',
      tags: ['facturación', 'presupuesto', 'ventas', 'iva'],
    },
  ];

  const categories = [
    { id: 'all', label: 'Todas las preguntas', icon: HelpCircle },
    { id: 'general', label: 'General & Módulos', icon: Sparkles },
    { id: 'integrations', label: 'Conectores & Webhooks', icon: Plug },
    { id: 'security', label: 'Seguridad & RGPD', icon: ShieldCheck },
    { id: 'sales', label: 'Ventas & Facturación', icon: Building2 },
    { id: 'branding', label: 'Identidad & Temas', icon: Zap },
  ];

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFeedback = (id: string, isHelpful: boolean) => {
    setHelpfulFeedback((prev) => ({ ...prev, [id]: isHelpful }));
  };

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-color/10 text-brand-color text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Centro de Ayuda & Documentación</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Preguntas Frecuentes (FAQ)
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Encuentra respuestas rápidas sobre integraciones, seguridad, facturación y personalización de DAMA-CRM.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por palabra clave (ej. webhooks, odoo, 2fa, facturas)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color shadow-sm outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-brand-color text-white shadow-sm scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
              No se encontraron preguntas que coincidan con "{searchQuery}"
            </p>
            <p className="text-slate-500 text-xs">
              Prueba con otros términos de búsqueda o selecciona "Todas las preguntas".
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = Boolean(openItems[faq.id]);
            const feedback = helpfulFeedback[faq.id];

            return (
              <motion.div
                key={faq.id}
                layout
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-base select-none"
                >
                  <span className="flex-1">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-brand-color/10 text-brand-color' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                        <p>{faq.answer}</p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {faq.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Helpful feedback */}
                          <div className="flex items-center gap-2 text-slate-400">
                            <span>¿Te ha resultado útil?</span>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, true)}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                feedback === true ? 'text-emerald-500 font-bold' : ''
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, false)}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                feedback === false ? 'text-rose-500 font-bold' : ''
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Contact Support Footer Card */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl p-6 sm:p-8 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-color/10 text-brand-color flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">¿Tienes dudas adicionales o necesitas soporte técnico?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nuestro equipo de ingeniería y soporte comercial está a tu disposición en la bandeja omnicanal.
            </p>
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/omnichannel')}
            className="px-5 py-2.5 bg-brand-color text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95 shrink-0 shadow-sm"
          >
            Abrir Chat de Soporte
          </button>
        )}
      </div>
    </div>
  );
};
