export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  language: 'en' | 'kn';
  userAgent?: string;
  subscribedAt: string;
  lastNotifiedAt?: string;
  dailyNotificationCount?: number;
  lastNotificationDate?: string;
}

export interface SendPushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  language?: 'all' | 'en' | 'kn';
  bypassRateLimit?: boolean;
}

// Strict Candidate Name invariants
export const CANDIDATE_NAME_EN = 'Shashi Hulikuntemutt';
export const CANDIDATE_NAME_KN = 'ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್';

// Scheduled Reminders Configuration
export const SCHEDULED_REMINDERS = [
  {
    id: 'night_before',
    scheduledTimeIST: '22 October 2026, 8:00 PM IST',
    title: `Tomorrow is Polling Day — ${CANDIDATE_NAME_EN}`,
    body: `MLC Election tomorrow, 23 Oct 2026. Voting starts at 8:00 AM. ನಾಳೆ ವಿಧಾನ ಪರಿಷತ್ ಚುನಾವಣೆ. ಬೆಳಿಗ್ಗೆ 8:00 ರಿಂದ ${CANDIDATE_NAME_KN} ಅವರಿಗೆ ನಿಮ್ಮ ಮತ ನೀಡಿ.`,
    url: '/search',
    tag: 'night-before-reminder',
  },
  {
    id: 'polling_morning',
    scheduledTimeIST: '23 October 2026, 7:00 AM IST',
    title: 'Polling Stations Open Today — 8:00 AM to 4:00 PM',
    body: `Cast your 1st preference vote for ${CANDIDATE_NAME_EN}. ಮತಗಟ್ಟೆಗಳು ಇಂದು ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ ತೆರೆದಿರುತ್ತವೆ. ${CANDIDATE_NAME_KN} ಅವರಿಗೆ ಮತ ಚಲಾಯಿಸಿ.`,
    url: '/search',
    tag: 'polling-morning-reminder',
  },
  {
    id: 'polling_afternoon',
    scheduledTimeIST: '23 October 2026, 2:00 PM IST',
    title: 'Last 2 Hours to Vote — Closes at 4:00 PM',
    body: `Voting closes at 4:00 PM today. Ensure you cast your 1st preference vote for ${CANDIDATE_NAME_EN}. ಮತದಾನ ಸಂಜೆ 4 ಕ್ಕೆ ಮುಕ್ತಾಯವಾಗಲಿದೆ. ತಪ್ಪದೇ ಮತ ಚಲಾಯಿಸಿ.`,
    url: '/search',
    tag: 'polling-afternoon-reminder',
  },
  {
    id: 'default_notice',
    scheduledTimeIST: 'Immediate / Default Notice',
    title: 'Polling Day — 23 Oct 2026',
    body: 'Voting 8:00 AM – 4:00 PM. ಮತದಾನ ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
    url: '/search',
    tag: 'polling-day-reminder',
  },
];
