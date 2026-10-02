import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Barcode,
  MapPin,
  Tag,
  Building2,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Info,
  History,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { integrationsService } from '../services/integrations.service';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { soundService } from '../services/sound';
import { ExcelCsvImportModal } from '../components/common/ExcelCsvImportModal';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  stock: number;
  minStock: number;
  maxStock?: number | null;
  unit: string;
  category?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  images?: string | null;
  location?: string | null;
  supplierName?: string | null;
  supplierSku?: string | null;
  taxRate: number;
  weight?: number | null;
  dimensions?: string | null;
  brand?: string | null;
  tags?: string | null;
  isActive: boolean;
  notes?: string | null;
  isSync: boolean;
  lastSyncedAt?: string | null;
  attributes?: string | Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovementItem[];
  _count?: {
    stockMovements: number;
  };
}

export interface StockMovementItem {
  id: string;
  productId: string;
  type: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null;
  performedBy?: string | null;
  createdAt: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  costValuation: number;
  retailValuation: number;
  marginPotential: number;
  grossMarginPercent: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCounts: Record<string, number>;
}

export const Inventory: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { hasPermission } = useAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Stores online activas
  const [activeStores, setActiveStores] = useState<Array<{ id: string; name: string }>>([
    { id: 'unopim', name: 'UnoPIM (Catálogo Central)' },
  ]);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [connectorFilter, setConnectorFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');

  // Multi-App Attribute Auto-Mapping State
  const [isBulkMapping, setIsBulkMapping] = useState(false);
  const [isProductMapping, setIsProductMapping] = useState(false);
  const [copiedRawJson, setCopiedRawJson] = useState(false);

  // Detail Pop-up Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [detailTab, setDetailTab] = useState<'general' | 'financials' | 'attributes' | 'movements' | 'supplier'>('general');
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [productMovements, setProductMovements] = useState<StockMovementItem[]>([]);

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'General',
    price: '',
    costPrice: '',
    stock: '0',
    minStock: '5',
    maxStock: '',
    unit: 'UNIT',
    barcode: '',
    imageUrl: '',
    location: '',
    supplierName: '',
    supplierSku: '',
    taxRate: '21',
    weight: '',
    dimensions: '',
    brand: '',
    tags: '',
    notes: '',
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Stock Movement Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<ProductItem | null>(null);
  const [movementData, setMovementData] = useState({
    type: 'INBOUND',
    quantity: '1',
    reason: '',
    reference: '',
  });
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Delete Confirm State
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resProducts, resStats, resIntegrations] = await Promise.all([
        apiRequest('/inventory'),
        apiRequest('/inventory/analytics/stats').catch(() => ({ success: false, data: null })),
        integrationsService.getIntegrations().catch(() => null),
      ]);

      if (resProducts.success && resProducts.data) {
        setProducts(resProducts.data);
      }
      if (resStats && resStats.success && (resStats as any).data) {
        setStats((resStats as any).data);
      }

      // Populate list of only active and configured online stores
      if (resIntegrations && resIntegrations.data) {
        const d = resIntegrations.data;
        const stores: Array<{ id: string; name: string }> = [
          { id: 'unopim', name: 'UnoPIM (Catálogo Central)' },
        ];
        if (d.woocommerce?.enabled || d.woocommerce?.status === 'connected') {
          stores.push({ id: 'woocommerce', name: 'WooCommerce Store' });
        }
        if (d.shopify?.enabled || d.shopify?.status === 'connected') {
          stores.push({ id: 'shopify', name: 'Shopify Store' });
        }
        if (d.opencart?.enabled || d.opencart?.status === 'connected') {
          stores.push({ id: 'opencart', name: 'OpenCart Store' });
        }
        if (d.odoo?.enabled || d.odoo?.status === 'connected') {
          stores.push({ id: 'odoo', name: 'Odoo ERP' });
        }
        if (d.sage_one?.enabled || d.sage_50?.enabled || d.sage_200?.enabled) {
          stores.push({ id: 'sage', name: 'Sage ERP' });
        }
        setActiveStores(stores);
      }
    } catch (err: any) {
      toast.error('Error al cargar inventario', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parseProductAttributes = (product?: ProductItem | null): Record<string, any> => {
    if (!product || !product.attributes) return {};
    if (typeof product.attributes === 'object') return product.attributes;
    try {
      return JSON.parse(product.attributes);
    } catch {
      return {};
    }
  };

  const handleBulkAutoMap = async () => {
    try {
      setIsBulkMapping(true);
      soundService.play('action');
      const res = await integrationsService.bulkAutoMapAttributes();
      if (res.success) {
        soundService.play('success');
        toast.success(
          t('inventory.bulkAutoMapSuccess', 'Mapeo masivo completado'),
          res.message || `${res.mappedCount} productos actualizados con éxito`
        );
        loadData();
      } else {
        soundService.play('error');
        toast.error('Error en mapeo masivo', res.message || 'No se pudo completar el mapeo');
      }
    } catch (err: any) {
      soundService.play('error');
      toast.error('Error en mapeo masivo', err.message);
    } finally {
      setIsBulkMapping(false);
    }
  };

  const handleSingleAutoMap = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setIsProductMapping(true);
      soundService.play('action');
      const res = await integrationsService.autoMapProductAttributes(productId);
      if (res.success) {
        soundService.play('success');
        toast.success(
          t('inventory.autoMapSuccess', 'Atributos Multi-App mapeados'),
          res.message || 'Atributos sincronizados para UnoPIM, OpenCart, Sage, Odoo, Shopify y WooCommerce'
        );
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct({
            ...selectedProduct,
            attributes: res.attributes || res.data?.attributes,
          });
        }
        loadData();
      } else {
        soundService.play('error');
        toast.error('Error al mapear atributos', res.message);
      }
    } catch (err: any) {
      soundService.play('error');
      toast.error('Error al mapear atributos', err.message);
    } finally {
      setIsProductMapping(false);
    }
  };

  // Fetch product movements when detail modal opens
  const openDetailModal = async (product: ProductItem) => {
    setSelectedProduct(product);
    setDetailTab('general');
    setLoadingMovements(true);
    soundService.play('action');
    try {
      const res = await apiRequest(`/inventory/${product.id}`);
      if (res.success && res.data) {
        setSelectedProduct(res.data);
        setProductMovements(res.data.stockMovements || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMovements(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: 'General',
      price: '',
      costPrice: '',
      stock: '0',
      minStock: '5',
      maxStock: '',
      unit: 'UNIT',
      barcode: '',
      imageUrl: '',
      location: '',
      supplierName: '',
      supplierSku: '',
      taxRate: '21',
      weight: '',
      dimensions: '',
      brand: '',
      tags: '',
      notes: '',
      isActive: true,
    });
    setFormError('');
    setIsFormModalOpen(true);
    soundService.play('action');
  };

  const openEditModal = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || 'General',
      price: String(product.price || 0),
      costPrice: product.costPrice !== null && product.costPrice !== undefined ? String(product.costPrice) : '0',
      stock: String(product.stock || 0),
      minStock: String(product.minStock ?? 5),
      maxStock: product.maxStock ? String(product.maxStock) : '',
      unit: product.unit || 'UNIT',
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || '',
      location: product.location || '',
      supplierName: product.supplierName || '',
      supplierSku: product.supplierSku || '',
      taxRate: String(product.taxRate ?? 21),
      weight: product.weight ? String(product.weight) : '',
      dimensions: product.dimensions || '',
      brand: product.brand || '',
      tags: product.tags || '',
      notes: product.notes || '',
      isActive: product.isActive ?? true,
    });
    setFormError('');
    setIsFormModalOpen(true);
    soundService.play('action');
  };

  const openQuickMovementModal = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMovementProduct(product);
    setMovementData({
      type: 'INBOUND',
      quantity: '10',
      reason: 'Recepción de mercancía / Albarán proveedor',
      reference: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsMovementModalOpen(true);
    soundService.play('action');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sku: formData.sku.trim() || undefined,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || 'General',
        price: parseFloat(formData.price) || 0,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        stock: parseInt(formData.stock, 10) || 0,
        minStock: parseInt(formData.minStock, 10) || 5,
        maxStock: formData.maxStock ? parseInt(formData.maxStock, 10) : null,
        unit: formData.unit || 'UNIT',
        barcode: formData.barcode.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        location: formData.location.trim() || null,
        supplierName: formData.supplierName.trim() || null,
        supplierSku: formData.supplierSku.trim() || null,
        taxRate: parseFloat(formData.taxRate) || 21.0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.trim() || null,
        brand: formData.brand.trim() || null,
        tags: formData.tags.trim() || null,
        notes: formData.notes.trim() || null,
        isActive: formData.isActive,
      };

      if (editingId) {
        const res = await apiRequest(`/inventory/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success('Producto actualizado', `Se han guardado los cambios en ${payload.name}`);
          soundService.play('success');
          setIsFormModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Error al actualizar producto');
        }
      } else {
        const res = await apiRequest('/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success('Producto creado', `Artículo ${payload.name} añadido al inventario`);
          soundService.play('success');
          setIsFormModalOpen(false);
          loadData();
        } else {
          setFormError(res.message || 'Error al crear producto');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementProduct) return;

    const qty = parseInt(movementData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Cantidad inválida', 'Indica un número de unidades mayor que 0');
      return;
    }

    setIsSubmittingMovement(true);
    try {
      const res = await apiRequest(`/inventory/${movementProduct.id}/stock-movement`, {
        method: 'POST',
        body: JSON.stringify({
          type: movementData.type,
          quantity: qty,
          reason: movementData.reason,
          reference: movementData.reference,
        }),
      });

      if (res.success) {
        toast.success('Stock actualizado', res.message);
        soundService.play('success');
        setIsMovementModalOpen(false);
        loadData();
        if (selectedProduct && selectedProduct.id === movementProduct.id) {
          openDetailModal(movementProduct);
        }
      } else {
        toast.error('Error al registrar movimiento', res.message);
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/inventory/${deletingProduct.id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Producto eliminado', res.message);
        soundService.play('action');
        setDeletingProduct(null);
        if (selectedProduct?.id === deletingProduct.id) setSelectedProduct(null);
        loadData();
      } else {
        toast.error('Error al eliminar', res.message);
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setSyncStatusMsg('Enviando webhook POST /api/inventory/webhooks/unopim...');
    const randomStock = Math.floor(Math.random() * 80) + 15;
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
          brand: 'Oracle / DAMA',
          imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
        },
      }),
    });

    if (res.success) {
      toast.success('Webhook sincronizado', `Stock de SRV-CLOUD-M actualizado a ${randomStock} uds.`);
      setSyncStatusMsg(`Webhook procesado: Stock de SRV-CLOUD-M actualizado a ${randomStock} uds.`);
      soundService.play('success');
      loadData();
    } else {
      toast.error('Fallo en Webhook', res.message || 'Error de sincronización');
      setSyncStatusMsg(`Error: ${res.message}`);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/inventory/export/csv', '_blank');
    soundService.play('action');
    toast.success('Exportación iniciada', 'Descargando catálogo completo de inventario en formato CSV');
  };

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search matching
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchName = p.name.toLowerCase().includes(q);
          const matchBarcode = p.barcode?.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          const matchLoc = p.location?.toLowerCase().includes(q);
          const matchSupplier = p.supplierName?.toLowerCase().includes(q);
          const matchTags = p.tags?.toLowerCase().includes(q);
          if (!matchSku && !matchName && !matchBarcode && !matchBrand && !matchLoc && !matchSupplier && !matchTags) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
          return false;
        }

        // Stock status filter
        if (stockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;
        if (stockFilter === 'IN_STOCK' && p.stock <= 0) return false;
        if (stockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock > (p.minStock ?? 5))) return false;

        // Connector / Platform filter
        if (connectorFilter !== 'ALL') {
          const attrs = parseProductAttributes(p);
          if (connectorFilter === 'unopim') {
            if (!attrs?.unopim && !p.isSync) return false;
          } else if (connectorFilter === 'sage') {
            if (!attrs?.sage && !attrs?.sage_one && !attrs?.sage_50 && !attrs?.sage_200) return false;
          } else {
            if (!attrs || !attrs[connectorFilter]) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'stock_asc':
            return a.stock - b.stock;
          case 'stock_desc':
            return b.stock - a.stock;
          case 'sku_asc':
            return a.sku.localeCompare(b.sku);
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, search, categoryFilter, stockFilter, connectorFilter, sortBy]);

  const getStockBadge = (stock: number, minStock = 5) => {
    if (stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Agotado
        </span>
      );
    }
    if (stock <= minStock) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Stock Bajo ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        {stock} en stock
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('inventory', 'Inventario')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Control de existencias multialmacén, márgenes de rentabilidad, valoración y movimientos de stock
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBulkAutoMap}
            disabled={isBulkMapping}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mapea atributos y metadatos automáticamente para UnoPim, OpenCart, Sage, Odoo, Shopify y WooCommerce"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isBulkMapping ? 'animate-spin' : ''}`} />
            <span>{isBulkMapping ? t('inventory.mappingInProgress', 'Mapeando...') : t('inventory.bulkAutoMap', 'Mapeo Masivo Multi-App')}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 transition-colors active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Importar Catálogo</span>
          </button>

          <button
            onClick={handleSimulateWebhook}
            className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors active:scale-95"
            title="Simula un webhook entrante de actualización de stock"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sincronizar Webhook</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Artículos */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catálogo Total</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.totalProducts ?? products.length}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{stats?.totalUnits ?? products.reduce((sum, p) => sum + p.stock, 0)} unidades físicas</span>
          </div>
        </div>

        {/* Card 2: Valoración a PVP */}
        <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Valoración PVP</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(stats?.retailValuation ?? products.reduce((sum, p) => sum + p.stock * p.price, 0)).toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Margen bruto: {stats?.grossMarginPercent ?? 42}%
          </div>
        </div>

        {/* Card 3: Stock Bajo */}
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Bajo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
            {stats?.lowStockCount ?? products.filter((p) => p.stock > 0 && p.stock <= (p.minStock ?? 5)).length}
          </div>
          <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
            Requieren reposición de pedido
          </div>
        </div>

        {/* Card 4: Agotados */}
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sin Existencias</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-900 dark:text-rose-200">
            {stats?.outOfStockCount ?? products.filter((p) => p.stock <= 0).length}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-1">
            Rotura de stock / Pedir a proveedor
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar SKU, nombre, barcode, marca, ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Active Online Store & Multi-App Filter */}
          <select
            value={connectorFilter}
            onChange={(e) => setConnectorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold"
            title="Filtrar por tienda online o plataforma activa"
          >
            <option value="ALL">Canales Online Activos ({products.length})</option>
            {activeStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas las Categorías ({products.length})</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todo el Stock</option>
            <option value="IN_STOCK">En Stock</option>
            <option value="LOW_STOCK">Stock Bajo</option>
            <option value="OUT_OF_STOCK">Agotados (0)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name_asc">Nombre (A-Z)</option>
            <option value="name_desc">Nombre (Z-A)</option>
            <option value="price_desc">Precio (Mayor a menor)</option>
            <option value="price_asc">Precio (Menor a mayor)</option>
            <option value="stock_desc">Stock (Mayor a menor)</option>
            <option value="stock_asc">Stock (Menor a mayor)</option>
            <option value="sku_asc">SKU (Alfanumérico)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
              title={t('inventory.viewTable', 'Vista de Tabla')}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
              title={t('inventory.viewGrid', 'Vista de Cuadrícula Visual (Cajas)')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product List Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Cargando catálogo de artículos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Package className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">No se encontraron artículos</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4">
            No hay productos que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Primer Artículo</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Artículo & Imagen</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4">Categoría & Ubicación</th>
                  <th className="py-3 px-4 text-right">PVP (€)</th>
                  <th className="py-3 px-4 text-right">Coste (€)</th>
                  <th className="py-3 px-4 text-center">Estado de Stock</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {filteredProducts.map((product) => {
                  const grossMargin = product.price - (product.costPrice || 0);
                  const grossMarginPct = product.price > 0 ? (grossMargin / product.price) * 100 : 0;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => openDetailModal(product)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {product.name}
                            </div>
                            {product.brand && (
                              <div className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                Marca: {product.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 dark:text-slate-300">
                        <div className="font-bold">{product.sku}</div>
                        {product.barcode && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>{product.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 font-medium text-[11px]">
                          {product.category || 'General'}
                        </span>
                        {product.location && (
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-blue-400" />
                            <span>{product.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                        {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +{grossMarginPct.toFixed(0)}% mrg.
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right text-gray-500 dark:text-slate-400">
                        {(product.costPrice || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {getStockBadge(product.stock, product.minStock)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => openQuickMovementModal(product, e)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg transition"
                            title="Ajustar stock rápido"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => openEditModal(product, e)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg transition"
                            title="Editar artículo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingProduct(product);
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const attrs = parseProductAttributes(product);
            const marginAmount = product.price - (product.costPrice || 0);
            const marginPct = product.price > 0 ? (marginAmount / product.price) * 100 : 0;
            const targetMax = product.maxStock || Math.max(product.stock * 1.5, product.minStock * 3, 20);
            const stockPct = Math.min(100, Math.max(3, (product.stock / targetMax) * 100));
            const hasUnoPim = Boolean(attrs?.unopim || product.isSync);
            const hasOpenCart = Boolean(attrs?.opencart);
            const hasSage = Boolean(attrs?.sage || attrs?.sage_one || attrs?.sage_50 || attrs?.sage_200);
            const hasOdoo = Boolean(attrs?.odoo);
            const hasShopify = Boolean(attrs?.shopify);
            const hasWoo = Boolean(attrs?.woocommerce);

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openDetailModal(product)}
                className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Product Image Area */}
                  <div className="h-48 w-full bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-600">
                        <Package className="w-12 h-12" />
                        <span className="text-[10px] font-mono uppercase">{product.sku}</span>
                      </div>
                    )}

                    {/* Stock Status Badge Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      {getStockBadge(product.stock, product.minStock)}
                    </div>

                    {/* Category Pill Top Left */}
                    {product.category && (
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{product.category}</span>
                      </div>
                    )}

                    {/* Brand Pill Bottom Left */}
                    {product.brand && (
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-gray-800 dark:text-slate-200 text-[10px] font-bold shadow-xs">
                        {product.brand}
                      </div>
                    )}
                  </div>

                  {/* Product Info Section */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 dark:text-slate-500 mb-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <span className="flex items-center gap-1 text-[10px]">
                            <Barcode className="w-3 h-3" />
                            {product.barcode}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                        <span>{t('inventory.stockLevel', 'Existencias')}: <strong className="text-gray-900 dark:text-white">{product.stock} {product.unit}</strong></span>
                        <span>Mín: {product.minStock}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            product.stock <= 0
                              ? 'bg-rose-500'
                              : product.stock <= (product.minStock ?? 5)
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Multi-App Connector Sync Indicators */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block mb-1.5">
                        {t('inventory.connectedApps', 'Apps & Conectores')}:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasUnoPim
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="UnoPIM Catálogo"
                        >
                          UnoPim
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasOpenCart
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="OpenCart Store"
                        >
                          OpenCart
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasSage
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="Sage ERP (1/50/200)"
                        >
                          Sage
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasOdoo
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="Odoo ERP"
                        >
                          Odoo
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasShopify
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="Shopify Store"
                        >
                          Shopify
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hasWoo
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                          title="WooCommerce"
                        >
                          Woo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Pricing & Action Buttons */}
                <div className="p-4 pt-3 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {product.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {product.costPrice ? (
                        <span className="text-gray-400">
                          Coste: {product.costPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      ) : null}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{marginPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleSingleAutoMap(product.id, e)}
                      disabled={isProductMapping}
                      className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg transition"
                      title={t('inventory.autoMapProduct', 'Auto-mapear atributos multi-app')}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openQuickMovementModal(product, e)}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg transition"
                      title={t('inventory.adjustStock', 'Ajustar stock')}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => openEditModal(product, e)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 rounded-lg transition"
                      title={t('common.edit', 'Editar')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RICH PRODUCT DETAIL MODAL / DRAWER                                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header with image preview & title */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        {selectedProduct.sku}
                      </span>
                      {getStockBadge(selectedProduct.stock, selectedProduct.minStock)}
                      {selectedProduct.isSync && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold text-[10px]">
                          UnoPIM Enlazado
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Categoría: <strong>{selectedProduct.category || 'General'}</strong></span>
                      {selectedProduct.brand && <span>Marca: <strong>{selectedProduct.brand}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedProduct)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Editar datos"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 px-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {[
                  { id: 'general', label: 'General & Ficha', icon: Info },
                  { id: 'financials', label: 'Precios & Rentabilidad', icon: DollarSign },
                  { id: 'attributes', label: 'Atributos Multi-App', icon: Sparkles },
                  { id: 'movements', label: `Movimientos (${productMovements.length})`, icon: History },
                  { id: 'supplier', label: 'Proveedor & Notas', icon: Building2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = detailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={`px-3.5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                        isActive
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* TAB 1: General */}
                {detailTab === 'general' && (
                  <div className="space-y-4">
                    {selectedProduct.description && (
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                        <span className="block font-bold text-gray-900 dark:text-white mb-1">Descripción del Artículo:</span>
                        {selectedProduct.description}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Código de Barras</span>
                        <div className="text-xs font-mono font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-blue-500" />
                          <span>{selectedProduct.barcode || 'N/D'}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Ubicación en Almacén</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>{selectedProduct.location || 'Principal / Estándar'}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Unidad de Medida</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProduct.unit}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Dimensiones</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProduct.dimensions || 'No especificadas'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Peso Neto</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProduct.weight ? `${selectedProduct.weight} kg` : 'N/D'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Etiquetas / Tags</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProduct.tags || 'General'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Financials & Margins */}
                {detailTab === 'financials' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                          Precio Venta (PVP)
                        </span>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedProduct.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <span className="text-[10px] text-gray-500">IVA incl. ({selectedProduct.taxRate}%)</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 block mb-1">
                          Precio Coste Proveedor
                        </span>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {(selectedProduct.costPrice || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <span className="text-[10px] text-gray-500">Base imponible de compra</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Margen Bruto Unitario
                        </span>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {(selectedProduct.price - (selectedProduct.costPrice || 0)).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {selectedProduct.price > 0
                            ? (((selectedProduct.price - (selectedProduct.costPrice || 0)) / selectedProduct.price) * 100).toFixed(1)
                            : 0}% margen sobre venta
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Valoración total de stock actual a coste:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(selectedProduct.stock * (selectedProduct.costPrice || 0)).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Valoración potencial de stock actual a PVP:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(selectedProduct.stock * selectedProduct.price).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Multi-App Attributes */}
                {detailTab === 'attributes' && (() => {
                  const attrs = parseProductAttributes(selectedProduct);
                  const unopim = attrs.unopim || {};
                  const opencart = attrs.opencart || {};
                  const sage = attrs.sage || attrs.sage_one || attrs.sage_50 || attrs.sage_200 || {};
                  const odoo = attrs.odoo || {};
                  const shopify = attrs.shopify || {};
                  const woocommerce = attrs.woocommerce || {};

                  return (
                    <div className="space-y-4">
                      {/* Top Action Banner */}
                      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                              Mapeo Inteligente de Atributos & Metadatos Multi-App
                            </h4>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                              Esquema sincronizado y mapeado automáticamente con UnoPIM, OpenCart, Sage, Odoo, Shopify y WooCommerce
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSingleAutoMap(selectedProduct.id)}
                          disabled={isProductMapping}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50 shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isProductMapping ? 'animate-spin' : ''}`} />
                          <span>{isProductMapping ? 'Mapeando...' : 'Auto-Mapear Ahora'}</span>
                        </button>
                      </div>

                      {/* 6 Connector Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* 1. UnoPim PIM */}
                        <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-xs font-bold text-blue-900 dark:text-blue-300">UnoPIM (Catálogo / PIM)</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                              {unopim.family || 'Default Family'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Familia PIM</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{unopim.family || selectedProduct.category || 'General'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Completitud</span>
                              <span className="font-bold text-emerald-600">{unopim.completeness ?? 100}%</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Marketing: {unopim.description_marketing ? 'Definida' : 'Generada a partir del catálogo'}
                          </div>
                        </div>

                        {/* 2. OpenCart Store */}
                        <div className="p-4 rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-sky-500" />
                              <span className="text-xs font-bold text-sky-900 dark:text-sky-300">OpenCart Store</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
                              Model: {opencart.model || selectedProduct.sku}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">EAN / UPC</span>
                              <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">{opencart.ean || selectedProduct.barcode || 'N/D'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Ubicación / Stock</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{opencart.location || selectedProduct.location || 'Principal'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Clase de peso: {opencart.weight_class_id || '1 (Kilogram)'} | Restar stock: {opencart.subtract !== false ? 'Sí' : 'No'}
                          </div>
                        </div>

                        {/* 3. Sage Business ERP */}
                        <div className="p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500" />
                              <span className="text-xs font-bold text-teal-900 dark:text-teal-300">Sage ERP (Sage One / 50 / 200)</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                              {sage.tax_code || 'IVA21'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Subcuenta Ventas</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{sage.nominal_code || '4000.0000'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Subcuenta Compras</span>
                              <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{sage.purchase_code || '5000.0000'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Código Arancelario / Intrastat: <code className="font-mono text-teal-700 dark:text-teal-300">{sage.intrastat_code || '8471.30.00'}</code>
                          </div>
                        </div>

                        {/* 4. Odoo ERP */}
                        <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Odoo ERP (Community/Enterprise)</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                              product.product
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Default Code</span>
                              <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">{odoo.default_code || selectedProduct.sku}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Ruta Logística</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{Array.isArray(odoo.route_ids) ? odoo.route_ids.join(', ') : 'Comprar (Buy)'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Tipo: Almacenable (product) | Impuestos: 21% IVA
                          </div>
                        </div>

                        {/* 5. Shopify Store */}
                        <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Shopify Store</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                              Handle: {shopify.handle || selectedProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Vendor / Proveedor</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{shopify.vendor || selectedProduct.supplierName || 'DAMA CRM'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Tipo Producto</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{shopify.product_type || selectedProduct.category || 'General'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Tags: <span className="font-mono text-emerald-700 dark:text-emerald-300">{shopify.tags || selectedProduct.tags || 'crm, synced'}</span>
                          </div>
                        </div>

                        {/* 6. WooCommerce */}
                        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">WooCommerce REST</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                              Tax: {woocommerce.tax_class || 'standard'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Gestión de Stock</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{woocommerce.manage_stock !== false ? 'Habilitado (true)' : 'Deshabilitado'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/30">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold">Dimensiones</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{woocommerce.dimensions ? `${woocommerce.dimensions.length}x${woocommerce.dimensions.width}x${woocommerce.dimensions.height}` : (selectedProduct.dimensions || 'N/D')}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400">
                            Estado catálogo: Publicado | Visibilidad: Visible en catálogo & búsqueda
                          </div>
                        </div>
                      </div>

                      {/* Raw JSON viewer */}
                      <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            <span>Payload JSON de Atributos Multi-App</span>
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(attrs, null, 2));
                              setCopiedRawJson(true);
                              soundService.play('action');
                              toast.success('Copiado', 'JSON de atributos copiado al portapapeles');
                              setTimeout(() => setCopiedRawJson(false), 2000);
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                          >
                            {copiedRawJson ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Layers className="w-3.5 h-3.5" />}
                            <span>{copiedRawJson ? 'Copiado' : 'Copiar JSON'}</span>
                          </button>
                        </div>
                        <pre className="p-3 bg-black/90 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 leading-tight select-all">
                          {JSON.stringify(attrs, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 3: Movements & History */}
                {detailTab === 'movements' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Historial de Movimientos y Ajustes
                      </span>
                      <button
                        onClick={() => openQuickMovementModal(selectedProduct)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Registrar Movimiento</span>
                      </button>
                    </div>

                    {loadingMovements ? (
                      <div className="p-8 text-center">
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Cargando movimientos...</span>
                      </div>
                    ) : productMovements.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 text-xs">
                        No hay movimientos registrados para este artículo.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 dark:bg-slate-800 text-[10px] text-gray-500 font-bold uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Fecha</th>
                              <th className="py-2.5 px-3">Tipo</th>
                              <th className="py-2.5 px-3 text-right">Variación</th>
                              <th className="py-2.5 px-3 text-right">Stock Final</th>
                              <th className="py-2.5 px-3">Motivo / Ref.</th>
                              <th className="py-2.5 px-3">Operador</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {productMovements.map((mov) => (
                              <tr key={mov.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                                  {new Date(mov.createdAt).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      mov.type === 'INBOUND'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : mov.type === 'OUTBOUND'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                    }`}
                                  >
                                    {mov.type}
                                  </span>
                                </td>
                                <td
                                  className={`py-2.5 px-3 text-right font-bold ${
                                    mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-white">
                                  {mov.newStock}
                                </td>
                                <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">
                                  <div>{mov.reason || 'Sin motivo'}</div>
                                  {mov.reference && <div className="text-[10px] text-gray-400 font-mono">{mov.reference}</div>}
                                </td>
                                <td className="py-2.5 px-3 text-gray-500">{mov.performedBy || 'Sistema'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Supplier & Notes */}
                {detailTab === 'supplier' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Proveedor Principal</span>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {selectedProduct.supplierName || 'Distribuidor General'}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">SKU / Ref. Proveedor</span>
                        <div className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                          {selectedProduct.supplierSku || 'N/D'}
                        </div>
                      </div>
                    </div>

                    {selectedProduct.notes && (
                      <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-bold block mb-1">Notas Internas de Gestión:</span>
                        {selectedProduct.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <button
                  onClick={() => openQuickMovementModal(selectedProduct)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Ajuste Rápido de Stock</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedProduct)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 transition"
                  >
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:opacity-90 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Editar Artículo de Inventario' : 'Dar de Alta Nuevo Artículo'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Identification */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    1. Identificación Principal
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Licencia ERP Anual o Servidor Dell R750"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Código SKU (Opcional, autogenerado si se omite)
                      </label>
                      <input
                        type="text"
                        placeholder="SKU-PROD-001"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Categoría
                      </label>
                      <input
                        type="text"
                        placeholder="Software / Hardware / Servicios"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Marca / Fabricante
                      </label>
                      <input
                        type="text"
                        placeholder="DAMA / Cisco / Dell / etc."
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Código de Barras (EAN13)
                      </label>
                      <input
                        type="text"
                        placeholder="8412345678901"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      URL de Imagen del Producto
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/fotos/producto.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Descripción Detallada
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Características, especificaciones o detalles de entrega..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Section 2: Pricing & Stock */}
                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
                    2. Precios & Control de Stock
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        PVP Venta (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="99.90"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Precio Coste (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="45.00"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Stock Actual *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="10"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Stock Mínimo Alerta
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Ubicación Almacén
                      </label>
                      <input
                        type="text"
                        placeholder="Pasillo 2 - Est. 4"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        placeholder="Mayorista Tecnológico S.A."
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        Tasa de IVA (%)
                      </label>
                      <select
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="21">21% General</option>
                        <option value="10">10% Reducido</option>
                        <option value="4">4% Superreducido</option>
                        <option value="0">0% Exento</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* QUICK STOCK MOVEMENT MODAL                                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMovementModalOpen && movementProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                    <ArrowUpDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Registrar Movimiento de Stock</h3>
                    <p className="text-[11px] text-gray-500">{movementProduct.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMovementModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStockMovementSubmit} className="p-5 space-y-3.5">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Stock Actual:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{movementProduct.stock} uds.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Tipo de Operación
                  </label>
                  <select
                    value={movementData.type}
                    onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INBOUND">Entrada / Recepción de Mercancía (+)</option>
                    <option value="OUTBOUND">Salida / Despacho / Venta (-)</option>
                    <option value="ADJUSTMENT">Ajuste de Inventario / Recuento</option>
                    <option value="RETURN">Devolución de Cliente (+)</option>
                    <option value="TRANSFER">Transferencia entre Almacenes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Cantidad de Unidades
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementData.quantity}
                    onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Motivo / Justificación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Albarán proveedor #2938 o rotura"
                    value={movementData.reason}
                    onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Número de Documento / Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="ALB-2026-0045"
                    value={movementData.reference}
                    onChange={(e) => setMovementData({ ...movementData, reference: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMovementModalOpen(false)}
                    className="px-3.5 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMovement}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingMovement ? 'Procesando...' : 'Confirmar Movimiento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">¿Eliminar artículo?</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
                Vas a eliminar <strong>{deletingProduct.name}</strong> ({deletingProduct.sku}). Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal CSV / Excel Importer Modal */}
      <ExcelCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          loadData();
        }}
        targetType="inventory"
      />
    </div>
  );
};
