const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../client/public/assets/logos/integrations');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Direct CDN downloads for walkxcode dashboard-icons
  const directIcons = [
    { name: 'google-calendar.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/google-calendar.png' },
    { name: 'apple-calendar.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/apple.png' },
    { name: 'whatsapp.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/whatsapp.png' },
    { name: 'shopify.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/shopify.png' },
    { name: 'woocommerce.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/woocommerce.png' },
    { name: 'stripe.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/stripe.png' },
    { name: 'zapier.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/zapier.png' },
    { name: 'odoo.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/odoo.png' },
    { name: 'opencart.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/opencart.png' },
    { name: 'n8n.png', url: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/n8n.png' },
  ];

  for (const item of directIcons) {
    try {
      const res = await page.goto(item.url, { timeout: 15000 });
      if (res && res.status() === 200) {
        const body = await res.body();
        fs.writeFileSync(path.join(targetDir, item.name), body);
        console.log(`Saved ${item.name} (${body.length} bytes)`);
      }
    } catch (e) {
      console.error(`Failed ${item.name}:`, e.message);
    }
  }

  // 2. Official sites for Nacex, GLS, Correos, Sage, UnoPim
  const sites = [
    {
      name: 'nacex.png',
      url: 'https://www.nacex.es',
      selector: 'img[src*="logo" i], header img',
    },
    {
      name: 'correos.png',
      url: 'https://www.correos.es',
      selector: 'img[src*="logo" i], header img',
    },
    {
      name: 'gls.png',
      url: 'https://www.gls-spain.es/es/',
      selector: 'img[src*="logo" i], header img',
    },
    {
      name: 'sage.png',
      url: 'https://www.sage.com/es-es/',
      selector: 'img[src*="logo" i], header img',
    },
    {
      name: 'unopim.png',
      url: 'https://unopim.com/',
      selector: 'img[src*="logo" i], header img',
    }
  ];

  for (const site of sites) {
    console.log(`Checking ${site.name} on ${site.url}...`);
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500);

      // Find logo element
      const logoEl = await page.$(site.selector);
      if (logoEl) {
        const outPath = path.join(targetDir, site.name);
        // Screenshot with transparent background
        await logoEl.screenshot({ path: outPath, omitBackground: true });
        const stat = fs.statSync(outPath);
        console.log(`✓ Captured ${site.name} screenshot (${stat.size} bytes)`);
      } else {
        console.log(`Could not find selector for ${site.name}`);
      }
    } catch (err) {
      console.error(`Error on ${site.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Finished logo retrieval.');
}

run();
