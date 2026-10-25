const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.resolve(__dirname, '../client/public/assets/carriers');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Candidate URLs from Wikimedia Commons, Simple Icons, or official resources
const candidates = [
  {
    carrier: 'correos',
    filename: 'correos.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/1/1a/Correos_logo_2019.svg',
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Correos_2019_logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/correos.svg'
    ]
  },
  {
    carrier: 'correos-express',
    filename: 'correos-express.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/0/05/Correos_Express_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Correos_Express_logo.svg/512px-Correos_Express_logo.svg.png'
    ]
  },
  {
    carrier: 'seur',
    filename: 'seur.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/c/c5/Seur_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Seur_logo.svg/512px-Seur_logo.svg.png'
    ]
  },
  {
    carrier: 'mrw',
    filename: 'mrw.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/3/30/MRW_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/MRW_logo.svg/512px-MRW_logo.svg.png'
    ]
  },
  {
    carrier: 'gls',
    filename: 'gls.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/b/b7/GLS_Logo_2021.svg',
      'https://upload.wikimedia.org/wikipedia/commons/1/1b/GLS_Group_Logo.svg'
    ]
  },
  {
    carrier: 'dhl',
    filename: 'dhl.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/dhl.svg'
    ]
  },
  {
    carrier: 'ups',
    filename: 'ups.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/6/6b/United_Parcel_Service_logo_2014.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/ups.svg'
    ]
  },
  {
    carrier: 'fedex',
    filename: 'fedex.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/9/9d/FedEx_Express.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/fedex.svg'
    ]
  },
  {
    carrier: 'tnt',
    filename: 'tnt.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/3/36/TNT_Logo.svg'
    ]
  },
  {
    carrier: 'dpd',
    filename: 'dpd.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ab/DPD_logo_%282015%29.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/dpd.svg'
    ]
  },
  {
    carrier: 'nacex',
    filename: 'nacex.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/9/97/Nacex_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Nacex_logo.svg/512px-Nacex_logo.svg.png'
    ]
  },
  {
    carrier: 'envialia',
    filename: 'envialia.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/d/dd/Logo_Envialia.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Logo_Envialia.svg/512px-Logo_Envialia.svg.png'
    ]
  },
  {
    carrier: 'inpost',
    filename: 'inpost.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/1/12/InPost_logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/inpost.svg'
    ]
  },
  {
    carrier: 'packlink',
    filename: 'packlink.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/2/23/Logo_Packlink.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/packlink.svg'
    ]
  },
  {
    carrier: 'zeleris',
    filename: 'zeleris.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_Zeleris.svg',
      'https://www.zeleris.com/wp-content/themes/zeleris/images/logo-zeleris.svg'
    ]
  },
  {
    carrier: 'tipsa',
    filename: 'tipsa.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/2/2b/Logo_TIPSA.svg',
      'https://www.tip-sa.com/templates/tipsa_2020/images/logo.svg'
    ]
  },
  {
    carrier: 'celeritas',
    filename: 'celeritas.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/5/5e/Celeritas_logo.svg',
      'https://celeritastransporte.com/wp-content/themes/celeritas/assets/images/logo.svg'
    ]
  },
  {
    carrier: 'amazon',
    filename: 'amazon.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/amazon.svg'
    ]
  },
  {
    carrier: 'chronopost',
    filename: 'chronopost.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/0/07/Chronopost_logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/chronopost.svg'
    ]
  },
  {
    carrier: 'cabify',
    filename: 'cabify.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Cabify_logo.svg',
      'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/cabify.svg'
    ]
  },
  {
    carrier: 'redyser',
    filename: 'redyser.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/8/87/Logo_Redyser.svg'
    ]
  },
  {
    carrier: 'ontime',
    filename: 'ontime.svg',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/1/14/Ontime_Logistica.svg',
      'https://www.ontime.es/wp-content/themes/ontime/assets/images/logo.svg'
    ]
  }
];

async function run() {
  console.log(`Starting carrier logo download into ${targetDir}...`);
  const results = [];

  for (const item of candidates) {
    const dest = path.join(targetDir, item.filename);
    let success = false;
    let successfulUrl = null;

    for (const url of item.urls) {
      try {
        console.log(`Checking [${item.carrier}] -> ${url}`);
        execSync(`curl.exe -s -L -f -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0)" -o "${dest}" "${url}"`, { timeout: 15000 });
        const stat = fs.statSync(dest);
        if (stat.size > 200) {
          const content = fs.readFileSync(dest, 'utf8');
          if (content.includes('<svg') || content.includes('<?xml')) {
            console.log(`  ✓ Successfully downloaded SVG (${stat.size} bytes)`);
            success = true;
            successfulUrl = url;
            break;
          } else {
            console.log(`  ⚠️ Downloaded file is not valid SVG text (${stat.size} bytes).`);
          }
        }
      } catch (e) {
        // try next
      }
    }

    results.push({
      carrier: item.carrier,
      filename: item.filename,
      success,
      url: successfulUrl
    });
  }

  console.log('\n--- Summary of Download Results ---');
  console.table(results);
}

run();
