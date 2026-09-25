import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Code2,
  Calendar,
  MessageCircle,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Zap,
  BookOpen,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Smartphone,
  Eye,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/common/Loading';

export const LeadCapture: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'smart_forms' | 'lead_magnets' | 'progressive' | 'whatsapp' | 'scheduler' | 'pixel' | 'ecommerce'
  >('smart_forms');

  // 1. Smart Form State
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    message: '',
    marketingConsent: true,
  });
  const [contactResult, setContactResult] = useState<any>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // 2. Lead Magnet State
  const [magnetEmail, setMagnetEmail] = useState('');
  const [magnetName, setMagnetName] = useState('');
  const [selectedMagnet, setSelectedMagnet] = useState('ebook-crm-guia');
  const [magnetResult, setMagnetResult] = useState<any>(null);
  const [isDownloadingMagnet, setIsDownloadingMagnet] = useState(false);

  // 3. Progressive Profiling State
  const [checkEmail, setCheckEmail] = useState('carlos@empresa.com');
  const [profileResult, setProfileResult] = useState<any>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // 4. WhatsApp / Chat State
  const [chatName, setChatName] = useState('');
  const [chatEmail, setChatEmail] = useState('');
  const [chatPhone, setChatPhone] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatResult, setChatResult] = useState<any>(null);

  // 5. Appointment Scheduler State
  const [apptName, setApptName] = useState('');
  const [apptEmail, setApptEmail] = useState('');
  const [apptDate, setApptDate] = useState('2026-09-30T10:00');
  const [apptType, setApptType] = useState('VIDEOCALL');
  const [apptResult, setApptResult] = useState<any>(null);

  // 6. Abandoned Cart State
  const [cartEmail, setCartEmail] = useState('');
  const [cartTotal, setCartTotal] = useState(389.90);
  const [cartResult, setCartResult] = useState<any>(null);

  // Copy status helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handlers
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactResult(null);
    const res = await apiRequest('/lead-capture/contact', {
      method: 'POST',
      body: JSON.stringify(contactForm),
    });
    setIsSubmittingContact(false);
    setContactResult(res);
  };

  const handleMagnetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDownloadingMagnet(true);
    setMagnetResult(null);
    const res = await apiRequest('/lead-capture/lead-magnet', {
      method: 'POST',
      body: JSON.stringify({
        firstName: magnetName,
        email: magnetEmail,
        magnetId: selectedMagnet,
        magnetTitle: selectedMagnet === 'ebook-crm-guia' ? 'Guía Completa CRM para PYMES (PDF)' : 'Cupón 20% Descuento',
        marketingConsent: true,
      }),
    });
    setIsDownloadingMagnet(false);
    setMagnetResult(res);
  };

  const handleProgressiveCheck = async () => {
    setIsCheckingProfile(true);
    const res = await apiRequest(`/lead-capture/profile-check?email=${encodeURIComponent(checkEmail)}`);
    setIsCheckingProfile(false);
    setProfileResult(res);
  };

  const handleChatInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/lead-capture/chat-session', {
      method: 'POST',
      body: JSON.stringify({
        name: chatName,
        email: chatEmail,
        phone: chatPhone,
        initialMessage: chatMessage,
        channel: 'WHATSAPP',
      }),
    });
    setChatResult(res);
  };

  const handleBookAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/lead-capture/appointments', {
      method: 'POST',
      body: JSON.stringify({
        name: apptName,
        email: apptEmail,
        meetingDate: apptDate,
        meetingType: apptType,
      }),
    });
    setApptResult(res);
  };

  const handleSimulateCart = async () => {
    if (!cartEmail) return;
    const res = await apiRequest('/lead-capture/ecommerce/cart-abandoned', {
      method: 'POST',
      body: JSON.stringify({
        email: cartEmail,
        cartTotal,
        items: [
          { sku: 'PROD-001', name: 'Licencia DAMA Enterprise Anual', price: 299 },
          { sku: 'SRV-002', name: 'Onboarding y Setup Asistido', price: 90.90 },
        ],
        recoveryUrl: 'https://tu-tienda.com/checkout/recover?token=dama_cart_123',
      }),
    });
    setCartResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Generación de Leads, Conectores & Tracking Omnicanal</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('leadCapture')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {t('leadCaptureSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-gray-200 dark:border-slate-800">
        {[
          { id: 'smart_forms', label: '1. Formulario Inteligente', icon: Sparkles },
          { id: 'lead_magnets', label: '2. Lead Magnets (E-books/Cupones)', icon: Gift },
          { id: 'progressive', label: '3. Perfilado Progresivo', icon: Layers },
          { id: 'whatsapp', label: '4. WhatsApp & Live Chat', icon: MessageCircle },
          { id: 'scheduler', label: '5. Agendador de Citas', icon: Calendar },
          { id: 'pixel', label: '6. Píxel de Seguimiento JS', icon: Code2 },
          { id: 'ecommerce', label: '7. E-commerce & Carrito Abandonado', icon: ShoppingCart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Smart Forms */}
      {activeTab === 'smart_forms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Simulador de Formulario Inteligente en Vivo
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Al enviarse, no sólo se despacha un email, sino que crea automáticamente la ficha de Prospecto y un Deal en el CRM.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ignacio"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="García"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email Profesional</label>
                <input
                  type="email"
                  required
                  placeholder="ignacio@empresa.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+34 600 00 00 00"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="Mi Empresa S.L."
                    value={contactForm.companyName}
                    onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Mensaje o Necesidad</label>
                <textarea
                  rows={2}
                  placeholder="Nos gustaría implementar DAMA-CRM para 15 usuarios..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* RGPD Opt-in Independent Checkbox */}
              <div className="pt-2 space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactForm.marketingConsent}
                    onChange={(e) => setContactForm({ ...contactForm, marketingConsent: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-gray-600 dark:text-slate-300 leading-snug">
                    <strong>Casilla de Marketing (Opt-in independiente RGPD):</strong> Acepto recibir novedades, consejos de optimización y promociones comerciales de DAMA-CRM.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingContact}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmittingContact ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Inyectando Prospecto en CRM...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Formulario & Crear Ficha en CRM</span>
                  </>
                )}
              </button>
            </form>

            {contactResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">¡Lead sincronizado exitosamente!</div>
                  <div className="text-[11px] mt-0.5">
                    ID Contacto: {contactResult.data?.contactId} • Estado: {contactResult.data?.isNewLead ? 'Nuevo Lead creado + Oportunidad en Pipeline' : 'Contacto actualizado'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Embed snippet card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Código Embebible para tu Web
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Copia y pega este snippet HTML / JavaScript en cualquier sitio web o landing page externa.
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `<form action="http://localhost:3000/api/lead-capture/contact" method="POST">\n  <input type="text" name="firstName" placeholder="Nombre" required />\n  <input type="email" name="email" placeholder="Email" required />\n  <input type="hidden" name="utmSource" value="landing_page" />\n  <label><input type="checkbox" name="marketingConsent" value="true" /> Acepto comunicaciones</label>\n  <button type="submit">Contactar</button>\n</form>`,
                    'formSnippet'
                  )
                }
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'formSnippet' ? '¡Copiado!' : 'Copiar Snippet'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-[11px] overflow-x-auto font-mono leading-relaxed">
{`<!-- DAMA-CRM Smart Form Connector -->
<form action="/api/lead-capture/contact" method="POST">
  <input type="text" name="firstName" placeholder="Nombre" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="text" name="companyName" placeholder="Empresa" />
  <input type="hidden" name="utmSource" value="web_principal" />
  
  <!-- RGPD Consentimiento Comercial (Opt-in) -->
  <label>
    <input type="checkbox" name="marketingConsent" value="true" />
    Acepto recibir comunicaciones de marketing
  </label>
  
  <button type="submit">Enviar al CRM</button>
</form>`}
            </pre>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Comportamiento Automático del CRM:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800 dark:text-blue-300">
                <li>Valida y normaliza el email para evitar duplicados.</li>
                <li>Si es nuevo, crea una ficha de Lead + Oportunidad por 500 € en el Pipeline.</li>
                <li>Si ya existe, añade una nota cronológica al timeline del cliente sin borrar nada.</li>
                <li>Dispara una alerta en tiempo real vía WebSockets a los comerciales.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lead Magnets */}
      {activeTab === 'lead_magnets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Caja de Registro para Descarga de Lead Magnets
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Ofrece un Whitepaper, Guía en PDF, Cupón de descuento o Acceso a Webinar a cambio de captar el prospecto.
              </p>
            </div>

            <form onSubmit={handleMagnetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Selecciona el Recurso
                </label>
                <select
                  value={selectedMagnet}
                  onChange={(e) => setSelectedMagnet(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="ebook-crm-guia">📘 Guía Magistral: Implementación de CRM en PYMES (PDF)</option>
                  <option value="webinar-ventas-2026">🎥 Webinar: Automatización del Pipeline B2B</option>
                  <option value="cupon-descuento-20">🏷️ Cupón 20% de Descuento en Primera Compra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Tu Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Carlos"
                  value={magnetName}
                  onChange={(e) => setMagnetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email donde recibir el PDF</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com"
                  value={magnetEmail}
                  onChange={(e) => setMagnetEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isDownloadingMagnet}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {isDownloadingMagnet ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Generando enlace de descarga...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Descargar Recurso & Registrar Prospecto</span>
                  </>
                )}
              </button>
            </form>

            {magnetResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Recurso generado!</span>
                </div>
                <p className="text-[11px]">
                  El lead ha sido etiquetado en el CRM como suscriptor de &ldquo;{selectedMagnet}&rdquo;.
                </p>
                <a
                  href={magnetResult.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 font-bold underline pt-1 text-emerald-900 dark:text-emerald-200"
                >
                  <span>Abrir archivo descargable</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Automatización de Nutrición de Leads (Lead Nurturing)
            </h2>
            <div className="space-y-3 text-xs text-gray-600 dark:text-slate-400">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-gray-900 dark:text-white">Día 0: Entrega Inmediata</div>
                <div>El CRM envía un email transaccional con el enlace de descarga directo y crea la ficha en el módulo Contactos.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-gray-900 dark:text-white">Día 2: Caso de Éxito Relacionado</div>
                <div>El flujo de trabajo automático comprueba si el usuario abrió el PDF y envía un estudio de ROI.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-gray-900 dark:text-white">Día 5: Propuesta de Videollamada</div>
                <div>Dispara invitación directa con el Agendador de Citas del CRM.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Progressive Profiling */}
      {activeTab === 'progressive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Simulador de Perfilado Progresivo Inteligente
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Detecta si el usuario ya existe en el CRM y, en lugar de pedirle el nombre otra vez, le pide datos nuevos para calificar el lead.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Introduce el correo para comprobar la ficha en el CRM
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                  <button
                    onClick={handleProgressiveCheck}
                    disabled={isCheckingProfile}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {isCheckingProfile ? <LoadingSpinner size="xs" color="white" /> : 'Analizar'}
                  </button>
                </div>
              </div>

              {profileResult && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Estado del Contacto:
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${profileResult.known ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                      {profileResult.known ? 'USUARIO RECONOCIDO EN CRM' : 'USUARIO NUEVO'}
                    </span>
                  </div>

                  {profileResult.known ? (
                    <div className="space-y-2">
                      <div className="text-gray-600 dark:text-slate-300">
                        ¡Hola de nuevo, <strong>{profileResult.contact.firstName}</strong>!
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900/50 space-y-2">
                        <div className="font-semibold text-blue-700 dark:text-blue-300 text-[11px]">
                          ⚡ Campos adaptados progresivamente (no se le vuelve a pedir el nombre):
                        </div>
                        <div className="space-y-1.5">
                          {profileResult.nextSuggestedFields.includes('phone') && (
                            <input
                              type="tel"
                              placeholder="Tu teléfono directo"
                              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                            />
                          )}
                          {profileResult.nextSuggestedFields.includes('companySize') && (
                            <select className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                              <option>¿Tamaño de tu equipo? (1-10 empleados)</option>
                              <option>11-50 empleados</option>
                              <option>50+ empleados</option>
                            </select>
                          )}
                          {profileResult.nextSuggestedFields.includes('annualBudget') && (
                            <select className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                              <option>Presupuesto anual estimado (&lt; 5.000 €)</option>
                              <option>5.000 € - 20.000 €</option>
                              <option>&gt; 20.000 €</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Como el usuario no existe, el formulario solicita los campos básicos: Nombre, Apellidos, Email y Consentimiento.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              ¿Por qué el Perfilado Progresivo multiplica las conversiones?
            </h2>
            <div className="space-y-3 text-xs text-gray-600 dark:text-slate-400">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <div><strong>Menor fricción inicial:</strong> Formularios de 2 campos aumentan la conversión hasta un 120% en la primera interacción.</div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <div><strong>Enriquecimiento progresivo:</strong> En la segunda visita se pide el teléfono; en la tercera, el presupuesto y tamaño de empresa.</div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <div><strong>Lead Scoring automático:</strong> A medida que el prospecto completa más campos, su puntuación de lead sube en el pipeline.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: WhatsApp & Live Chat */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Botonera de WhatsApp con Captura de Lead Pre-Chat
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Al hacer clic, solicita nombre y teléfono/email antes de redirigir a WhatsApp, registrando la charla directamente en el historial del CRM.
              </p>
            </div>

            <form onSubmit={handleChatInitiate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Laura"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Teléfono Móvil (con prefijo)</label>
                <input
                  type="tel"
                  required
                  placeholder="+34 612 34 56 78"
                  value={chatPhone}
                  onChange={(e) => setChatPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="laura@empresa.com"
                  value={chatEmail}
                  onChange={(e) => setChatEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Motivo de la consulta</label>
                <input
                  type="text"
                  placeholder="Deseo presupuesto para integración de software"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Registrar Lead & Abrir WhatsApp Web</span>
              </button>
            </form>

            {chatResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold">¡Lead registrado en Omnichannel!</div>
                <div className="text-[11px]">Mensaje inicial guardado en el timeline de {chatName}.</div>
                {chatResult.whatsAppUrl && (
                  <a
                    href={chatResult.whatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 font-bold underline pt-1 text-emerald-900 dark:text-emerald-200"
                  >
                    <span>Continuar hacia WhatsApp ({chatPhone})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Widget Flotante Listo para Usar
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Añade el botón flotante de WhatsApp a tu web para capturar prospectos 24/7 sin perder el rastro de la conversación.
            </p>

            <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-[11px] overflow-x-auto font-mono leading-relaxed">
{`<!-- Botón flotante de WhatsApp DAMA-CRM -->
<div id="dama-whatsapp-bubble" 
     onclick="window.open('/lead-capture/whatsapp?agent=soporte')"
     style="position:fixed; bottom:20px; right:20px; 
            background:#25D366; color:white; padding:12px 18px; 
            border-radius:30px; box-shadow:0 4px 12px rgba(0,0,0,0.15); 
            cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:8px;">
  <span>💬 ¿Hablamos por WhatsApp?</span>
</div>`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Appointment Scheduler */}
      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Agendador de Citas Integrado (Estilo Calendly)
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Cuando el cliente reserva una reunión, se crea el contacto, la oportunidad y la reunión en el calendario del CRM.
              </p>
            </div>

            <form onSubmit={handleBookAppt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Elena Sánchez"
                  value={apptName}
                  onChange={(e) => setApptName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email Profesional</label>
                <input
                  type="email"
                  required
                  placeholder="elena@sanchezconsultores.es"
                  value={apptEmail}
                  onChange={(e) => setApptEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Modalidad</label>
                  <select
                    value={apptType}
                    onChange={(e) => setApptType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="VIDEOCALL">📹 Videollamada (Google Meet / Zoom)</option>
                    <option value="PHONE">📞 Llamada Telefónica</option>
                    <option value="IN_PERSON">🏢 Reunión Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirmar Reserva & Sincronizar en CRM</span>
              </button>
            </form>

            {apptResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{apptResult.message}</span>
                </div>
                <div className="text-[11px]">
                  Actividad creada: id={apptResult.activityId} (Tipo: MEETING)
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Integraciones con Calendarios Externos
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              DAMA-CRM se conecta bidireccionalmente con Google Calendar, Microsoft Outlook y Cal.com.
            </p>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-gray-900 dark:text-white">Enlace público de reservas del usuario:</div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border font-mono text-[11px] flex items-center justify-between">
                <span className="truncate">https://crm.tu-dominio.com/citas/ignacio</span>
                <button
                  onClick={() => handleCopy('https://crm.tu-dominio.com/citas/ignacio', 'calLink')}
                  className="text-blue-600 hover:underline font-sans ml-2 text-xs"
                >
                  {copiedKey === 'calLink' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Tracking Pixel */}
      {activeTab === 'pixel' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Píxel de Seguimiento JavaScript del CRM (Código Invisible)
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Instala este código en tu web (en el &lt;head&gt;) para que el CRM monitorice páginas vistas, clics y dwell time.
                </p>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `<script src="http://localhost:3000/api/lead-capture/pixel.js" async></script>`,
                    'pixelScript'
                  )
                }
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'pixelScript' ? '¡Copiado!' : 'Copiar Etiqueta'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-xs overflow-x-auto font-mono leading-relaxed">
{`<!-- DAMA-CRM Analytics & Lead Intelligence Pixel -->
<script src="/api/lead-capture/pixel.js" async></script>`}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-gray-900 dark:text-white">Páginas Vistas Automáticas</div>
                <div className="text-gray-500 text-[11px]">Registra cada URL y tiempo de permanencia mediante la API navigator.sendBeacon.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-gray-900 dark:text-white">Disparo de Eventos Manuales</div>
                <div className="text-gray-500 text-[11px]">Dispones de window.damaTrack(&apos;CLICK&apos;, &#123; btn: &apos;comprar&apos; &#125;) para botones clave.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 space-y-1 text-xs">
                <div className="font-bold text-gray-900 dark:text-white">Conexión con Leads</div>
                <div className="text-gray-500 text-[11px]">Cuando el usuario rellena un formulario, el historial anónimo previo se vincula a su ficha.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: E-commerce & Abandoned Cart */}
      {activeTab === 'ecommerce' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Simulador de Sincronización de Carrito Abandonado
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Si un usuario añade productos a la cesta y se marcha sin pagar, la tienda avisa al CRM para iniciar la recuperación.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Email del Comprador</label>
                <input
                  type="email"
                  placeholder="comprador@gmail.com"
                  value={cartEmail}
                  onChange={(e) => setCartEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Importe del Carrito (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cartTotal}
                  onChange={(e) => setCartTotal(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                onClick={handleSimulateCart}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Simular Abandono de Carrito en CRM</span>
              </button>
            </div>

            {cartResult && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold">¡Evento de Carrito Registrado!</div>
                <div className="text-[11px]">{cartResult.message}</div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Historial de Compras en Tiempo Real & Clientes VIP
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Conectores oficiales listos para WooCommerce, Shopify, Prestashop y Magento:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Shopify Webhook Connector</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Activo</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">WooCommerce REST Sync</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Activo</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">PrestaShop Order Engine</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Activo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
