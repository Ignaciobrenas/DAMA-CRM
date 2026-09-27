import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Copy,
  Check,
  Zap,
  Mail,
  Send,
  ExternalLink,
  X,
  Play,
  Terminal,
  Shield,
  Layers,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../services/api';

interface ApiConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'snippets' | 'tester' | 'emails';
}

export const ApiConfiguratorModal: React.FC<ApiConfiguratorModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'snippets',
}) => {
  const toast = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'snippets' | 'tester' | 'emails'>(defaultTab);

  // Snippets state
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'contacts' | 'deals' | 'inventory' | 'n8n' | 'webhooks'>('contacts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Tester state
  const [testEvent, setTestEvent] = useState('deal.won');
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        id: 'deal-101',
        title: 'Acuerdo Corporativo Enterprise 2026',
        value: 28500,
        currency: 'EUR',
        customer: {
          name: 'Empresa Cliente S.L.',
          email: 'contacto@cliente.com',
          phone: '+34 600 123 456',
        },
      },
      null,
      2
    )
  );
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Email Studio state
  const [emailTemplate, setEmailTemplate] = useState<'2fa_otp' | 'welcome_invitation' | 'quote_signature' | 'invoice_issued' | 'alert_notification'>('2fa_otp');
  const [testRecipient, setTestRecipient] = useState('admin@dama-crm.local');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copiado', 'Fragmento copiado al portapapeles');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCodeSnippet = () => {
    const origin = window.location.origin;
    const apiUrl = `${origin}/api`;

    if (selectedLanguage === 'curl') {
      switch (selectedEndpoint) {
        case 'contacts':
          return `curl -X POST "${apiUrl}/contacts" \\
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Carlos",
    "lastName": "Mendoza",
    "email": "carlos.mendoza@empresa.com",
    "phone": "+34 611 223 344",
    "isLead": false
  }'`;
        case 'deals':
          return `curl -X POST "${apiUrl}/deals" \\
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Licencia ERP Anual",
    "value": 12500,
    "currency": "EUR",
    "stageId": "stage-won"
  }'`;
        case 'inventory':
          return `curl -X POST "${apiUrl}/inventory/products" \\
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sku": "SRV-CLOUD-01",
    "name": "Servidor Cloud Dedicado",
    "price": 450.00,
    "stock": 15,
    "category": "Cloud & Infraestructura"
  }'`;
        case 'n8n':
          return `curl -X POST "${apiUrl}/integrations/n8n/action" \\
  -H "Authorization: Bearer <TU_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create_contact",
    "payload": {
      "firstName": "Lead n8n",
      "email": "lead@n8n.workflow",
      "isLead": true
    }
  }'`;
        case 'webhooks':
          return `curl -X POST "${apiUrl}/integrations/webhooks/unopim" \\
  -H "x-unopim-signature: sha256=abcdef..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "product.updated",
    "sku": "PROD-2026-X",
    "data": { "name": "Producto UnoPIM", "price": 99.00 }
  }'`;
      }
    }

    if (selectedLanguage === 'node') {
      return `import axios from 'axios';

const client = axios.create({
  baseURL: '${apiUrl}',
  headers: {
    'Authorization': 'Bearer <TU_JWT_TOKEN>',
    'Content-Type': 'application/json'
  }
});

async function main() {
  const response = await client.post('/${selectedEndpoint === 'webhooks' ? 'integrations/n8n/action' : selectedEndpoint}', {
    title: 'Nueva Operación Sincronizada',
    source: 'Node.js SDK'
  });
  console.log('Respuesta CRM:', response.data);
}

main().catch(console.error);`;
    }

    if (selectedLanguage === 'python') {
      return `import requests

API_URL = "${apiUrl}"
TOKEN = "<TU_JWT_TOKEN>"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "source": "Python Automation",
    "status": "ACTIVE"
}

response = requests.post(f"{API_URL}/${selectedEndpoint}", json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())`;
    }

    if (selectedLanguage === 'php') {
      return `<?php
$apiUrl = "${apiUrl}/${selectedEndpoint}";
$token = "<TU_JWT_TOKEN>";

$data = [
    "source" => "OpenCart / PHP Plugin",
    "created_at" => date('Y-m-d H:i:s')
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

echo "Respuesta DAMA-CRM: " . $response;
?>`;
    }

    return '';
  };

  const handleRunLiveTest = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch {
        toast.error('JSON Inválido', 'Corrige la sintaxis JSON del payload antes de enviar.');
        setIsTesting(false);
        return;
      }

      const res = await apiRequest('/integrations/n8n/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_deal',
          payload: parsed,
        }),
      });

      setTestResponse({
        status: res.success ? 200 : 400,
        timestamp: new Date().toISOString(),
        data: res,
      });

      if (res.success) {
        toast.success('Test Exitoso', 'El evento API fue procesado y registrado correctamente.');
      } else {
        toast.error('Error en Test', res.message || 'La API devolvió un estado no exitoso.');
      }
    } catch (err: any) {
      setTestResponse({
        status: 500,
        error: err.message,
      });
      toast.error('Error de Conexión', err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await apiRequest('/integrations/email/test', {
        method: 'POST',
        body: JSON.stringify({
          to: testRecipient,
          template: emailTemplate,
          variables: {
            userName: 'Ignacio Administrador',
            otpCode: '849201',
            quoteNumber: 'PRE-2026-0042',
            totalAmount: '4.850,00 €',
            invoiceNumber: 'FAC-2026-0128',
            dueDate: '15 de Octubre de 2026',
            actionUrl: `${window.location.origin}/#/invoicing`,
            signatureUrl: `${window.location.origin}/#/quote/sign/test-token-2026`,
          },
        }),
      });

      if (res.success) {
        toast.success(
          'Email Enviado',
          `Plantilla "${emailTemplate}" enviada a ${testRecipient}. Revisa Mailpit en http://localhost:8025`
        );
      } else {
        toast.error('Error de Envío', res.message || 'No se pudo enviar el correo.');
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configurador de APIs &amp; Automatizaciones
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generador interactivo de snippets, pruebas de webhooks en vivo y plantillas de correo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/30 px-5 gap-4">
            <button
              onClick={() => setActiveTab('snippets')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'snippets'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Snippets de Conexión (cURL / JS / Python / PHP)</span>
            </button>
            <button
              onClick={() => setActiveTab('tester')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'tester'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Probador de Webhooks en Vivo</span>
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
                activeTab === 'emails'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Plantillas de Correo &amp; Servidor SMTP</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(92vh-180px)] space-y-6">
            {/* TAB 1: SNIPPETS */}
            {activeTab === 'snippets' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Select Endpoint */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Endpoint:</span>
                    <select
                      value={selectedEndpoint}
                      onChange={(e: any) => setSelectedEndpoint(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="contacts">POST /api/contacts (Crear Contacto)</option>
                      <option value="deals">POST /api/deals (Crear Trato Comercial)</option>
                      <option value="inventory">POST /api/inventory/products (Crear Producto)</option>
                      <option value="n8n">POST /api/integrations/n8n/action (n8n Action Runner)</option>
                      <option value="webhooks">POST /api/integrations/webhooks/unopim (UnoPIM Webhook)</option>
                    </select>
                  </div>

                  {/* Language Selector */}
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                    {(['curl', 'node', 'python', 'php'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition ${
                          selectedLanguage === lang
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Box */}
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                  <button
                    onClick={() => handleCopy(getCodeSnippet(), 'snippet')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1"
                  >
                    {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{copiedKey === 'snippet' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <pre className="pr-16 leading-relaxed whitespace-pre-wrap">{getCodeSnippet()}</pre>
                </div>

                {/* OpenAPI & Docs Quick Links */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Documentación OpenAPI / Swagger</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Explora todos los esquemas de datos, parámetros y respuestas en Swagger UI.
                      </p>
                    </div>
                  </div>
                  <a
                    href="http://localhost:4000/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    <span>Abrir Swagger</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE TESTER */}
            {activeTab === 'tester' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tipo de Disparador / Evento:
                    </label>
                    <select
                      value={testEvent}
                      onChange={(e) => setTestEvent(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="deal.won">deal.won (Trato Ganado)</option>
                      <option value="contact.created">contact.created (Nuevo Contacto)</option>
                      <option value="invoice.paid">invoice.paid (Factura Cobrada)</option>
                      <option value="product.updated">product.updated (Catálogo UnoPIM/OpenCart)</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleRunLiveTest}
                      disabled={isTesting}
                      className="w-full md:w-auto px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center space-x-2 shadow-xs"
                    >
                      {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{isTesting ? 'Ejecutando...' : 'Lanzar Test en Vivo'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payload JSON de Prueba:
                  </label>
                  <textarea
                    rows={7}
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {testResponse && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                      <span>Resultado HTTP: <strong className={testResponse.status === 200 ? 'text-emerald-400' : 'text-rose-400'}>{testResponse.status}</strong></span>
                      <span>{testResponse.timestamp}</span>
                    </div>
                    <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(testResponse.data || testResponse.error, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EMAIL STUDIO */}
            {activeTab === 'emails' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Plantilla de Correo:
                    </label>
                    <select
                      value={emailTemplate}
                      onChange={(e: any) => setEmailTemplate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="2fa_otp">🔐 Verificación 2FA OTP (Código de Seguridad)</option>
                      <option value="welcome_invitation">👋 Invitación y Bienvenida a Empresa</option>
                      <option value="quote_signature">✍️ Presupuesto para Firma Digital</option>
                      <option value="invoice_issued">📑 Factura Emitida con Vencimiento</option>
                      <option value="alert_notification">⚠️ Alerta Operativa / SLA Helpdesk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Destinatario de Prueba:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={handleSendTestEmail}
                        disabled={isSendingEmail}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center space-x-1 shrink-0"
                      >
                        {isSendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mailpit Banner */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bandeja de Pruebas Local (Mailpit Docker)</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Los correos se capturan en el servidor SMTP de prueba sin salir a internet. Puerto SMTP: 1025 | Web: 8025
                      </p>
                    </div>
                  </div>
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                  >
                    <span>Ver Mailpit UI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
            <span>DAMA-CRM Integration Hub • SSL Ready • Multi-Tenant</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
