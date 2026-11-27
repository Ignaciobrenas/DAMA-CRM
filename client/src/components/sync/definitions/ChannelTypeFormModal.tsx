import React, { useEffect, useState } from 'react';
import { Layers, X } from 'lucide-react';
import {
  ChannelCapabilitiesDto,
  SyncChannelTypeDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface ChannelTypeFormModalProps {
  isOpen: boolean;
  editingType: SyncChannelTypeDto | null;
  onClose: () => void;
  onSaved: () => void;
}

const CAPABILITY_KEYS: Array<{ key: keyof ChannelCapabilitiesDto; label: string }> = [
  { key: 'products', label: 'Productos' },
  { key: 'prices', label: 'Precios' },
  { key: 'tariffs', label: 'Tarifas B2B' },
  { key: 'stock', label: 'Stock' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'shipments', label: 'Envíos' },
  { key: 'returns', label: 'Devoluciones' },
  { key: 'delivery_notes', label: 'Albaranes' },
  { key: 'customers', label: 'Clientes' },
  { key: 'companies', label: 'Empresas' },
  { key: 'contacts', label: 'Contactos' },
  { key: 'deals', label: 'Oportunidades' },
  { key: 'invoices', label: 'Facturas' },
  { key: 'credit_notes', label: 'Abonos' },
  { key: 'discounts', label: 'Descuentos' },
];

export const ChannelTypeFormModal: React.FC<ChannelTypeFormModalProps> = ({
  isOpen,
  editingType,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SyncChannelTypeDto['type']>('B2C');
  const [connectorKey, setConnectorKey] = useState('');
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingType) {
      setName(editingType.name);
      setDescription(editingType.description || '');
      setType(editingType.type);
      setConnectorKey(editingType.connectorKey || '');
      setCapabilities({ ...editingType.capabilities });
    } else {
      setName('');
      setDescription('');
      setType('B2C');
      setConnectorKey('');
      setCapabilities({
        products: true,
        prices: true,
        stock: true,
        orders: true,
        categories: true,
        customers: true,
      });
    }
  }, [isOpen, editingType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        type,
        connectorKey: connectorKey || null,
        capabilities,
      };
      const res = editingType
        ? await syncHubService.updateChannelType(editingType.id, payload)
        : await syncHubService.createChannelType(payload);

      if (!res.success) {
        setError(res.message || 'No se pudo guardar el tipo de canal');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingType ? 'Editar Tipo de Canal' : 'Nuevo Tipo de Canal'}
              </h3>
              <p className="text-xs text-slate-500">Define plataforma, conector nativo y matriz de capacidades</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: SAP Business One, Magento 2..."
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="B2C">B2C (E-Commerce)</option>
                <option value="B2B">B2B (Portal Mayorista)</option>
                <option value="ERP">ERP (Gestión & Contabilidad)</option>
                <option value="3PL">3PL (Logística & Transporte)</option>
                <option value="CRM">CRM Externo</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conector Nativo DAMA-CRM (Opcional)
              </label>
              <select
                value={connectorKey}
                onChange={(e) => setConnectorKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="">Genérico (HTTP / Webhook / Archivo)</option>
                <option value="a3erp">a3ERP (Sit.a3ERP.Api REST)</option>
                <option value="sage_200">Sage 200 (REST TmpIME + GraphQL)</option>
                <option value="prestashop">PrestaShop (Webservice + Admin API 9)</option>
                <option value="shopify">Shopify (GraphQL Admin API)</option>
                <option value="woocommerce">WooCommerce (REST API v3)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              Capacidades Soportadas
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAPABILITY_KEYS.map((cap) => (
                <label
                  key={cap.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    capabilities[cap.key]
                      ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(capabilities[cap.key])}
                    onChange={(e) =>
                      setCapabilities((prev) => ({ ...prev, [cap.key]: e.target.checked }))
                    }
                  />
                  <span>{cap.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
            >
              {saving ? 'Guardando...' : 'Guardar Tipo de Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
