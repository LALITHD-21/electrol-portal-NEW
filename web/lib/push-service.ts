import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';
export * from './push-types';
import {
  PushSubscriptionRecord,
  SendPushPayload,
  SCHEDULED_REMINDERS,
  CANDIDATE_NAME_EN,
  CANDIDATE_NAME_KN,
} from './push-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Initialize VAPID
function ensureVapidConfig() {
  const subject = process.env.VAPID_SUBJECT || 'mailto:campaign@shashihulikuntemutt.com';
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BMdNkZ8bdFSIAwaVY8lSqt5EI5jF87f7x1OGwLJoDwm6qxt2uUR6R0B97QroKkBXosiFCHn57K7l1AaDmfIKTzY';
  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    'Lsd9cHZan4H1Q1jv_f6hkbfuRXZPFHXRZpz4HoaxIRM';

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.warn('VAPID initialization error:', err);
  }
}

/**
 * Load all push subscriptions
 */
export async function getAllSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const subscriptionsMap = new Map<string, PushSubscriptionRecord>();

  // 1. Load from local JSON store
  try {
    if (fs.existsSync(SUBS_FILE)) {
      const raw = await fs.promises.readFile(SUBS_FILE, 'utf-8');
      const list: PushSubscriptionRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((sub) => {
          if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth) {
            subscriptionsMap.set(sub.endpoint, sub);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed reading push_subscriptions.json:', e);
  }

  // 2. Load from Supabase dashboard_snapshot (persistent JSONB store)
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data: snapshot } = await supabase
        .from('dashboard_snapshot')
        .select('payload')
        .eq('id', 1)
        .maybeSingle();

      const cloudSubs = snapshot?.payload?.push_subscriptions;
      if (Array.isArray(cloudSubs)) {
        cloudSubs.forEach((sub: any) => {
          if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth) {
            subscriptionsMap.set(sub.endpoint, {
              id: sub.id || `sub_${Date.now()}`,
              endpoint: sub.endpoint,
              keys: typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys,
              language: sub.language || 'en',
              userAgent: sub.userAgent || sub.user_agent || 'Web Client',
              subscribedAt: sub.subscribedAt || sub.subscribed_at || new Date().toISOString(),
              dailyNotificationCount: sub.dailyNotificationCount || 0,
              lastNotificationDate: sub.lastNotificationDate || sub.last_notification_date,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed fetching push_subscriptions from Supabase snapshot:', err);
  }

  // 3. Load from Supabase push_subscriptions table if present
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('push_subscriptions').select('*');
      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.endpoint) {
            subscriptionsMap.set(row.endpoint, {
              id: row.id || `sub_${Date.now()}`,
              endpoint: row.endpoint,
              keys: typeof row.keys === 'string' ? JSON.parse(row.keys) : row.keys,
              language: row.language || 'en',
              userAgent: row.user_agent,
              subscribedAt: row.subscribed_at || new Date().toISOString(),
              dailyNotificationCount: row.daily_notification_count || 0,
              lastNotificationDate: row.last_notification_date,
            });
          }
        });
      }
    }
  } catch (e) {
    // Supabase optional
  }

  return Array.from(subscriptionsMap.values());
}

/**
 * Persist subscriptions to local storage and Supabase
 */
async function saveSubscriptions(subscriptions: PushSubscriptionRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(SUBS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed writing to push_subscriptions.json:', e);
  }

  // Persist directly to Supabase dashboard_snapshot
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data: snapshot } = await supabase
        .from('dashboard_snapshot')
        .select('payload')
        .eq('id', 1)
        .maybeSingle();

      if (snapshot) {
        const updatedPayload = {
          ...snapshot.payload,
          push_subscriptions: subscriptions,
        };
        await supabase
          .from('dashboard_snapshot')
          .update({ payload: updatedPayload, refreshed_at: new Date().toISOString() })
          .eq('id', 1);
      }
    }
  } catch (e) {
    console.warn('Failed syncing push_subscriptions to Supabase snapshot:', e);
  }
}

/**
 * Save or update a subscription
 */
export async function saveSubscription(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  language: 'en' | 'kn' = 'en',
  userAgent?: string
): Promise<PushSubscriptionRecord> {
  const current = await getAllSubscriptions();
  const existingIndex = current.findIndex((s) => s.endpoint === subscription.endpoint);

  const now = new Date().toISOString();
  const record: PushSubscriptionRecord = {
    id: existingIndex >= 0 ? current[existingIndex].id : `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    language,
    userAgent: userAgent || 'Web PWA Client',
    subscribedAt: existingIndex >= 0 ? current[existingIndex].subscribedAt : now,
    dailyNotificationCount: 0,
  };

  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...record };
  } else {
    current.push(record);
  }

  await saveSubscriptions(current);

  // Also sync to Supabase table if available
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from('push_subscriptions').upsert(
        {
          id: record.id,
          endpoint: record.endpoint,
          keys: JSON.stringify(record.keys),
          language: record.language,
          user_agent: record.userAgent,
          subscribed_at: record.subscribedAt,
        },
        { onConflict: 'endpoint' }
      );
    }
  } catch (e) {
    // Supabase optional
  }

  return record;
}

/**
 * Remove a subscription by endpoint
 */
export async function removeSubscription(endpoint: string): Promise<boolean> {
  const current = await getAllSubscriptions();
  const filtered = current.filter((s) => s.endpoint !== endpoint);

  if (filtered.length !== current.length) {
    await saveSubscriptions(filtered);

    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
    } catch {}

    return true;
  }
  return false;
}

/**
 * Broadcast notification to all matching subscribers with rate limiting (max 3 per day)
 */
export async function broadcastPushNotification(payload: SendPushPayload): Promise<{
  total: number;
  sent: number;
  failed: number;
  removedDead: number;
  rateLimited: number;
}> {
  ensureVapidConfig();

  const subscribers = await getAllSubscriptions();
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let sent = 0;
  let failed = 0;
  let removedDead = 0;
  let rateLimited = 0;

  const deadEndpoints: string[] = [];

  for (const sub of subscribers) {
    // 1. Language filter
    if (payload.language && payload.language !== 'all' && sub.language !== payload.language) {
      continue;
    }

    // 2. Maximum 3 notifications per day safety enforcement
    const subDate = sub.lastNotificationDate || '';
    let currentDailyCount = subDate === todayKey ? sub.dailyNotificationCount || 0 : 0;
    if (currentDailyCount >= 3) {
      rateLimited++;
      continue;
    }

    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/search',
      tag: payload.tag || 'polling-day-reminder',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        pushData,
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        }
      );

      sent++;
      sub.dailyNotificationCount = currentDailyCount + 1;
      sub.lastNotificationDate = todayKey;
      sub.lastNotifiedAt = new Date().toISOString();
    } catch (err: any) {
      failed++;
      // Clean up unsubscribed / expired endpoints (HTTP 404 or 410 Gone)
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
        removedDead++;
      } else {
        console.warn(`Push delivery failed for ${sub.endpoint.slice(0, 30)}...:`, err.message);
      }
    }
  }

  // Remove dead subscriptions
  if (deadEndpoints.length > 0) {
    const remaining = subscribers.filter((s) => !deadEndpoints.includes(s.endpoint));
    await saveSubscriptions(remaining);
  } else {
    await saveSubscriptions(subscribers);
  }

  return {
    total: subscribers.length,
    sent,
    failed,
    removedDead,
    rateLimited,
  };
}
