const https = require('https');

https.get('https://shashi-hulikuntemutt.vercel.app/search', res => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const assets = [...html.matchAll(/(src|href)="(\/_next\/[^"]+)"/g)].map(m => m[2]);
    console.log(`Found ${assets.length} Next.js static assets`);
    let tested = 0;
    let failed = 0;
    assets.forEach(asset => {
      https.get('https://shashi-hulikuntemutt.vercel.app' + asset, r => {
        tested++;
        if (r.statusCode !== 200) {
          console.error(`FAILED: ${asset} -> ${r.statusCode}`);
          failed++;
        }
        if (tested === assets.length) {
          console.log(`All assets verified! Total: ${tested}, Failed: ${failed}`);
        }
        r.resume();
      }).on('error', e => console.error(asset, e.message));
    });
  });
});
