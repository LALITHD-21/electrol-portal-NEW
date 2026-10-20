import fs from 'fs';
import path from 'path';
import { isValidIndianMobile, cleanIndianMobile } from './utils';

interface PhoneLookup {
  epics: Record<string, string>;
  name_parts: Record<string, string>;
}

let cachedLookup: PhoneLookup | null = null;
let phoneToEpics: Map<string, string[]> | null = null;

function getPhoneLookup(): PhoneLookup {
  if (!cachedLookup) {
    try {
      const candidates = [
        path.join(process.cwd(), 'lib/phone_lookup.json'),
        path.join(process.cwd(), 'web/lib/phone_lookup.json'),
        path.join(__dirname, 'phone_lookup.json'),
        path.join(__dirname, '../lib/phone_lookup.json'),
      ];
      let jsonPath = '';
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          jsonPath = c;
          break;
        }
      }

      if (jsonPath) {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const cleanEpics: Record<string, string> = {};
        const cleanNameParts: Record<string, string> = {};

        if (raw?.epics) {
          for (const [epic, phone] of Object.entries(raw.epics)) {
            const clean = cleanIndianMobile(phone as string);
            if (clean) cleanEpics[epic] = clean;
          }
        }
        if (raw?.name_parts) {
          for (const [np, phone] of Object.entries(raw.name_parts)) {
            const clean = cleanIndianMobile(phone as string);
            if (clean) cleanNameParts[np] = clean;
          }
        }
        cachedLookup = { epics: cleanEpics, name_parts: cleanNameParts };
      } else {
        cachedLookup = { epics: {}, name_parts: {} };
      }
    } catch (e) {
      console.warn('Failed to load phone_lookup.json:', e);
      cachedLookup = { epics: {}, name_parts: {} };
    }

    // Build reverse phone to epics map (ONLY valid 10-digit mobile numbers)
    phoneToEpics = new Map();
    if (cachedLookup?.epics) {
      for (const [epic, phone] of Object.entries(cachedLookup.epics)) {
        if (isValidIndianMobile(phone)) {
          const list = phoneToEpics.get(phone);
          if (list) {
            list.push(epic);
          } else {
            phoneToEpics.set(phone, [epic]);
          }
        }
      }
    }
  }
  return cachedLookup!;
}

export function resolveElectorPhone(elector: {
  epic_number?: string | null;
  name?: string | null;
  part_number?: string | number | null;
  whatsapp_mob?: string | null;
}): string | null {
  // 1. Direct phone check on elector record
  const directPhone = cleanIndianMobile(elector.whatsapp_mob);
  if (directPhone) {
    return directPhone;
  }

  // 2. Verified lookup by EPIC
  const lookup = getPhoneLookup();

  if (elector.epic_number) {
    const compactEpic = String(elector.epic_number).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compactEpic && lookup.epics[compactEpic]) {
      const epicPhone = cleanIndianMobile(lookup.epics[compactEpic]);
      if (epicPhone) return epicPhone;
    }
  }

  // 3. Verified lookup by Name + Part Number
  if (elector.name && elector.part_number !== undefined && elector.part_number !== null) {
    const cleanName = String(elector.name).trim().toUpperCase();
    const cleanPart = String(elector.part_number).trim();
    if (cleanPart && !cleanPart.startsWith('2026-')) {
      const key = `${cleanName}:${cleanPart}`;
      if (lookup.name_parts[key]) {
        const namePartPhone = cleanIndianMobile(lookup.name_parts[key]);
        if (namePartPhone) return namePartPhone;
      }
    }
  }

  // 4. If no authentic verified phone exists, LEAVE BLANK (never return timestamps or part numbers)
  return null;
}

export function findEpicsByPhone(phoneQuery: string): string[] {
  getPhoneLookup();
  if (!phoneToEpics) return [];

  const clean = phoneQuery.replace(/\D/g, '');
  if (!clean || clean.length < 5) return [];

  if (phoneToEpics.has(clean)) {
    return phoneToEpics.get(clean) || [];
  }

  const results: string[] = [];
  phoneToEpics.forEach((epics, phone) => {
    if (results.length < 50 && phone.includes(clean)) {
      results.push(...epics);
    }
  });
  return results.slice(0, 50);
}
