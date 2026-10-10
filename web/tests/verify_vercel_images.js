const https = require('https');

const publicImages = [
  '/candidate-avatar.jpg',
  '/candidate-photo.jpg',
  '/congress-flag.png',
  '/inc-logo.png',
  '/app-logo.png',
  '/logo-emblem.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/splash-mobile.jpg',
  '/qr-vercel.png'
];

let tested = 0;
let failed = 0;

publicImages.forEach(img => {
  https.get('https://shashi-hulikuntemutt.vercel.app' + img, res => {
    tested++;
    if (res.statusCode !== 200) {
      console.error(`FAILED image: ${img} (${res.statusCode})`);
      failed++;
    } else {
      console.log(`[PASS] ${img} -> 200 OK (${res.headers['content-type']}, ${res.headers['content-length']} bytes)`);
    }
    if (tested === publicImages.length) {
      console.log(`\nImage verification complete: ${tested - failed}/${tested} passed.`);
    }
    res.resume();
  }).on('error', e => {
    console.error(`ERROR: ${img}`, e.message);
    failed++;
  });
});
