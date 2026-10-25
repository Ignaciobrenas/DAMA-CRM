const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const targetDir = path.resolve(__dirname, '../client/public/assets/carriers');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DamaBot/1.0 (info@dama-crm.local)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  try {
    execSync(`curl.exe -s -L -f -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${dest}" "${url}"`, { timeout: 15000 });
    const stat = fs.statSync(dest);
    if (stat.size > 200) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

const CARRIERS_SEARCH = [
  { id: 'correos', file: 'correos.svg', queries: ['Correos logo svg', 'Logo Correos 2019 svg'] },
  { id: 'correos-express', file: 'correos-express.svg', queries: ['Correos Express logo svg', 'Correos Express svg'] },
  { id: 'seur', file: 'seur.svg', queries: ['SEUR logo svg', 'Seur logo'] },
  { id: 'mrw', file: 'mrw.svg', queries: ['MRW logo svg', 'MRW transporte svg'] },
  { id: 'gls', file: 'gls.svg', queries: ['GLS logo 2021 svg', 'GLS Group Logo svg'] },
  { id: 'dhl', file: 'dhl.svg', queries: ['DHL Logo svg'] },
  { id: 'ups', file: 'ups.svg', queries: ['United Parcel Service logo 2014 svg', 'UPS logo svg'] },
  { id: 'fedex', file: 'fedex.svg', queries: ['FedEx Express svg', 'FedEx logo svg'] },
  { id: 'tnt', file: 'tnt.svg', queries: ['TNT Logo svg', 'TNT Express svg'] },
  { id: 'dpd', file: 'dpd.svg', queries: ['DPD logo 2015 svg', 'DPD logo svg'] },
  { id: 'nacex', file: 'nacex.svg', queries: ['Nacex logo svg', 'Logo Nacex'] },
  { id: 'envialia', file: 'envialia.svg', queries: ['Envialia logo svg', 'Logo Envialia'] },
  { id: 'inpost', file: 'inpost.svg', queries: ['InPost logo svg', 'InPost svg'] },
  { id: 'packlink', file: 'packlink.svg', queries: ['Packlink logo svg', 'Logo Packlink'] },
  { id: 'zeleris', file: 'zeleris.svg', queries: ['Zeleris logo svg', 'Telefonica Zeleris svg'] },
  { id: 'tipsa', file: 'tipsa.svg', queries: ['TIPSA logo svg', 'Tipsa transporte svg'] },
  { id: 'celeritas', file: 'celeritas.svg', queries: ['Celeritas logo svg', 'Celeritas transporte svg'] },
  { id: 'amazon', file: 'amazon.svg', queries: ['Amazon logo svg'] },
  { id: 'chronopost', file: 'chronopost.svg', queries: ['Chronopost logo svg', 'Chronopost svg'] },
  { id: 'cabify', file: 'cabify.svg', queries: ['Cabify logo svg', 'Cabify svg'] },
  { id: 'redyser', file: 'redyser.svg', queries: ['Redyser logo svg', 'Redyser transporte svg'] },
  { id: 'ontime', file: 'ontime.svg', queries: ['Ontime Logistica svg', 'Ontime Transporte svg'] },
];

async function searchWikimedia(query) {
  const enc = encodeURIComponent(query);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${enc}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&format=json`;
  try {
    const data = await fetchJson(url);
    const pages = Object.values(data.query?.pages || {});
    const svgPages = pages.filter(p => p.imageinfo?.[0]?.mime === 'image/svg+xml');
    if (svgPages.length > 0) {
      return {
        title: svgPages[0].title,
        url: svgPages[0].imageinfo[0].url,
        size: svgPages[0].imageinfo[0].size
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function run() {
  console.log('Resolving carrier logos via Wikimedia Commons API...');
  const results = [];

  for (const c of CARRIERS_SEARCH) {
    const dest = path.join(targetDir, c.file);
    // If already downloaded and valid SVG, keep it
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      const content = fs.readFileSync(dest, 'utf8');
      if (content.includes('<svg')) {
        console.log(`[ALREADY PRESENT] ${c.id} -> ${c.file} (${fs.statSync(dest).size} bytes)`);
        results.push({ id: c.id, status: 'EXISTS', file: c.file, source: 'Local' });
        continue;
      }
    }

    let found = null;
    for (const q of c.queries) {
      const res = await searchWikimedia(q);
      if (res) {
        found = res;
        break;
      }
    }

    if (found) {
      console.log(`[FOUND ON WIKIMEDIA] ${c.id}: ${found.title} -> ${found.url}`);
      const ok = downloadFile(found.url, dest);
      if (ok) {
        console.log(`  ✓ Downloaded ${c.file}`);
        results.push({ id: c.id, status: 'DOWNLOADED_SVG', file: c.file, source: found.url });
        continue;
      }
    }

    console.log(`[NOT ON WIKIMEDIA] ${c.id}`);
    results.push({ id: c.id, status: 'MISSING', file: c.file, source: null });
  }

  console.log('\n--- Status Report ---');
  console.table(results);
}

run();
