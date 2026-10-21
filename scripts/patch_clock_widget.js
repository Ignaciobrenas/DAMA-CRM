const fs = require('fs');
const path = require('path');

const cwPath = path.join(__dirname, '..', 'client', 'src', 'components', 'employee-portal', 'ClockWidget.tsx');
let code = fs.readFileSync(cwPath, 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

const target1 = `<button
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >`;

const replacement1 = `<button
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading}
            aria-label={t('timeTracking.clockIn', 'Fichar Entrada')}
            title={t('timeTracking.clockIn', 'Fichar Entrada')}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log('✅ Replaced target1 in ClockWidget');
} else {
  console.log('⚠️ Target1 not found directly in ClockWidget');
}

const target2 = `<button
              onClick={() => setIsClockOutModalOpen(true)}
              disabled={actionLoading}
              title={t('timeTracking.clockOut')}
              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded"
            >`;

const replacement2 = `<button
              onClick={() => setIsClockOutModalOpen(true)}
              disabled={actionLoading}
              aria-label={t('timeTracking.clockOut', 'Fichar Salida')}
              title={t('timeTracking.clockOut', 'Fichar Salida')}
              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded"
            >`;

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log('✅ Replaced target2 in ClockWidget');
}

fs.writeFileSync(cwPath, code, 'utf8');
