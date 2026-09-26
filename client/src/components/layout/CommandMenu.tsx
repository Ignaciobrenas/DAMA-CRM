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
  X,
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
    { key: 'all', label: t('all') },
    { key: 'contacts', label: t('contacts') },
    { key: 'companies', label: t('companies') },
    { key: 'deals', label: t('pipeline') },
    { key: 'invoices', label: t('invoicing') },
    { key: 'inventory', label: t('inventory') },
    { key: 'tasks', label: t('myTasks') },
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
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return Building2;
      case 'User': return User;
      case 'DollarSign': return DollarSign;
      case 'CheckSquare': return CheckSquare;
      case 'FileText': return FileText;
      case 'Package': return Package;
      case 'Receipt': return Receipt;
      default: return Search;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchAcrossAll')}
            className="w-full text-sm bg-transparent placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 text-[11px] font-mono rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Filter Categories Chips */}
        <div className="flex items-center space-x-1.5 px-4 py-2 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => {
                const IconComponent = getIcon(item.icon);
                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item.route)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 dark:hover:bg-slate-800/60 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 text-gray-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
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
                <span>{t('quickShortcuts')}</span>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('contacts')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('contactsSubtitle')}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('companies')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('companiesSubtitle')}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('invoicing')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('invoicingSubtitle')}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('pipeline')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('pipelineSubtitle')}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('inventory')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('inventorySubtitle')}</div>
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
                    <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{t('agile')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{t('agileSubtitle')}</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <div className="flex items-center space-x-3">
            <span>{t('pressEscToClose')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
