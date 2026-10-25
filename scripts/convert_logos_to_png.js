const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });

  const dir = path.join(__dirname, 'client', 'public', 'assets', 'logos', 'integrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

  for (const file of files) {
    const svgPath = path.join(dir, file);
    const pngName = file.replace('.svg', '.png');
    const pngPath = path.join(dir, pngName);

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 256px; height: 256px; }
          svg { width: 256px; height: 256px; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.screenshot({ path: pngPath, omitBackground: true });
    console.log(`Created: ${pngName}`);
  }

  await browser.close();
}

convertSvgToPng().catch(console.error);
