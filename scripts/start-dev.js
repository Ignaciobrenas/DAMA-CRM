const { execSync, spawn } = require('child_process');

console.log('\n[DAMA-CRM] Iniciando entorno de desarrollo...\n');

console.log('📦 Iniciando base de datos PostgreSQL...\n');
try {
  execSync('docker compose up -d crm-db', { stdio: 'inherit' });
} catch (error) {
  console.error('Error al iniciar la base de datos. Asegúrate de tener Docker corriendo:', error.message);
}

// 1. Start API and Client concurrently
console.log('🚀 Iniciando servidores locales (API y Cliente)...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, [
  'concurrently',
  '-n', 'API,CLIENT',
  '-c', 'blue,cyan',
  '"npm run dev:server"',
  '"npm run dev:client"'
], {
  stdio: 'inherit',
  shell: isWin
});

child.on('close', (code) => {
  console.log(`\nProcesos terminados con código ${code}`);
  process.exit(code);
});
