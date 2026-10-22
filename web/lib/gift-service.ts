import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';

export interface GiftDistributionRecord {
  id: string;
  epic_number: string;
  elector_name: string;
  relative_name?: string;
  part_number: string;
  serial_number: string;
  district: string;
  taluk: string;
  polling_station_name?: string;
  volunteer_name: string;
  volunteer_phone?: string;
  recipient_mobile?: string;
  booth_part: string;
  delivery_status: 'DELIVERED' | 'REFUSED';
  notes?: string;
  issued_at: string;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const GIFTS_FILE = path.join(DATA_DIR, 'gift_distributions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load all issued gift records (from local file + Supabase if available)
 */
export async function getAllGiftRecords(): Promise<Map<string, GiftDistributionRecord>> {
  ensureDataDir();
  const giftMap = new Map<string, GiftDistributionRecord>();

  // 1. Read from local file
  try {
    if (fs.existsSync(GIFTS_FILE)) {
      const raw = await fs.promises.readFile(GIFTS_FILE, 'utf-8');
      const list: GiftDistributionRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item?.epic_number) {
            giftMap.set(item.epic_number.trim().toUpperCase(), item);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed reading gift_distributions.json:', err);
  }

  // 2. Read from Supabase if table exists
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase.from('gift_distributions').select('*');
      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row?.epic_number) {
            giftMap.set(row.epic_number.trim().toUpperCase(), {
              id: row.id,
              epic_number: row.epic_number,
              elector_name: row.elector_name,
              relative_name: row.relative_name,
              part_number: row.part_number,
              serial_number: row.serial_number,
              district: row.district,
              taluk: row.taluk,
              polling_station_name: row.polling_station_name,
              volunteer_name: row.volunteer_name,
              volunteer_phone: row.volunteer_phone,
              recipient_mobile: row.recipient_mobile,
              booth_part: row.booth_part || row.part_number,
              delivery_status: row.delivery_status || 'DELIVERED',
              notes: row.notes,
              issued_at: row.issued_at || new Date().toISOString(),
              created_at: row.created_at || new Date().toISOString(),
            });
          }
        });
      }
    }
  } catch (e) {
    // Supabase optional
  }

  return giftMap;
}

/**
 * Persist gift distributions to disk
 */
async function saveLocalGifts(giftMap: Map<string, GiftDistributionRecord>) {
  ensureDataDir();
  const list = Array.from(giftMap.values());
  await fs.promises.writeFile(GIFTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

/**
 * Record a gift distribution with strict duplicate prevention
 */
export async function issueGiftDistribution(payload: {
  epic_number: string;
  elector_name: string;
  relative_name?: string;
  part_number: string;
  serial_number: string;
  district: string;
  taluk: string;
  polling_station_name?: string;
  volunteer_name: string;
  volunteer_phone?: string;
  recipient_mobile?: string;
  booth_part?: string;
  notes?: string;
}): Promise<{ success: boolean; record: GiftDistributionRecord; alreadyIssued?: boolean }> {
  const epicClean = payload.epic_number.trim().toUpperCase();
  const giftMap = await getAllGiftRecords();

  // Strict anti-duplicate check
  const existing = giftMap.get(epicClean);
  if (existing) {
    return {
      success: false,
      alreadyIssued: true,
      record: existing,
    };
  }

  const newRecord: GiftDistributionRecord = {
    id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    epic_number: epicClean,
    elector_name: payload.elector_name,
    relative_name: payload.relative_name,
    part_number: payload.part_number,
    serial_number: payload.serial_number,
    district: payload.district,
    taluk: payload.taluk,
    polling_station_name: payload.polling_station_name,
    volunteer_name: payload.volunteer_name || 'Campaign Volunteer',
    volunteer_phone: payload.volunteer_phone,
    recipient_mobile: payload.recipient_mobile,
    booth_part: payload.booth_part || payload.part_number,
    delivery_status: 'DELIVERED',
    notes: payload.notes || 'Handed over personally',
    issued_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // Add to map and save to file
  giftMap.set(epicClean, newRecord);
  await saveLocalGifts(giftMap);

  // Sync with Supabase asynchronously
  try {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from('gift_distributions').insert([
        {
          epic_number: newRecord.epic_number,
          elector_name: newRecord.elector_name,
          relative_name: newRecord.relative_name,
          part_number: newRecord.part_number,
          serial_number: newRecord.serial_number,
          district: newRecord.district,
          taluk: newRecord.taluk,
          polling_station_name: newRecord.polling_station_name,
          volunteer_name: newRecord.volunteer_name,
          volunteer_phone: newRecord.volunteer_phone,
          recipient_mobile: newRecord.recipient_mobile,
          booth_part: newRecord.booth_part,
          delivery_status: newRecord.delivery_status,
          notes: newRecord.notes,
        },
      ]);
    }
  } catch (err) {
    console.warn('Supabase gift insert sync error (local copy preserved):', err);
  }

  return {
    success: true,
    record: newRecord,
  };
}
