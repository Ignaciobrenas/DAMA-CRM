const fs = require('fs');
const path = require('path');

const pngPath = path.resolve(__dirname, '../client/public/assets/logos/dama-symbol-white.png');
const svgPath = path.resolve(__dirname, '../client/public/favicon.svg');

if (!fs.existsSync(pngPath)) {
  console.error('dama-symbol-white.png not found at:', pngPath);
  process.exit(1);
}

const b64 = fs.readFileSync(pngPath).toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

fs.writeFileSync(svgPath, svgContent.trim());
console.log('Successfully created favicon.svg from dama-symbol-white.png at:', svgPath);
