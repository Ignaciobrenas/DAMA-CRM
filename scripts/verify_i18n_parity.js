const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');
const baseFile = path.join(localesDir, 'es.json');

if (!fs.existsSync(baseFile)) {
  console.error('❌ Error: Base locale file (es.json) not found at:', baseFile);
  process.exit(1);
}

const baseLocale = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const baseKeys = Object.keys(baseLocale);
console.log(`🌐 Base Spanish locale contains ${baseKeys.length} translation keys.`);

const targetLanguages = ['ca', 'en', 'fr', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ru'];
let hasErrors = false;

for (const lang of targetLanguages) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Missing translation file for language: ${lang} (${filePath})`);
    hasErrors = true;
    continue;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingKeys = baseKeys.filter((key) => content[key] === undefined || content[key] === null);

    if (missingKeys.length > 0) {
      console.error(`❌ Language [${lang.toUpperCase()}] is missing ${missingKeys.length} keys:`);
      console.error(missingKeys.slice(0, 10).map((k) => `   - ${k}`).join('\n') + (missingKeys.length > 10 ? '\n   ... and more' : ''));
      hasErrors = true;
    } else {
      console.log(`✅ [${lang.toUpperCase()}] 100% complete (${Object.keys(content).length}/${baseKeys.length} keys matched).`);
    }
  } catch (err) {
    console.error(`❌ Error parsing JSON file for [${lang}]:`, err.message);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n🚨 Translation parity check FAILED. Please sync missing keys across all locale files.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 11 languages are 100% synchronized and verified without missing keys!');
  process.exit(0);
}
