import fs from 'fs';
import path from 'path';

interface PhoneLookup {
  epics: Record<string, string>;
  name_parts: Record<string, string>;
}

let cachedLookup: PhoneLookup | null = null;
let phoneToEpics: Map<string, string[]> | null = null;

function getPhoneLookup(): PhoneLookup {
  if (!cachedLookup) {
    try {
      const jsonPath = path.join(process.cwd(), 'lib/phone_lookup.json');
      if (fs.existsSync(jsonPath)) {
        cachedLookup = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } else {
        cachedLookup = { epics: {}, name_parts: {} };
      }
    } catch (e) {
      console.warn('Failed to load phone_lookup.json:', e);
      cachedLookup = { epics: {}, name_parts: {} };
    }

    // Build reverse phone to epics map
    phoneToEpics = new Map();
    if (cachedLookup?.epics) {
      for (const [epic, phone] of Object.entries(cachedLookup.epics)) {
        const cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone) {
          const list = phoneToEpics.get(cleanPhone);
          if (list) {
            list.push(epic);
          } else {
            phoneToEpics.set(cleanPhone, [epic]);
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
  if (elector.whatsapp_mob) {
    const digits = String(elector.whatsapp_mob).replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
  }

  const lookup = getPhoneLookup();

  if (elector.epic_number) {
    const compactEpic = String(elector.epic_number).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (compactEpic && lookup.epics[compactEpic]) {
      return lookup.epics[compactEpic];
    }
  }

  if (elector.name && elector.part_number !== undefined && elector.part_number !== null) {
    const cleanName = String(elector.name).trim().toUpperCase();
    const cleanPart = String(elector.part_number).trim();
    const key = `${cleanName}:${cleanPart}`;
    if (lookup.name_parts[key]) {
      return lookup.name_parts[key];
    }
  }

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
