const fs = require('fs');
const path = require('path');

// 1. UserProfileModal.tsx
const upmPath = path.join(__dirname, '..', 'client', 'src', 'components', 'layout', 'UserProfileModal.tsx');
let upm = fs.readFileSync(upmPath, 'utf8');

upm = upm.replace(
  /<button\s+onClick=\{onClose\}\s+className="p-1 rounded-full bg-black\/20 hover:bg-black\/40 text-white transition"/,
  '<button\n                onClick={onClose}\n                aria-label={t("close", "Cerrar")}\n                className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"'
);

upm = upm.replace(
  /<input\s+type="checkbox"\s+checked=\{rememberSession\}\s+onChange=\{\(e\) => handleToggleRemember\(e\.target\.checked\)\}\s+className="sr-only peer"\s*\/>/,
  '<input\n                  type="checkbox"\n                  aria-label="Recordar sesión en este equipo"\n                  checked={rememberSession}\n                  onChange={(e) => handleToggleRemember(e.target.checked)}\n                  className="sr-only peer"\n                />'
);

fs.writeFileSync(upmPath, upm, 'utf8');
console.log('✅ Updated UserProfileModal.tsx with accessible aria-labels');

// 2. CommandMenu.tsx
const cmPath = path.join(__dirname, '..', 'client', 'src', 'components', 'layout', 'CommandMenu.tsx');
let cm = fs.readFileSync(cmPath, 'utf8');

cm = cm.replace(
  'className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col"',
  'className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col m-auto"'
);

cm = cm.replace(
  '<button\n              type="button"\n              onClick={() => setQuery(\'\')}\n              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"\n            >',
  '<button\n              type="button"\n              aria-label={t("clear", "Limpiar búsqueda")}\n              onClick={() => setQuery(\'\')}\n              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2"\n            >'
);

fs.writeFileSync(cmPath, cm, 'utf8');
console.log('✅ Updated CommandMenu.tsx with m-auto and accessible aria-label');
