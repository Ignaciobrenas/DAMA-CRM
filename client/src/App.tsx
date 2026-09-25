import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import { wsClient } from './services/websocket';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandMenu } from './components/layout/CommandMenu';
import { LoadingScreen } from './components/common/Loading';
import { FloatingCaptureWidget } from './components/common/FloatingCaptureWidget';

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
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { LeadCapture } from './pages/LeadCapture';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { branding } = useBranding();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname === '/privacy' ? '/privacy' : '/';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    wsClient.connect();

    const handlePopState = () => {
      if (window.location.pathname === '/privacy') {
        setCurrentRoute('/privacy');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return <LoadingScreen title={branding.companyName} message="Cargando espacio de trabajo modular..." />;
  }

  // Allow public access to Privacy Policy
  if (currentRoute === '/privacy') {
    return <PrivacyPolicy onBack={() => setCurrentRoute(isAuthenticated ? '/' : '/login')} />;
  }

  // If not logged in and not accessing public portal, show login
  if (!isAuthenticated && currentRoute !== '/portal') {
    return (
      <Login
        onNavigatePrivacy={() => setCurrentRoute('/privacy')}
        onNavigatePortal={() => setCurrentRoute('/portal')}
      />
    );
  }

  const renderActiveView = () => {
    switch (currentRoute) {
      case '/': return <Dashboard onNavigate={setCurrentRoute} />;
      case '/pipeline': return <Pipeline />;
      case '/agile': return <AgilePlanner />;
      case '/contacts': return <Contacts />;
      case '/companies': return <Companies />;
      case '/invoicing': return <Invoicing />;
      case '/inventory': return <Inventory />;
      case '/workflows': return <Workflows />;
      case '/omnichannel': return <Omnichannel />;
      case '/lead-capture': return <LeadCapture />;
      case '/reports': return <Reports />;
      case '/settings': return <Settings />;
      case '/portal': return <ClientPortal />;
      case '/privacy': return <PrivacyPolicy onBack={() => setCurrentRoute('/')} />;
      default: return <Dashboard onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60 transition-all duration-200">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {renderActiveView()}
        </main>

        {/* Global Footer with RGPD Privacy Link */}
        <footer className="py-4 px-6 border-t border-gray-200 dark:border-slate-800/80 text-center text-xs text-gray-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span>&copy; {new Date().getFullYear()} {branding.companyName}. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentRoute('/lead-capture')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Conectores & Puntos de Captura
            </button>
            <button
              onClick={() => setCurrentRoute('/privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline font-medium"
            >
              Políticas de Privacidad & RGPD
            </button>
          </div>
        </footer>
      </div>

      {/* Global Command Menu (Cmd+K) */}
      <CommandMenu
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentRoute}
      />

      {/* Floating Lead & WhatsApp Live Capture Widget */}
      <FloatingCaptureWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrandingProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrandingProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
