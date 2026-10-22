#!/usr/bin/env node

/**
 * Standalone Node.js Push Notification Dispatcher Script
 *
 * Usage:
 *   node scripts/send-push.js [templateId]
 *
 * Available templates:
 *   - default_notice
 *   - night_before      (22 Oct 2026, 8:00 PM IST)
 *   - polling_morning   (23 Oct 2026, 7:00 AM IST)
 *   - polling_afternoon (23 Oct 2026, 2:00 PM IST)
 *
 * Custom message example:
 *   node scripts/send-push.js custom "Title" "Body in Kannada + English" "https://..."
 */

const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

// 1. Load VAPID credentials
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:campaign@shashihulikuntemutt.com';
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BMdNkZ8bdFSIAwaVY8lSqt5EI5jF87f7x1OGwLJoDwm6qxt2uUR6R0B97QroKkBXosiFCHn57K7l1AaDmfIKTzY';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'Lsd9cHZan4H1Q1jv_f6hkbfuRXZPFHXRZpz4HoaxIRM';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const SUBS_FILE = path.join(__dirname, '../data/push_subscriptions.json');

const TEMPLATES = {
  default_notice: {
    title: 'Polling Day — 23 Oct 2026',
    body: 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
    url: '/search',
    tag: 'polling-day-reminder',
  },
  night_before: {
    title: 'Tomorrow is Polling Day — Shashi Hulikuntemutt',
    body: 'MLC Election tomorrow, 23 Oct 2026. Voting starts at 8:00 AM. ನಾಳೆ ವಿಧಾನ ಪರಿಷತ್ ಚುನಾವಣೆ. ಬೆಳಿಗ್ಗೆ 8:00 ರಿಂದ ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್ ಅವರಿಗೆ ನಿಮ್ಮ ಮತ ನೀಡಿ.',
    url: '/search',
    tag: 'night-before-reminder',
  },
  polling_morning: {
    title: 'Polling Stations Open Today — 8:00 AM to 4:00 PM',
    body: 'Cast your 1st preference vote for Shashi Hulikuntemutt. ಮತಗಟ್ಟೆಗಳು ಇಂದು ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ ತೆರೆದಿರುತ್ತವೆ. ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್ ಅವರಿಗೆ ಮತ ಚಲಾಯಿಸಿ.',
    url: '/search',
    tag: 'polling-morning-reminder',
  },
  polling_afternoon: {
    title: 'Last 2 Hours to Vote — Closes at 4:00 PM',
    body: 'Voting closes at 4:00 PM today. Ensure you cast your 1st preference vote for Shashi Hulikuntemutt. ಮತದಾನ ಸಂಜೆ 4 ಕ್ಕೆ ಮುಕ್ತಾಯವಾಗಲಿದೆ. ತಪ್ಪದೇ ಮತ ಚಲಾಯಿಸಿ.',
    url: '/search',
    tag: 'polling-afternoon-reminder',
  },
};

async function run() {
  const args = process.argv.slice(2);
  let templateKey = args[0] || 'default_notice';

  let payload;
  if (templateKey === 'custom') {
    payload = {
      title: args[1] || 'Polling Day — 23 Oct 2026',
      body: args[2] || 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
      url: args[3] || '/search',
      tag: 'custom-announcement',
    };
  } else if (TEMPLATES[templateKey]) {
    payload = TEMPLATES[templateKey];
  } else {
    console.error(`Unknown template: ${templateKey}. Choose from: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  console.log(`[Push Dispatcher] Target template: ${templateKey}`);
  console.log(`[Push Dispatcher] Title: ${payload.title}`);
  console.log(`[Push Dispatcher] Body:  ${payload.body}`);

  if (!fs.existsSync(SUBS_FILE)) {
    console.log('[Push Dispatcher] No subscriptions file found at', SUBS_FILE);
    return;
  }

  const raw = fs.readFileSync(SUBS_FILE, 'utf-8');
  const subs = JSON.parse(raw);
  if (!Array.isArray(subs) || subs.length === 0) {
    console.log('[Push Dispatcher] 0 active subscriptions in store.');
    return;
  }

  console.log(`[Push Dispatcher] Broadcasting to ${subs.length} subscribers...`);

  let sent = 0;
  let failed = 0;
  const deadEndpoints = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          tag: payload.tag,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        }),
        {
          TTL: 86400,
          urgency: 'high',
        }
      );
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
      } else {
        console.warn(`Delivery error for endpoint:`, err.message);
      }
    }
  }

  if (deadEndpoints.length > 0) {
    const cleanSubs = subs.filter((s) => !deadEndpoints.includes(s.endpoint));
    fs.writeFileSync(SUBS_FILE, JSON.stringify(cleanSubs, null, 2), 'utf-8');
    console.log(`[Push Dispatcher] Pruned ${deadEndpoints.length} expired endpoints.`);
  }

  console.log(`[Push Dispatcher] Finished! Sent: ${sent}, Failed: ${failed}.`);
}

run().catch((err) => {
  console.error('[Push Dispatcher] Fatal error:', err);
  process.exit(1);
});
