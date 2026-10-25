const fs = require('fs');
const path = require('path');

// 1. LanguageModal.tsx - Add Escape listener
const lmPath = path.join(__dirname, '..', 'client', 'src', 'components', 'layout', 'LanguageModal.tsx');
let lm = fs.readFileSync(lmPath, 'utf8');

if (!lm.includes("e.key === 'Escape'")) {
  lm = lm.replace(
    'const [filter, setFilter] = useState(\'\');',
    `const [filter, setFilter] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);`
  );
  fs.writeFileSync(lmPath, lm, 'utf8');
  console.log('✅ Updated LanguageModal.tsx with Escape listener');
}

// 2. App.tsx - Add Ctrl+K listener
const appPath = path.join(__dirname, '..', 'client', 'src', 'App.tsx');
let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes("e.key.toLowerCase() === 'k'")) {
  app = app.replace(
    'useEffect(() => {\n    analytics.trackPageView(currentRoute);\n  }, [currentRoute]);',
    `useEffect(() => {\n    analytics.trackPageView(currentRoute);\n  }, [currentRoute]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);`
  );
  fs.writeFileSync(appPath, app, 'utf8');
  console.log('✅ Updated App.tsx with global Ctrl+K / Cmd+K listener');
}

// 3. ClockWidget.tsx - Add aria-labels for accessible button name
const cwPath = path.join(__dirname, '..', 'client', 'src', 'components', 'employee-portal', 'ClockWidget.tsx');
let cw = fs.readFileSync(cwPath, 'utf8');

cw = cw.replace(
  '<button\n            onClick={() => setIsModalOpen(true)}\n            disabled={actionLoading}\n            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"\n          >',
  `<button\n            onClick={() => setIsModalOpen(true)}\n            disabled={actionLoading}\n            aria-label={t('timeTracking.clockIn', 'Fichar Entrada')}\n            title={t('timeTracking.clockIn', 'Fichar Entrada')}\n            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"\n          >`
);

cw = cw.replace(
  '<button\n              onClick={() => setIsClockOutModalOpen(true)}\n              disabled={actionLoading}\n              title={t(\'timeTracking.clockOut\')}\n              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded"\n            >',
  `<button\n              onClick={() => setIsClockOutModalOpen(true)}\n              disabled={actionLoading}\n              aria-label={t('timeTracking.clockOut', 'Fichar Salida')}\n              title={t('timeTracking.clockOut', 'Fichar Salida')}\n              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded"\n            >`
);

fs.writeFileSync(cwPath, cw, 'utf8');
console.log('✅ Updated ClockWidget.tsx with accessible aria-labels');

// 4. GodModeModal.tsx - Add aria-label
const gmPath = path.join(__dirname, '..', 'client', 'src', 'components', 'modals', 'GodModeModal.tsx');
let gm = fs.readFileSync(gmPath, 'utf8');

gm = gm.replace(
  '<button\n              onClick={onClose}\n              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"\n            >',
  `<button\n              onClick={onClose}\n              aria-label={t('close', 'Cerrar')}\n              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"\n            >`
);

fs.writeFileSync(gmPath, gm, 'utf8');
console.log('✅ Updated GodModeModal.tsx with accessible aria-label');
