const fs = require('fs');
const path = require('path');

const es = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client/src/i18n/locales/es.json'), 'utf8'));

function scanDir(dir, results = []) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist') {
        scanDir(fullPath, results);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(item)) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = scanDir(path.resolve(__dirname, '../client/src'));
const missingMap = {};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /\bt\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (key.includes('${')) continue;
    if (!es[key]) {
      if (!missingMap[key]) missingMap[key] = [];
      missingMap[key].push(path.relative(path.resolve(__dirname, '..'), file));
    }
  }
}

const keys = Object.keys(missingMap).sort();
console.log('MISSING_KEYS_LIST:');
console.log(JSON.stringify(keys, null, 2));
