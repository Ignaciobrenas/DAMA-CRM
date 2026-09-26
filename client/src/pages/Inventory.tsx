import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const Inventory: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Search & Filter & Sort
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [barcode, setBarcode] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

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
      toast.success('Webhook UnoPIM sincronizado', `Stock de SRV-CLOUD-M actualizado a ${randomStock} uds.`);
      setSyncStatusMsg(`✅ Webhook procesado: Stock de SRV-CLOUD-M actualizado instantáneamente a ${randomStock} uds.`);
      loadProducts();
    } else {
      toast.error('Fallo en Webhook UnoPIM', res.message || 'Error de sincronización');
      setSyncStatusMsg(`❌ Error: ${res.message}`);
    }
  };

  const handleNightlySync = async () => {
    setSyncStatusMsg('Ejecutando barrido de consistencia...');
    const res = await apiRequest('/inventory/sync/nightly', { method: 'POST' });
    if (res.success) {
      toast.success('Sincronización completada', res.message || 'Barrido nocturno realizado.');
      setSyncStatusMsg(`✅ ${res.message}`);
      loadProducts();
    } else {
      toast.error('Error de barrido', res.message || 'Fallo al ejecutar sincronización.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!sku.trim() || !name.trim()) {
      setFormError('El SKU y el nombre del producto son campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || 'General',
        price: parseFloat(price) || 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock, 10) || 0,
        barcode: barcode.trim() || null,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Producto creado', `${name} ha sido añadido al catálogo.`);
      setIsModalOpen(false);
      setSku('');
      setName('');
      setDescription('');
      setCategory('');
      setPrice('');
      setCostPrice('');
      setStock('1');
      setBarcode('');
      loadProducts();
    } else {
      setFormError(res.message || 'Error al crear producto');
    }
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setEditSku(product.sku || '');
    setEditName(product.name || '');
    setEditDescription(product.description || '');
    setEditCategory(product.category || '');
    setEditPrice(String(product.price || 0));
    setEditCostPrice(product.costPrice ? String(product.costPrice) : '');
    setEditStock(String(product.stock || 0));
    setEditBarcode(product.barcode || '');
    setEditFormError('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditFormError('');

    if (!editSku.trim() || !editName.trim()) {
      setEditFormError('El SKU y el nombre son campos obligatorios.');
      return;
    }

    setIsUpdating(true);
    const res = await apiRequest(`/inventory/${editingProduct.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sku: editSku.trim().toUpperCase(),
        name: editName.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || 'General',
        price: parseFloat(editPrice) || 0,
        costPrice: editCostPrice ? parseFloat(editCostPrice) : null,
        stock: parseInt(editStock, 10) || 0,
        barcode: editBarcode.trim() || null,
      }),
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success('Producto actualizado', `${editName} ha sido modificado.`);
      setEditingProduct(null);
      loadProducts();
    } else {
      setEditFormError(res.message || 'Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    const res = await apiRequest(`/inventory/${deletingProduct.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success('Producto eliminado', `${deletingProduct.name} fue retirado del catálogo.`);
      setDeletingProduct(null);
      loadProducts();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el producto.');
    }
  };

  // Filter & sort products
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const sku = (p.sku || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const ext = (p.externalId || '').toLowerCase();
          if (!sku.includes(q) && !name.includes(q) && !cat.includes(q) && !ext.includes(q)) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'ALL') {
          if ((p.category || '').trim() !== categoryFilter) return false;
        }

        // Stock filter
        if (stockFilter === 'IN_STOCK' && p.stock <= 10) return false;
        if (stockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock > 10)) return false;
        if (stockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'NAME_DESC') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'SKU_ASC') return (a.sku || '').localeCompare(b.sku || '');
        if (sortBy === 'PRICE_DESC') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'PRICE_ASC') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'STOCK_DESC') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'STOCK_ASC') return (a.stock || 0) - (b.stock || 0);
        return 0;
      });
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('inventory')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Microservicio de sincronización de catálogo con UnoPIM, stock en tiempo real y CRUD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('inventory.newProduct')}</span>
          </button>

          <button
            onClick={handleSimulateWebhook}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Simular POST entrante de UnoPIM"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('inventory.simulateUnoPimWebhook')}</span>
          </button>

          <button
            onClick={handleNightlySync}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('inventory.nightlySweep')}</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between animate-in fade-in">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg('')} className="text-blue-500 hover:text-blue-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Toolbar Filters & Sorting */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventory.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 max-w-[170px] truncate"
            >
              <option value="ALL">{t('inventory.allCategories')}</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">{t('inventory.allStock')}</option>
            <option value="IN_STOCK">En Stock (&gt; 10 uds)</option>
            <option value="LOW_STOCK">Stock Bajo (1 - 10 uds)</option>
            <option value="OUT_OF_STOCK">Agotado (0 uds)</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 hidden sm:inline">{t('inventory.sortBy')}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="NAME_ASC">{t('inventory.sortNameAsc')}</option>
            <option value="NAME_DESC">{t('inventory.sortNameDesc')}</option>
            <option value="SKU_ASC">{t('inventory.sortSkuAsc')}</option>
            <option value="PRICE_DESC">{t('inventory.sortPriceDesc')}</option>
            <option value="PRICE_ASC">{t('inventory.sortPriceAsc')}</option>
            <option value="STOCK_DESC">{t('inventory.sortStockDesc')}</option>
            <option value="STOCK_ASC">{t('inventory.sortStockAsc')}</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{t('inventory.skuCol')}</th>
                <th className="px-4 py-3">{t('inventory.unopimIdCol')}</th>
                <th className="px-4 py-3">{t('inventory.productNameCol')}</th>
                <th className="px-4 py-3">{t('inventory.categoryCol')}</th>
                <th className="px-4 py-3">{t('inventory.stockCol')}</th>
                <th className="px-4 py-3">{t('inventory.pricePvpCol')}</th>
                <th className="px-4 py-3">{t('inventory.syncCol')}</th>
                <th className="px-4 py-3 text-right">{t('inventory.actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No se encontraron productos coincidentes con los filtros.
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((p) => (
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
                            : p.stock > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        {p.stock} uds
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {p.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-3">
                      {p.isSync ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> UnoPIM Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                          Local CRM
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Editar Producto"
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          title="Eliminar Producto"
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('inventory.addProductModalTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SRV-PRO-01"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.categoryCol')}</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Servicios Cloud"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre del Producto / Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Licencia Antivirus Endpoint Enterprise"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.pricePvp')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="120.00"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.costPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="80.00"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.stockCol')}</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.description')}</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('inventory.descriptionPlaceholder')}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('inventory.editProductModalTitle')}</h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.categoryCol')}</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre del Producto / Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.pricePvp')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.costPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.stockCol')}</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('inventory.description')}</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('inventory.deleteProductModalTitle')}</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar el producto{' '}
              <strong className="text-gray-900 dark:text-white">{deletingProduct.name}</strong> ({deletingProduct.sku})?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
