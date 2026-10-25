const https = require('https');
https.get('https://www.tip-sa.com/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    const srcs = [];
    while ((m = regex.exec(d)) !== null) {
      srcs.push(m[1]);
    }
    console.log('Tipsa img srcs:', srcs.slice(0, 10));
    const svgs = d.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
    console.log('Tipsa svgs:', svgs.length);
  });
}).on('error', console.error);
