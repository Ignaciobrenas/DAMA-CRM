import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building2,
  User,
  DollarSign,
  CheckSquare,
  FileText,
  Package,
  Receipt,
  Sparkles,
  ArrowRight,
  Blocks,
  Rocket,
  X,
  Truck,
  Calendar,
  CalendarClock,
  LifeBuoy,
  CreditCard,
  MessageSquare,
  Users,
  Activity,
  Briefcase,
  Layers,
  Boxes,
  GitFork,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface SearchResult {
  category: string;
  categoryKey?: string;
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

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const categories = [
    { key: 'all', label: t('all') || 'Todos' },
    { key: 'contacts', label: t('contacts') || 'Contactos' },
    { key: 'companies', label: t('companies') || 'Empresas' },
    { key: 'deals', label: t('pipeline') || 'Oportunidades' },
    { key: 'invoices', label: t('invoicing') || 'Facturación' },
    { key: 'quotes', label: t('quotes') || 'Presupuestos' },
    { key: 'inventory', label: t('inventory') || 'Inventario' },
    { key: 'logistics', label: t('logistics') || 'Logística' },
    { key: 'appointments', label: t('appointments') || 'Citas & Agenda' },
    { key: 'tasks', label: t('myTasks') || 'Tareas & Proyectos' },
    { key: 'tickets', label: t('tickets') || 'Tickets' },
    { key: 'expenses', label: t('expenses') || 'Gastos' },
    { key: 'employees', label: t('employees') || 'Empleados' },
    { key: 'omnichannel', label: t('omnichannel') || 'Omnicanal' },
    { key: 'workflows', label: t('workflows') || 'Automatizaciones' },
  ];

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setQuery('');
      setResults([]);
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Global keyboard shortcut Cmd+K / Ctrl+K & ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch live search results
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
          const res = await apiRequest(`/search?q=${encodeURIComponent(query.trim())}${categoryParam}`);
          if (res.success && Array.isArray(res.data)) {
            setResults(res.data);
          }
        } catch {
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return Building2;
      case 'User':
        return User;
      case 'DollarSign':
        return DollarSign;
      case 'CheckSquare':
        return CheckSquare;
      case 'FileText':
        return FileText;
      case 'Package':
        return Package;
      case 'Receipt':
        return Receipt;
      case 'Truck':
        return Truck;
      case 'Calendar':
        return Calendar;
      case 'CalendarClock':
        return CalendarClock;
      case 'LifeBuoy':
        return LifeBuoy;
      case 'CreditCard':
        return CreditCard;
      case 'MessageSquare':
        return MessageSquare;
      case 'Users':
        return Users;
      case 'Activity':
        return Activity;
      case 'Briefcase':
        return Briefcase;
      case 'Layers':
        return Layers;
      case 'Boxes':
        return Boxes;
      case 'GitFork':
        return GitFork;
      case 'ShieldCheck':
        return ShieldCheck;
      default:
        return Search;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed top-14 inset-x-0 bottom-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-300 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchAcrossAll') || 'Buscar en todos los módulos (Contactos, Facturas, Envíos, Citas, Tareas...)'}
            className="w-full text-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white font-medium focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Filter Categories Chips */}
        <div className="flex items-center space-x-1.5 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => {
                const IconComponent = getIcon(item.icon);
                return (
                  <button
                    key={`${item.categoryKey || item.category}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item.route)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.badge && (
                        <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {item.category}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-slate-300">
                {t('noResultsFor')} "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {t('tryAllTab') || 'Prueba a seleccionar la pestaña "Todos" o cambiar los términos de búsqueda.'}
              </p>
            </div>
          ) : (
            /* Quick Shortcuts when query is empty */
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('quickShortcuts') || 'Accesos Rápidos a Módulos'}</span>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('contacts') || 'Contactos'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('contactsSubtitle') || 'Directorio y leads'}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('companies') || 'Empresas'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('companiesSubtitle') || 'Cuentas corporativas y CIF'}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('invoicing') || 'Facturación'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('invoicingSubtitle') || 'Facturas, presupuestos y Veri*Factu'}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/logistics')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('logistics') || 'Logística & Envíos'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">GLS, NACEX, DHL, SEUR</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/appointments')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('appointments') || 'Citas & Agenda'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Reservas, servicios y especialistas</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('pipeline') || 'Pipeline'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('pipelineSubtitle') || 'Embudo de ventas y tratos'}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('inventory') || 'Inventario'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('inventorySubtitle') || 'Stock, almacenes y lotes'}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('agile') || 'Planificador Ágil'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('agileSubtitle') || 'Sprints y tareas'}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/tickets')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('tickets') || 'Tickets'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">Soporte y Helpdesk con SLA</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect('/omnichannel')}
                  className="flex items-center space-x-2.5 p-2 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('omnichannel') || 'Omnicanal'}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">WhatsApp, Email y Chat en vivo</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-3">
            <span>{t('pressEscToClose') || 'Pulsa ESC para cerrar'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('close') || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
