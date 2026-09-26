const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../../client/src/i18n/locales');

const additionalKeys = {
  es: {
    "settings.tabCompany": "Identidad & Facturación",
    "settings.tabIntegrations": "Conectores & Integraciones",
    "settings.tabSystem": "Sistema & Copias de Seguridad"
  },
  en: {
    "settings.tabCompany": "Company & Invoicing",
    "settings.tabIntegrations": "Connectors & Integrations",
    "settings.tabSystem": "System & Data Backups"
  },
  fr: {
    "settings.tabCompany": "Identité & Facturation",
    "settings.tabIntegrations": "Connecteurs & Intégrations",
    "settings.tabSystem": "Système & Sauvegardes"
  },
  de: {
    "settings.tabCompany": "Identität & Fakturierung",
    "settings.tabIntegrations": "Konnektoren & Integrationen",
    "settings.tabSystem": "System & Datensicherungen"
  },
  it: {
    "settings.tabCompany": "Identità & Fatturazione",
    "settings.tabIntegrations": "Connettori & Integrazioni",
    "settings.tabSystem": "Sistema & Backup Dati"
  },
  pt: {
    "settings.tabCompany": "Identidade & Faturação",
    "settings.tabIntegrations": "Conetores & Integrações",
    "settings.tabSystem": "Sistema & Cópias de Segurança"
  },
  ar: {
    "settings.tabCompany": "الهوية والفواتير",
    "settings.tabIntegrations": "الموصلات والتكاملات",
    "settings.tabSystem": "النظام والنسخ الاحتياطي"
  },
  zh: {
    "settings.tabCompany": "企业身份与开票设置",
    "settings.tabIntegrations": "连接器与系统集成",
    "settings.tabSystem": "系统状态与数据备份"
  },
  ja: {
    "settings.tabCompany": "企業情報＆請求設定",
    "settings.tabIntegrations": "コネクタ＆外部連携",
    "settings.tabSystem": "システム＆バックアップ"
  },
  ru: {
    "settings.tabCompany": "Реквизиты & Выставление Счетов",
    "settings.tabIntegrations": "Коннекторы & Интеграции",
    "settings.tabSystem": "Система & Резервные Копии"
  }
};

for (const [lang, keys] of Object.entries(additionalKeys)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) continue;

  const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = { ...current, ...keys };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
}
console.log('Updated additional tab translations across all 10 locales!');
