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
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png') });
  console.log('Dashboard screenshot taken.');

  // CRM Module
  console.log('Navigating to CRM...');
  await page.goto('http://localhost:5173/crm');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'crm-kanban.png') });

  // HR Module
  console.log('Navigating to HR...');
  await page.goto('http://localhost:5173/hr/employees');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'hr-employees.png') });

  // Chat Module
  console.log('Navigating to Chat...');
  await page.goto('http://localhost:5173/omnichannel');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'chat-omnichannel.png') });

  // Integrations
  console.log('Navigating to Integrations...');
  await page.goto('http://localhost:5173/settings/integrations');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'integrations.png') });

  // Roles & Admin
  console.log('Navigating to Roles...');
  await page.goto('http://localhost:5173/settings/roles');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotsDir, 'roles-permissions.png') });
  
  await browser.close();
  console.log('All screenshots taken and saved to docs/assets/screenshots/');
})();
