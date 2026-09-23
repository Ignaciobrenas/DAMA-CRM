import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Building2,
  User,
  DollarSign,
  CheckSquare,
  FileText,
  Package,
  X,
  Briefcase,
  Receipt,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export interface SearchResult {
  category: string;
  categoryKey: 'companies' | 'contacts' | 'deals' | 'projects' | 'tasks' | 'invoices' | 'quotes' | 'inventory';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  route: string;
  icon: string;
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

type FilterCategory = 'all' | 'contacts' | 'companies' | 'invoices' | 'quotes' | 'deals' | 'projects' | 'tasks' | 'inventory';

const CATEGORIES: Array<{ key: FilterCategory; label: string; icon: React.FC<{ className?: string }> }> = [
  { key: 'all', label: 'Todos', icon: Filter },
  { key: 'contacts', label: 'Clientes', icon: User },
  { key: 'companies', label: 'Empresas', icon: Building2 },
  { key: 'invoices', label: 'Facturas', icon: FileText },
  { key: 'quotes', label: 'Presupuestos', icon: Receipt },
  { key: 'deals', label: 'Ventas', icon: DollarSign },
  { key: 'projects', label: 'Proyectos', icon: Briefcase },
  { key: 'tasks', label: 'Tareas', icon: CheckSquare },
  { key: 'inventory', label: 'Inventario', icon: Package },
];

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Global keyboard shortcut Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query across the database
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await apiRequest<SearchResult[]>(`/search?q=${encodeURIComponent(query.trim())}`);
      if (res.success && res.data) {
        setResults(res.data);
      }
      setIsLoading(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered results based on activeCategory
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') return results;
    return results.filter((r) => r.categoryKey === activeCategory);
  }, [results, activeCategory]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    results.forEach((r) => {
      counts[r.categoryKey] = (counts[r.categoryKey] || 0) + 1;
    });
    return counts;
  }, [results]);

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'User': return <User className="w-4 h-4 text-emerald-500" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-violet-500" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case 'FileText': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'Receipt': return <Receipt className="w-4 h-4 text-teal-500" />;
      case 'Package': return <Package className="w-4 h-4 text-cyan-500" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Modal Dialog Container - Stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Search Header Bar with Input and Close X */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, empresas, facturas, ventas, tareas, inventario..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none"
          />

          <div className="flex items-center space-x-1.5 ml-2 shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
              ESC
            </kbd>

            {/* Prominent Close X Button to solve the bug */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              title="Cerrar buscador (Esc)"
              aria-label="Cerrar buscador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Category Tabs / Chips */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-gray-100 dark:border-slate-800/80 overflow-x-auto scrollbar-none bg-white dark:bg-slate-900 text-xs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.key] || 0;
            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {results.length > 0 && count > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results List Area */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[160px] max-h-[50vh]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Buscando en clientes, empresas, facturas, proyectos...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-1">
              {filteredResults.map((item) => (
                <button
                  key={`${item.categoryKey}-${item.id}`}
                  onClick={() => handleSelect(item.route)}
                  className="w-full flex items-center justify-between p-2.5 text-left rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                      {getIcon(item.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {item.badge && (
                      <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {item.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-slate-300">
                No se encontraron coincidencias para "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {activeCategory !== 'all'
                  ? 'Prueba a seleccionar la pestaña "Todos" o cambiar los términos de búsqueda.'
                  : 'Verifica la ortografía o intenta buscar por CIF, SKU, teléfono o nombre.'}
              </p>
            </div>
          ) : (
            /* Quick Shortcuts when query is empty */
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Accesos directos rápidos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect('/contacts')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Contactos y Clientes</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Directorio completo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/companies')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Empresas</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Cuentas y organizaciones</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/invoicing')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Facturación & Cobros</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Facturas y presupuestos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/pipeline')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Pipeline de Ventas</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Oportunidades y negocios</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/inventory')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Inventario UnoPIM</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Catálogo y productos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/agile')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">Agile Planner</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Sprints y tareas</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-3">
            <span>Presiona <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-gray-300 dark:border-slate-700 font-mono text-[10px]">ESC</kbd> o la <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-gray-300 dark:border-slate-700 font-mono text-[10px]">X</kbd> para salir</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
