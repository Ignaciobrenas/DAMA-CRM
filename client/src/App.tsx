import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import { ToastProvider } from './context/ToastContext';
import { wsClient } from './services/websocket';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandMenu } from './components/layout/CommandMenu';
import { LoadingScreen } from './components/common/Loading';
import { FloatingCaptureWidget } from './components/common/FloatingCaptureWidget';
import { PermissionGate, AccessDenied } from './components/common/PermissionGate';
import { analytics } from './services/analytics';

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
import { Integrations } from './pages/Integrations';
import { Onboarding } from './pages/Onboarding';
import { FAQ } from './pages/FAQ';

const normalizeRoute = (pathname: string): string => {
  const p = pathname.toLowerCase();
  if (p === '/pipeline') return '/pipeline';
  if (p === '/agile') return '/agile';
  if (p === '/contacts') return '/contacts';
  if (p === '/companies') return '/companies';
  if (p === '/invoicing') return '/invoicing';
  if (p === '/inventory') return '/inventory';
  if (p === '/workflows') return '/workflows';
  if (p === '/omnichannel') return '/omnichannel';
  if (p === '/integrations') return '/integrations';
  if (p === '/onboarding') return '/onboarding';
  if (p === '/faq') return '/faq';
  if (p === '/lead-capture') return '/lead-capture';
  if (p === '/reports') return '/reports';
  if (p === '/settings') return '/settings';
  if (p === '/portal') return '/portal';
  if (p === '/privacy') return '/privacy';
  return '/';
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { branding } = useBranding();
  const { t } = useLanguage();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return normalizeRoute(window.location.pathname);
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    analytics.trackPageView(currentRoute);
  }, [currentRoute]);

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
    return <LoadingScreen title={branding.companyName} message={t('loadingWorkspace')} />;
  }

  // Allow public access to Privacy Policy & Client Portal
  if (currentRoute === '/privacy') {
    return <PrivacyPolicy onBack={() => navigateTo(isAuthenticated ? '/' : '/')} />;
  }

  if (currentRoute === '/portal') {
    return <ClientPortal />;
  }

  // Mandatory authentication guard for all protected workspace routes
  if (!isAuthenticated) {
    return (
      <Login
        onNavigatePrivacy={() => navigateTo('/privacy')}
        onNavigatePortal={() => navigateTo('/portal')}
      />
    );
  }

  // First-time onboarding experience guard
  if (currentRoute === '/onboarding' || (user && user.preferences?.onboardingCompleted === false)) {
    return <Onboarding onComplete={() => navigateTo('/')} />;
  }

  const renderActiveView = () => {
    switch (currentRoute) {
      case '/':
        return <Dashboard onNavigate={navigateTo} />;
      case '/pipeline':
        return (
          <PermissionGate resource="deals" action="read" fallback={<AccessDenied resource="deals" onGoBack={() => navigateTo('/')} />}>
            <Pipeline />
          </PermissionGate>
        );
      case '/agile':
        return (
          <PermissionGate resource="projects" action="read" fallback={<AccessDenied resource="projects" onGoBack={() => navigateTo('/')} />}>
            <AgilePlanner />
          </PermissionGate>
        );
      case '/contacts':
        return (
          <PermissionGate resource="contacts" action="read" fallback={<AccessDenied resource="contacts" onGoBack={() => navigateTo('/')} />}>
            <Contacts />
          </PermissionGate>
        );
      case '/companies':
        return (
          <PermissionGate resource="companies" action="read" fallback={<AccessDenied resource="companies" onGoBack={() => navigateTo('/')} />}>
            <Companies />
          </PermissionGate>
        );
      case '/invoicing':
        return (
          <PermissionGate resource="invoices" action="read" fallback={<AccessDenied resource="invoices" onGoBack={() => navigateTo('/')} />}>
            <Invoicing />
          </PermissionGate>
        );
      case '/inventory':
        return (
          <PermissionGate resource="inventory" action="read" fallback={<AccessDenied resource="inventory" onGoBack={() => navigateTo('/')} />}>
            <Inventory />
          </PermissionGate>
        );
      case '/workflows':
        return (
          <PermissionGate resource="workflows" action="read" fallback={<AccessDenied resource="workflows" onGoBack={() => navigateTo('/')} />}>
            <Workflows />
          </PermissionGate>
        );
      case '/omnichannel':
        return (
          <PermissionGate resource="omnichannel" action="read" fallback={<AccessDenied resource="omnichannel" onGoBack={() => navigateTo('/')} />}>
            <Omnichannel />
          </PermissionGate>
        );
      case '/integrations':
        return (
          <PermissionGate resource="integrations" action="read" fallback={<AccessDenied resource="integrations" onGoBack={() => navigateTo('/')} />}>
            <Integrations />
          </PermissionGate>
        );
      case '/lead-capture':
        return <LeadCapture />;
      case '/reports':
        return (
          <PermissionGate resource="reports" action="read" fallback={<AccessDenied resource="reports" onGoBack={() => navigateTo('/')} />}>
            <Reports />
          </PermissionGate>
        );
      case '/settings':
        return (
          <PermissionGate resource="users" action="read" fallback={<AccessDenied resource="users" onGoBack={() => navigateTo('/')} />}>
            <Settings />
          </PermissionGate>
        );
      case '/faq':
        return <FAQ onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  const isCollapsed = Boolean(user?.preferences?.sidebarCollapsed);

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
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${isCollapsed ? 'md:pl-16' : 'md:pl-60'}`}>
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Footer with Running Version, FAQ, Integrations and RGPD Privacy Links */}
        <footer className="py-4 px-6 border-t border-gray-200 dark:border-slate-800/80 text-center text-xs text-gray-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>&copy; {new Date().getFullYear()} {branding.companyName}. {t('allRightsReserved')}</span>
            <span className="text-gray-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 font-semibold border border-gray-200 dark:border-slate-700">
              {t('runningVersion')}: v1.2.0-staging (Build 2026.09.26)
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigateTo('/faq')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              {t('faq')}
            </button>
            <button
              onClick={() => navigateTo('/integrations')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('thirdPartyIntegrations')}
            </button>
            <button
              onClick={() => navigateTo('/privacy')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline font-medium"
            >
              {t('privacyAndGdpr')}
            </button>
          </div>
        </footer>
      </div>

      {/* Global Command Menu (Cmd+K) */}
      <CommandMenu
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateTo}
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
