const https = require('https');
https.get('https://www.nacex.com/irHome.do', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    const srcs = [];
    while ((m = regex.exec(d)) !== null) {
      srcs.push(m[1]);
    }
    console.log('Nacex image srcs:', srcs.slice(0, 15));
  });
}).on('error', console.error);
