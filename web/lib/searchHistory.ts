export type HistorySearchType = 'epic' | 'mobile' | 'name' | 'booth';

export interface SearchHistoryItem {
  query: string;
  type: HistorySearchType;
  label?: string;
  part?: string;
  timestamp: number;
  epic?: string;
  name?: string;
}

const STORAGE_KEY = 'elector_lookup_recent_searches_v2';
const LEGACY_STORAGE_KEY = 'elector_lookup_recent_searches_v1';
const MAX_HISTORY_ITEMS = 8;

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Fallback: migrate legacy items if v2 is empty
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const migrated: SearchHistoryItem[] = legacyParsed.map((item: any) => ({
          query: item.epic || '',
          type: 'epic' as HistorySearchType,
          label: item.name || item.epic || '',
          timestamp: item.timestamp || Date.now(),
        }));
        return migrated;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveSearchHistoryItem(
  queryOrEpic: string,
  typeOrName?: HistorySearchType | string,
  extra?: { label?: string; part?: string }
): SearchHistoryItem[] {
  if (typeof window === 'undefined' || !queryOrEpic.trim()) return [];
  try {
    const current = getSearchHistory();
    const query = queryOrEpic.trim();

    // Determine type: if second argument is a valid HistorySearchType, use it, else default
    let type: HistorySearchType = 'name';
    let label = extra?.label;
    const part = extra?.part;

    if (
      typeOrName === 'epic' ||
      typeOrName === 'mobile' ||
      typeOrName === 'name' ||
      typeOrName === 'booth'
    ) {
      type = typeOrName;
    } else if (typeof typeOrName === 'string') {
      label = typeOrName;
      if (/^[A-Z]{3}\d{7}$/i.test(query)) type = 'epic';
      else if (/^\d{10}$/.test(query.replace(/\D/g, ''))) type = 'mobile';
    }

    // Filter out existing matching items by query
    const filtered = current.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase()
    );

    const newItem: SearchHistoryItem = {
      query,
      type,
      label: label || query,
      part,
      timestamp: Date.now(),
      epic: type === 'epic' ? query : undefined,
      name: label,
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}
