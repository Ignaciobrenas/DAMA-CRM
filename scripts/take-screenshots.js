const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', 'docs', 'assets', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // Inject localStorage to bypass GDPR Cookie Banner before it even loads
  await page.addInitScript(() => {
    window.localStorage.setItem('dama_cookie_consent', 'accepted');
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: path.join(screenshotsDir, 'login.png') });
  console.log('Login screenshot taken.');

  console.log('Logging in...');
  await page.fill('input[type="email"]', 'ignaciobrenas@gmail.com');
  await page.fill('input[type="password"]', '1');
  await page.click('button[type="submit"]', { force: true });
  
  // Wait for dashboard to load
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(screenshotsDir, '1-dashboard.png') });
  console.log('Dashboard screenshot taken.');

  const pagesToScreenshot = [
    { name: '2-crm-pipeline', url: 'http://localhost:5173/pipeline' },
    { name: '3-agile-planner', url: 'http://localhost:5173/agile' },
    { name: '4-contacts', url: 'http://localhost:5173/contacts' },
    { name: '5-companies', url: 'http://localhost:5173/companies' },
    { name: '6-invoicing', url: 'http://localhost:5173/invoicing' },
    { name: '7-inventory', url: 'http://localhost:5173/inventory' },
    { name: '8-workflows', url: 'http://localhost:5173/workflows' },
    { name: '9-chat-omnichannel', url: 'http://localhost:5173/omnichannel' },
    { name: '10-reports', url: 'http://localhost:5173/reports' },
    { name: '11-hr-employees', url: 'http://localhost:5173/portal-empleado' },
    { name: '12-settings-integrations', url: 'http://localhost:5173/settings/integrations' },
    { name: '13-settings-roles', url: 'http://localhost:5173/settings/roles' },
    { name: '14-my-time', url: 'http://localhost:5173/my-time' }
  ];

  for (const p of pagesToScreenshot) {
    console.log(`Navigating to ${p.name}...`);
    await page.goto(p.url);
    await page.waitForTimeout(2500); // Wait for animations and data loading
    await page.screenshot({ path: path.join(screenshotsDir, `${p.name}.png`) });
    console.log(`${p.name} screenshot taken.`);
  }

  await browser.close();
  console.log('All screenshots taken and saved to docs/assets/screenshots/');
})();
