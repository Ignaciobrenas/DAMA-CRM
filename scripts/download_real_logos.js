const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.resolve(__dirname, '../client/public/assets/logos/integrations');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const logos = [
  {
    name: 'google-calendar.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/512px-Google_Calendar_icon_%282020%29.svg.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png'
  },
  {
    name: 'apple-calendar.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Calendar_%28macOS%29.png/512px-Calendar_%28macOS%29.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/0/747.png'
  },
  {
    name: 'whatsapp.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png'
  },
  {
    name: 'shopify.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/512px-Shopify_logo_2018.svg.png',
    alt: 'https://cdn.iconscout.com/icon/free/png-512/free-shopify-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-3030252.png'
  },
  {
    name: 'woocommerce.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/WooCommerce_logo.svg/512px-WooCommerce_logo.svg.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/5968/5968393.png'
  },
  {
    name: 'stripe.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/5968/5968382.png'
  },
  {
    name: 'zapier.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zapier_logo.svg/512px-Zapier_logo.svg.png',
    alt: 'https://cdn.iconscout.com/icon/free/png-512/free-zapier-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-7-pack-logos-icons-3030278.png'
  },
  {
    name: 'odoo.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Odoo_logo.svg/512px-Odoo_logo.svg.png',
    alt: 'https://raw.githubusercontent.com/odoo/odoo/master/addons/web/static/img/favicon.ico'
  },
  {
    name: 'opencart.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Opencart_logo.svg/512px-Opencart_logo.svg.png',
    alt: 'https://cdn-icons-png.flaticon.com/512/5968/5968322.png'
  },
  {
    name: 'n8n.png',
    url: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png',
    alt: 'https://images.opencollective.com/n8n/4351659/logo/256.png'
  },
  {
    name: 'sage.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/The_Sage_Group_logo.svg/512px-The_Sage_Group_logo.svg.png',
    alt: 'https://cdn.worldvectorlogo.com/logos/sage-6.svg'
  },
  {
    name: 'gls.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/GLS_Logo_2021.svg/512px-GLS_Logo_2021.svg.png',
    alt: 'https://cdn.worldvectorlogo.com/logos/gls-1.svg'
  },
  {
    name: 'nacex.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Nacex_logo.svg/512px-Nacex_logo.svg.png',
    alt: 'https://cdn.worldvectorlogo.com/logos/nacex.svg'
  },
  {
    name: 'correos.png',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Correos_logo_2019.svg/512px-Correos_logo_2019.svg.png',
    alt: 'https://cdn.worldvectorlogo.com/logos/correos-3.svg'
  },
  {
    name: 'unopim.png',
    url: 'https://raw.githubusercontent.com/unopim/unopim/main/packages/Webkul/Admin/src/Resources/assets/images/logo.svg',
    alt: 'https://raw.githubusercontent.com/unopim/unopim/main/public/favicon.ico'
  }
];

console.log('Downloading real official PNG logos for integrations...');

for (const logo of logos) {
  const destPath = path.join(targetDir, logo.name);
  console.log(`Fetching ${logo.name}...`);
  try {
    // Try primary URL
    execSync(`curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${destPath}" "${logo.url}"`, { timeout: 15000 });
    const stat = fs.statSync(destPath);
    if (stat.size < 500) {
      throw new Error(`File too small: ${stat.size} bytes`);
    }
    console.log(`✓ ${logo.name} (${stat.size} bytes)`);
  } catch (err) {
    console.log(`Failed primary for ${logo.name}, trying fallback ${logo.alt}...`);
    try {
      execSync(`curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${destPath}" "${logo.alt}"`, { timeout: 15000 });
      const stat = fs.statSync(destPath);
      console.log(`✓ (Fallback) ${logo.name} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`✗ Error downloading ${logo.name}:`, e.message);
    }
  }
}

console.log('Done downloading logos.');
