import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, User, DollarSign, CheckSquare, FileText, Package, X } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SearchResult {
  category: string;
  id: string;
  title: string;
  subtitle: string;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

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
    }
  }, [isOpen]);

  // Global keyboard shortcut Cmd+K / Ctrl+K
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

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await apiRequest<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        // Strict RBAC filtering on search results
        const filtered = res.data.filter((item) => {
          switch (item.category) {
            case 'Empresas': return hasPermission('companies', 'read');
            case 'Contactos': return hasPermission('contacts', 'read');
            case 'Oportunidades (Deals)': return hasPermission('deals', 'read');
            case 'Tareas Ágiles': return hasPermission('projects', 'read');
            case 'Facturas': return hasPermission('invoices', 'read');
            case 'Inventario': return hasPermission('inventory', 'read');
            default: return true;
          }
        });
        setResults(filtered);
      }
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, hasPermission]);

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'User': return <User className="w-4 h-4 text-emerald-500" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case 'FileText': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'Package': return <Package className="w-4 h-4 text-cyan-500" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Buscando en la base de datos...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={`${item.category}-${item.id}`}
                  onClick={() => {
                    onNavigate(item.route);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-gray-100 dark:bg-slate-800">
                      {getIcon(item.icon)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron coincidencias para "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-500">
              Escribe al menos 2 letras para indexar empresas, contactos, ventas y facturas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
