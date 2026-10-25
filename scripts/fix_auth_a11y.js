const fs = require('fs');
const path = require('path');

// 1. Fix ValidatedInput.tsx
const viPath = path.join(__dirname, '..', 'client', 'src', 'components', 'common', 'ValidatedInput.tsx');
let viCode = fs.readFileSync(viPath, 'utf8');

viCode = viCode.replace(
  /<button\s+type="button"\s+onClick=\{\(\) => setShowPassword\(!showPassword\)\}/g,
  '<button\n              type="button"\n              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}\n              onClick={() => setShowPassword(!showPassword)}'
);
fs.writeFileSync(viPath, viCode, 'utf8');
console.log('✅ Updated ValidatedInput.tsx with accessible aria-label');

// 2. Fix Login.tsx
const loginPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Login.tsx');
let loginCode = fs.readFileSync(loginPath, 'utf8');

loginCode = loginCode.replace(
  /<button\s+type="button"\s+onClick=\{\(\) => setShowPassword\(!showPassword\)\}\s+className="absolute right-3 top-2\.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"/g,
  '<button\n                  type="button"\n                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}\n                  onClick={() => setShowPassword(!showPassword)}\n                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"'
);

// In Login.tsx, add id and name to password and email inputs for full browser autofill & accessibility
loginCode = loginCode.replace(
  'type={showPassword ? \'text\' : \'password\'}\n                  required\n                  placeholder="••••••••"',
  'id="login-password"\n                  name="password"\n                  autoComplete="current-password"\n                  type={showPassword ? \'text\' : \'password\'}\n                  required\n                  placeholder="••••••••"'
);

loginCode = loginCode.replace(
  'placeholder="admin@dama-crm.local"\n                  value={email}',
  'id="login-email"\n                  name="email"\n                  autoComplete="username"\n                  placeholder="admin@dama-crm.local"\n                  value={email}'
);

fs.writeFileSync(loginPath, loginCode, 'utf8');
console.log('✅ Updated Login.tsx with accessible aria-labels and autocomplete metadata');
