const https = require('https');
https.get('https://www.zeleris.com/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    const srcs = [];
    while ((m = regex.exec(d)) !== null) {
      srcs.push(m[1]);
    }
    console.log('Zeleris img srcs:', srcs);
    const svgs = d.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
    console.log('Zeleris svgs:', svgs.length);
  });
}).on('error', console.error);
