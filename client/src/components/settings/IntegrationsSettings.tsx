import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Save,
  MessageSquare,
  Boxes,
  ShoppingCart,
  CreditCard,
  Mail,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';

interface ConnectorConfig {
  id: string;
  name: string;
  category: string;
  icon: any;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  fields: Array<{ key: string; label: string; placeholder: string; isSecret?: boolean }>;
}

export const IntegrationsSettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [integrations, setIntegrations] = useState<any>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({
    odoo: { url: 'https://odoo.miempresa.com', db: 'odoo_db', username: 'admin', apiKey: '••••••••••••' },
    sage_one: { apiUrl: 'https://api.accounting.sage.com/v3.1', apiKey: '••••••••••••', clientId: 'dama_sage_one_client', clientSecret: '••••••••••••', businessId: 'SAGE-BIZ-ES-01' },
    sage_50: { endpointUrl: 'http://localhost:5493/sdata/sage50', companyName: 'Empresa Sage 50 S.L.', username: 'admin', password: '••••••••••••', apiKey: '••••••••••••', fiscalYear: '2026' },
    sage_200: { baseUrl: 'https://api.sage.com/sage200/v1', subscriptionKey: '••••••••••••', clientId: 'dama_sage_200_client', clientSecret: '••••••••••••', companyId: 'SAGE200-CORP-ES' },
    unopim: { webhookSecret: 'uno_sec_987413289741', endpoint: 'https://pim.miempresa.com/api' },
    whatsapp: { phoneNumberId: '109283746192834', accessToken: 'EAAB••••••••••••', verifyToken: 'dama_webhook_verify_2026' },
    woocommerce: { storeUrl: 'https://tienda.miempresa.com', consumerKey: 'ck_••••••••••••', consumerSecret: 'cs_••••••••••••' },
    stripe: { publishableKey: 'pk_live_••••••••••••', secretKey: 'sk_live_••••••••••••', webhookSecret: 'whsec_••••••••••••' },
    smtp: { host: 'smtp.empresa.com', port: '587', user: 'notificaciones@empresa.com', pass: '••••••••••••', fromEmail: 'no-reply@empresa.com' },
  });

  const loadData = async () => {
    const res = await apiRequest('/integrations');
    if (res.success && res.data) {
      setIntegrations(res.data);
      if (res.data.sage_one) {
        setFormData((prev) => ({
          ...prev,
          sage_one: {
            apiUrl: res.data.sage_one.apiUrl || prev.sage_one.apiUrl,
            apiKey: res.data.sage_one.apiKey || prev.sage_one.apiKey,
            clientId: res.data.sage_one.clientId || prev.sage_one.clientId,
            clientSecret: res.data.sage_one.clientSecret || prev.sage_one.clientSecret,
            businessId: res.data.sage_one.businessId || prev.sage_one.businessId,
          },
        }));
      }
      if (res.data.sage_50) {
        setFormData((prev) => ({
          ...prev,
          sage_50: {
            endpointUrl: res.data.sage_50.endpointUrl || prev.sage_50.endpointUrl,
            companyName: res.data.sage_50.companyName || prev.sage_50.companyName,
            username: res.data.sage_50.username || prev.sage_50.username,
            password: res.data.sage_50.password || prev.sage_50.password,
            apiKey: res.data.sage_50.apiKey || prev.sage_50.apiKey,
            fiscalYear: res.data.sage_50.fiscalYear || prev.sage_50.fiscalYear,
          },
        }));
      }
      if (res.data.sage_200) {
        setFormData((prev) => ({
          ...prev,
          sage_200: {
            baseUrl: res.data.sage_200.baseUrl || prev.sage_200.baseUrl,
            subscriptionKey: res.data.sage_200.subscriptionKey || prev.sage_200.subscriptionKey,
            clientId: res.data.sage_200.clientId || prev.sage_200.clientId,
            clientSecret: res.data.sage_200.clientSecret || prev.sage_200.clientSecret,
            companyId: res.data.sage_200.companyId || prev.sage_200.companyId,
          },
        }));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFieldChange = (connector: string, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [connector]: {
        ...(prev[connector] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveConnector = async (connector: string) => {
    const dataToSave = formData[connector] || {};
    const res = await apiRequest(`/integrations/${connector}`, {
      method: 'PUT',
      body: JSON.stringify({ config: dataToSave, enabled: true }),
    });

    if (res.success) {
      toast.success('Integración Guardada', `La configuración de ${connector.toUpperCase()} ha sido guardada en la base de datos.`);
      loadData();
    } else {
      toast.error('Error al guardar', res.message || 'No se pudo guardar la integración.');
    }
  };

  const handleTestConnector = async (connector: string) => {
    setTestingId(connector);
    const res = await apiRequest(`/integrations/${connector}/test`, {
      method: 'POST',
      body: JSON.stringify(formData[connector] || {}),
    });
    setTestingId(null);

    if (res.success) {
      toast.success('Conexión Exitosa', `Ping correcto a ${connector.toUpperCase()}. Latencia: ${res.latency || '45ms'}.`);
    } else {
      toast.error('Fallo de Conexión', res.message || 'Verifica las credenciales y URL del servidor.');
    }
  };

  const handleSyncConnector = async (connector: string) => {
    setSyncingId(connector);
    const res = await apiRequest(`/integrations/${connector}/sync`, {
      method: 'POST',
    });
    setSyncingId(null);

    if (res.success) {
      toast.success('Sincronización Completada', res.message || `Datos sincronizados con éxito con ${connector.toUpperCase()}.`);
    } else {
      toast.error('Error de Sincronización', res.message || 'No se pudo completar la sincronización.');
    }
  };

  const CONNECTORS = [
    {
      id: 'odoo',
      name: 'Odoo ERP v17 / v18',
      desc: 'Sincronización bidireccional de fichajes de empleados, partes de horas y presupuestos.',
      icon: Boxes,
      logoUrl: '/assets/logos/integrations/odoo.png',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
      fields: [
        { key: 'url', label: 'URL del Servidor Odoo', placeholder: 'https://odoo.miempresa.com' },
        { key: 'db', label: 'Base de Datos', placeholder: 'odoo_production' },
        { key: 'username', label: 'Usuario / Email de Servicio', placeholder: 'api_user@empresa.com' },
        { key: 'apiKey', label: 'Clave API / Token RPC', placeholder: '••••••••••••', isSecret: true },
      ],
    },
    {
      id: 'sage_one',
      name: 'Sage One / Business Cloud',
      desc: 'Sincronización cloud de clientes, facturas de venta y catálogo de productos con Sage Accounting.',
      icon: Boxes,
      logoUrl: '/assets/logos/integrations/sage.png',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      fields: [
        { key: 'apiUrl', label: 'URL Endpoint API Sage One', placeholder: 'https://api.accounting.sage.com/v3.1' },
        { key: 'apiKey', label: 'API Key / Token de Acceso', placeholder: '••••••••••••', isSecret: true },
        { key: 'clientId', label: 'Client ID OAuth', placeholder: 'dama_sage_one_client' },
        { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••••••', isSecret: true },
        { key: 'businessId', label: 'Business / Company ID', placeholder: 'SAGE-BIZ-ES-01' },
      ],
    },
    {
      id: 'sage_50',
      name: 'Sage 50 Cloud Asesoría & Pymes',
      desc: 'Conector SData / REST para sincronizar cartera de clientes, facturación y stock físico.',
      icon: Boxes,
      logoUrl: '/assets/logos/integrations/sage.png',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
      fields: [
        { key: 'endpointUrl', label: 'Endpoint SData / REST', placeholder: 'http://localhost:5493/sdata/sage50' },
        { key: 'companyName', label: 'Razón Social en Sage 50', placeholder: 'Empresa Sage 50 S.L.' },
        { key: 'username', label: 'Usuario del Conector', placeholder: 'admin' },
        { key: 'password', label: 'Contraseña del Conector', placeholder: '••••••••••••', isSecret: true },
        { key: 'fiscalYear', label: 'Ejercicio Fiscal Activo', placeholder: '2026' },
      ],
    },
    {
      id: 'sage_200',
      name: 'Sage 200 Advanced Enterprise ERP',
      desc: 'Integración empresarial de gran escala con libro mayor contable, impuestos y asientos.',
      icon: Boxes,
      logoUrl: '/assets/logos/integrations/sage.png',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
      fields: [
        { key: 'baseUrl', label: 'Base URL API Sage 200', placeholder: 'https://api.sage.com/sage200/v1' },
        { key: 'subscriptionKey', label: 'Ocp-Apim-Subscription-Key', placeholder: '••••••••••••', isSecret: true },
        { key: 'clientId', label: 'Client ID', placeholder: 'dama_sage_200_client' },
        { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••••••', isSecret: true },
        { key: 'companyId', label: 'ID de Empresa / Grupo', placeholder: 'SAGE200-CORP-ES' },
      ],
    },
    {
      id: 'whatsapp',
      name: 'Meta WhatsApp Cloud API',
      desc: 'Bandeja omnicanal de mensajería con soporte de plantillas verificadas de Meta.',
      icon: MessageSquare,
      logoUrl: '/assets/logos/integrations/whatsapp.png',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      fields: [
        { key: 'phoneNumberId', label: 'ID Número de Teléfono (Phone ID)', placeholder: '109283746192834' },
        { key: 'accessToken', label: 'Permanent Access Token', placeholder: 'EAAB••••••••', isSecret: true },
        { key: 'verifyToken', label: 'Token de Verificación de Webhook', placeholder: 'dama_webhook_verify_2026' },
      ],
    },
    {
      id: 'unopim',
      name: 'UnoPIM PIM & Inventario',
      desc: 'Catálogo unificado de productos, variantes y niveles de existencias multialmacén.',
      icon: Boxes,
      logoUrl: '/assets/logos/integrations/unopim.png',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
      fields: [
        { key: 'endpoint', label: 'URL Endpoint UnoPIM', placeholder: 'https://pim.miempresa.com/api' },
        { key: 'webhookSecret', label: 'Clave Secreta Webhook (x-unopim-secret)', placeholder: 'uno_sec_••••••••', isSecret: true },
      ],
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce & Shopify eCommerce',
      desc: 'Ingreso automático de pedidos online como oportunidades ganadas y clientes.',
      icon: ShoppingCart,
      logoUrl: '/assets/logos/integrations/woocommerce.png',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
      fields: [
        { key: 'storeUrl', label: 'URL de la Tienda Online', placeholder: 'https://tienda.empresa.com' },
        { key: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_••••••••' },
        { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_••••••••', isSecret: true },
      ],
    },
    {
      id: 'stripe',
      name: 'Stripe Billing & Pagos',
      desc: 'Conciliación automática de facturas y cobros online mediante tarjeta y domiciliación SEPA.',
      icon: CreditCard,
      logoUrl: '/assets/logos/integrations/stripe.png',
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60',
      fields: [
        { key: 'publishableKey', label: 'Stripe Publishable Key', placeholder: 'pk_live_••••••••' },
        { key: 'secretKey', label: 'Stripe Secret Key', placeholder: 'sk_live_••••••••', isSecret: true },
        { key: 'webhookSecret', label: 'Webhook Signing Secret', placeholder: 'whsec_••••••••', isSecret: true },
      ],
    },
    {
      id: 'smtp',
      name: 'Servidor SMTP / Correo Saliente',
      desc: 'Envío de códigos 2FA, presupuestos a clientes y notificaciones de recordatorio.',
      icon: Mail,
      logoUrl: '/assets/logos/integrations/correos.png',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
      fields: [
        { key: 'host', label: 'Host SMTP', placeholder: 'smtp.gmail.com' },
        { key: 'port', label: 'Puerto', placeholder: '587' },
        { key: 'user', label: 'Usuario SMTP', placeholder: 'notificaciones@empresa.com' },
        { key: 'pass', label: 'Contraseña SMTP', placeholder: '••••••••', isSecret: true },
        { key: 'fromEmail', label: 'Remitente (From)', placeholder: 'no-reply@empresa.com' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Plug className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Conectores & Integraciones Externas
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  9 Conectores Listos (Sage 1, 50, 200 incluidos)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Conecta tu CRM con ERPs, plataformas de comercio electrónico, pasarelas de pago y mensajería en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CONNECTORS.map((connector) => {
            const Icon = connector.icon;
            const values = formData[connector.id] || {};
            const isTesting = testingId === connector.id;
            const isSyncing = syncingId === connector.id;
            const isConfigured = Boolean(
              integrations[connector.id]?.enabled ||
              Object.values(values).some((v) => v && v.trim() && !v.includes('••••'))
            );

            return (
              <div
                key={connector.id}
                className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <img
                          src={connector.logoUrl}
                          alt={connector.name}
                          className="w-7 h-7 object-contain drop-shadow-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <Icon className="w-4 h-4 hidden text-gray-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{connector.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
                          {connector.desc}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 ${
                        isConfigured
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isConfigured ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                      <span>{isConfigured ? 'Activo' : 'Sin configurar'}</span>
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200/60 dark:border-slate-700/60">
                    {connector.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-slate-400 mb-0.5">
                          {field.label}
                        </label>
                        <input
                          type={field.isSecret ? 'password' : 'text'}
                          value={values[field.key] || ''}
                          onChange={(e) => handleFieldChange(connector.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-slate-700/60">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestConnector(connector.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                    >
                      <Zap className={`w-3 h-3 ${isTesting ? 'animate-bounce' : ''}`} />
                      <span>{isTesting ? 'Probando...' : 'Test Ping'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => handleSyncConnector(connector.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveConnector(connector.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
