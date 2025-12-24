import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const Inventory: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);
    const res = await apiRequest('/inventory');
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSimulateWebhook = async () => {
    setSyncStatusMsg('Enviando webhook POST /api/inventory/webhooks/unopim...');
    const randomStock = Math.floor(Math.random() * 80) + 10;
    const res = await apiRequest('/inventory/webhooks/unopim', {
      method: 'POST',
      body: JSON.stringify({
        event: 'product.updated',
        product: {
          id: 'UNOPIM-DEMO-99',
          sku: 'SRV-CLOUD-M',
          name: 'Instancia Cloud Gestionada M (Oracle Cloud)',
          price: 1450.0,
          stock: randomStock,
          category: 'Servicios Cloud',
        },
      }),
    });

    if (res.success) {
      setSyncStatusMsg(`✅ Webhook procesado: Stock de SRV-CLOUD-M actualizado instantáneamente a ${randomStock} uds.`);
      loadProducts();
    } else {
      setSyncStatusMsg(`❌ Error: ${res.message}`);
    }
  };

  const handleNightlySync = async () => {
    setSyncStatusMsg('Ejecutando barrido de consistencia...');
    const res = await apiRequest('/inventory/sync/nightly', { method: 'POST' });
    if (res.success) {
      setSyncStatusMsg(`✅ ${res.message}`);
      loadProducts();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('inventory')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Microservicio de sincronización de catálogo con UnoPIM y stock en tiempo real
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateWebhook}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Simular POST entrante de UnoPIM"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simular Webhook UnoPIM</span>
          </button>

          <button
            onClick={handleNightlySync}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Barrido Nocturno (Cron)</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg('')} className="text-blue-500 hover:text-blue-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">ID UnoPIM Externo</th>
                <th className="px-4 py-3">Nombre del Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Precio PVP</th>
                <th className="px-4 py-3 text-right">Estado Sincronización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                    {p.externalId || '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">{p.category || 'General'}</td>
                  <td className="px-4 py-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        p.stock > 10
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}
                    >
                      {p.stock} uds
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {p.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Sincronizado UnoPIM
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
