const https = require('https');
https.get('https://www.seur.com/es/index.html', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const imgMatches = d.match(/<img[^>]+src=["'][^"']*logo[^"']*["'][^>]*>/gi) || [];
    console.log('Img matches:', imgMatches);
    const svgs = d.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
    console.log('SVG count:', svgs.length);
    if (svgs.length > 0) {
      console.log('First SVG:', svgs[0].slice(0, 300));
    }
  });
}).on('error', console.error);
