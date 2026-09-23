import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { BrandingProvider } from './context/BrandingContext';
import { ToastProvider } from './context/ToastContext';
import { wsClient } from './services/websocket';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandMenu } from './components/layout/CommandMenu';

// Views
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pipeline } from './pages/Pipeline';
import { AgilePlanner } from './pages/AgilePlanner';
import { Contacts } from './pages/Contacts';
import { Companies } from './pages/Companies';
import { Invoicing } from './pages/Invoicing';
import { Inventory } from './pages/Inventory';
import { Workflows } from './pages/Workflows';
import { Omnichannel } from './pages/Omnichannel';
import { Settings } from './pages/Settings';
import { ClientPortal } from './pages/ClientPortal';
import { Reports } from './pages/Reports';

const normalizeRoute = (path: string): string => {
  const clean = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return clean || '/';
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return normalizeRoute(window.location.pathname);
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync route on popstate (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizeRoute(window.location.pathname);
      if (!isAuthenticated) {
        if (path !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
        setCurrentRoute('/login');
      } else {
        if (path === '/login') {
          window.history.replaceState(null, '', '/');
          setCurrentRoute('/');
        } else {
          setCurrentRoute(path);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  // Enforce strict route guard on auth/loading changes
  useEffect(() => {
    if (isLoading) return;

    const currentPath = normalizeRoute(window.location.pathname);

    if (!isAuthenticated) {
      // If user attempted to visit any protected route directly via URL, remember it
      if (currentPath !== '/login' && currentPath !== '/') {
        sessionStorage.setItem('dama_intended_route', currentPath);
      }
      // Strictly force URL bar to /login
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      if (currentRoute !== '/login') {
        setCurrentRoute('/login');
      }
    } else {
      // Authenticated user
      const intended = sessionStorage.getItem('dama_intended_route');
      if (intended) {
        sessionStorage.removeItem('dama_intended_route');
        const target = normalizeRoute(intended);
        if (window.location.pathname !== target) {
          window.history.replaceState(null, '', target);
        }
        setCurrentRoute(target);
      } else if (currentPath === '/login') {
        window.history.replaceState(null, '', '/');
        setCurrentRoute('/');
      } else if (currentRoute !== currentPath) {
        setCurrentRoute(currentPath);
      }
    }
  }, [isAuthenticated, isLoading]);

  // Connect WebSockets when authenticated, disconnect on logout
  useEffect(() => {
    if (isAuthenticated) {
      wsClient.connect();
    } else {
      wsClient.disconnect();
    }
    return () => {
      wsClient.disconnect();
    };
  }, [isAuthenticated]);

  const navigateTo = (route: string) => {
    const target = normalizeRoute(route);
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
    setCurrentRoute(target);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Cargando DAMA-CRM...</span>
        </div>
      </div>
    );
  }

  // Strict Login Guard: Login is 100% mandatory and cannot be skipped via URL
  if (!isAuthenticated) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (currentRoute) {
      case '/': return <Dashboard onNavigate={navigateTo} />;
      case '/pipeline': return <Pipeline />;
      case '/agile': return <AgilePlanner />;
      case '/contacts': return <Contacts />;
      case '/companies': return <Companies />;
      case '/invoicing': return <Invoicing />;
      case '/inventory': return <Inventory />;
      case '/workflows': return <Workflows />;
      case '/omnichannel': return <Omnichannel />;
      case '/reports': return <Reports />;
      case '/settings': return <Settings />;
      case '/portal': return <ClientPortal />;
      default: return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${user?.preferences?.sidebarCollapsed ? 'md:pl-16' : 'md:pl-60'}`}>
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="w-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Menu (Cmd+K) */}
      <CommandMenu
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateTo}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrandingProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </BrandingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
