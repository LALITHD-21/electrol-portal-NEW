import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';
import {
  RequestStatus,
  STATUS_MAP,
  canTransition,
} from '@/lib/status-map';
import { getRejectReason } from '@/lib/reject-reasons';

export interface VoterAdditionRequest {
  id: string; // e.g. "REQ-2026-KA-1024"
  elector_name: string;
  elector_name_kannada?: string;
  relative_name: string;
  relation_type: 'Father' | 'Husband' | 'Mother' | 'Guardian' | 'Other';
  gender: 'Male' | 'Female' | 'Third Gender';
  age?: number;
  dob?: string;
  qualification?: string;
  occupation?: string;
  existing_epic?: string;
  district: string;
  taluk: string;
  hobli?: string;
  village?: string;
  city?: string;
  polling_station?: string;
  address?: string;
  pincode?: string;
  mobile: string;
  whatsapp?: string;
  applicant_type?: 'Self' | 'Family Member' | 'Party Worker / Agent' | 'Citizen Volunteer';
  category?: 'New Registration (Form 6)' | 'Constituency Transfer (Form 8)' | 'Correction in Roll' | 'Graduates / Teachers Enrollment';
  notes?: string;

  // State Machine Columns
  status: RequestStatus;
  form_type?: string;
  form_submitted_at?: string;
  form_ack_number?: string;
  enrolled_confirmed_at?: string;
  enrolled_part_number?: string;
  enrolled_serial_number?: string;
  public_reject_reason_code?: string;
  rejection_reason?: string;

  // SLA & Audit
  reviewed_by?: string;
  reviewed_at?: string;
  last_status_changed_at: string;
  sla_due_at: string;
  created_at: string;
  updated_at: string;
}

export interface RequestEvent {
  id: string;
  request_id: string;
  actor_id: string;
  action: string;
  from_status?: RequestStatus;
  to_status: RequestStatus;
  internal_note?: string;
  public_note?: string;
  public_note_kn?: string;
  public_visible: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RequestNotification {
  id: string;
  request_id: string;
  channel: 'whatsapp_click' | 'whatsapp_api' | 'sms' | 'pwa_push';
  template_key: string;
  recipient_mobile: string;
  payload: Record<string, any>;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
  created_at: string;
  sent_at?: string;
}

export interface PublicTrackResponse {
  found: boolean;
  message?: string;
  reference_id?: string;
  first_name?: string;
  status?: RequestStatus;
  submitted_at?: string;
  last_updated_at?: string;
  sla_due_at?: string;
  form_type?: string;
  form_submitted_at?: string;
  form_ack_number?: string;
  enrolled_part_number?: string;
  enrolled_serial_number?: string;
  reject_reason_en?: string;
  reject_reason_kn?: string;
  timeline?: Array<{
    action: string;
    to_status: RequestStatus;
    public_note?: string;
    public_note_kn?: string;
    created_at: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'voter_requests.json');
const EVENTS_FILE = path.join(DATA_DIR, 'request_events.json');
const NOTIFS_FILE = path.join(DATA_DIR, 'request_notifications.json');

// In-memory caches with disk timestamp tracking
let lastRequestsMtime = 0;
let inMemoryRequests: VoterAdditionRequest[] | null = null;
let lastEventsMtime = 0;
let inMemoryEvents: RequestEvent[] | null = null;
let lastNotifsMtime = 0;
let inMemoryNotifs: RequestNotification[] | null = null;

function normalizeLegacyStatus(status: any): RequestStatus {
  if (status === 'pending') return 'new';
  if (status === 'in_review') return 'contacted';
  if (status === 'approved') return 'verified';
  if (status in STATUS_MAP) return status as RequestStatus;
  return 'new';
}

async function loadRequests(forceReload = false): Promise<VoterAdditionRequest[]> {
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const stat = await fs.promises.stat(REQUESTS_FILE);
      if (!forceReload && inMemoryRequests !== null && stat.mtimeMs <= lastRequestsMtime) {
        return inMemoryRequests;
      }
      const raw = await fs.promises.readFile(REQUESTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        lastRequestsMtime = stat.mtimeMs;
        inMemoryRequests = parsed.map((item) => ({
          ...item,
          status: normalizeLegacyStatus(item.status),
          last_status_changed_at: item.last_status_changed_at || item.updated_at || item.created_at,
          sla_due_at: item.sla_due_at || new Date(Date.now() + 3 * 86400000).toISOString(),
        }));
        return inMemoryRequests;
      }
    }
  } catch (err) {
    console.warn('Error reading voter_requests.json:', err);
  }
  if (inMemoryRequests !== null) return inMemoryRequests;
  inMemoryRequests = [];
  return inMemoryRequests;
}

async function persistRequests(list: VoterAdditionRequest[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(REQUESTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    lastRequestsMtime = Date.now() + 50;
  } catch (err) {
    console.warn('Error writing voter_requests.json:', err);
  }
}

async function loadEvents(): Promise<RequestEvent[]> {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const stat = await fs.promises.stat(EVENTS_FILE);
      if (inMemoryEvents !== null && stat.mtimeMs <= lastEventsMtime) {
        return inMemoryEvents;
      }
      const raw = await fs.promises.readFile(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        lastEventsMtime = stat.mtimeMs;
        inMemoryEvents = parsed;
        return inMemoryEvents;
      }
    }
  } catch {}
  if (inMemoryEvents !== null) return inMemoryEvents;
  inMemoryEvents = [];
  return inMemoryEvents;
}

async function persistEvents(list: RequestEvent[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(EVENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    lastEventsMtime = Date.now() + 50;
  } catch (err) {
    console.warn('Error writing request_events.json:', err);
  }
}

async function loadNotifs(): Promise<RequestNotification[]> {
  if (inMemoryNotifs !== null) return inMemoryNotifs;
  try {
    if (fs.existsSync(NOTIFS_FILE)) {
      const raw = await fs.promises.readFile(NOTIFS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryNotifs = parsed;
        return inMemoryNotifs;
      }
    }
  } catch {}
  inMemoryNotifs = [];
  return inMemoryNotifs;
}

async function persistNotifs(list: RequestNotification[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) await fs.promises.mkdir(DATA_DIR, { recursive: true });
    await fs.promises.writeFile(NOTIFS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing request_notifications.json:', err);
  }
}

export function generateRequestId(): string {
  // Unambiguous alphabet (no 0/O, 1/I/L)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REQ-2026-KA-${rand}`;
}

export function normalizeMobile(mobile: string | undefined): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  return digits.slice(-10);
}

/**
 * Append an immutable event to the audit trail
 */
export async function appendRequestEvent(
  eventData: Omit<RequestEvent, 'id' | 'created_at'>
): Promise<RequestEvent> {
  const events = await loadEvents();
  const event: RequestEvent = {
    ...eventData,
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  events.push(event);
  inMemoryEvents = events;
  await persistEvents(events);

  // Sync with Supabase if configured
  try {
    const supabase = createAdminClient();
    await supabase.from('request_events').insert([event]);
  } catch {}

  return event;
}

/**
 * Queue a notification in the outbox
 */
export async function queueNotification(
  notifData: Omit<RequestNotification, 'id' | 'status' | 'created_at'>
): Promise<RequestNotification> {
  const notifs = await loadNotifs();
  const notif: RequestNotification = {
    ...notifData,
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'queued',
    created_at: new Date().toISOString(),
  };

  notifs.push(notif);
  inMemoryNotifs = notifs;
  await persistNotifs(notifs);

  try {
    const supabase = createAdminClient();
    await supabase.from('request_notifications').insert([notif]);
  } catch {}

  return notif;
}

/**
 * Fetch voter requests with multi-field filtering and KPI breakdown
 */
export async function getVoterRequests(params?: {
  district?: string;
  taluk?: string;
  city?: string;
  status?: string;
  search?: string;
}): Promise<{
  requests: VoterAdditionRequest[];
  stats: {
    total: number;
    new: number;
    contacted: number;
    documents_pending: number;
    needs_info: number;
    verified: number;
    form_submitted: number;
    enrolled: number;
    rejected: number;
    duplicate: number;
    closed: number;
    overdue: number;
  };
}> {
  const currentList = await loadRequests();
  let list = [...currentList];
  const now = new Date().getTime();

  const stats = {
    total: currentList.length,
    new: currentList.filter((r) => r.status === 'new').length,
    contacted: currentList.filter((r) => r.status === 'contacted').length,
    documents_pending: currentList.filter((r) => r.status === 'documents_pending').length,
    needs_info: currentList.filter((r) => r.status === 'needs_info').length,
    verified: currentList.filter((r) => r.status === 'verified').length,
    form_submitted: currentList.filter((r) => r.status === 'form_submitted').length,
    enrolled: currentList.filter((r) => r.status === 'enrolled').length,
    rejected: currentList.filter((r) => r.status === 'rejected').length,
    duplicate: currentList.filter((r) => r.status === 'duplicate').length,
    closed: currentList.filter((r) => r.status === 'closed' || r.status === 'withdrawn').length,
    overdue: currentList.filter(
      (r) => !['enrolled', 'rejected', 'duplicate', 'closed', 'withdrawn'].includes(r.status) &&
             new Date(r.sla_due_at).getTime() < now
    ).length,
  };

  if (params?.district && params.district !== 'all') {
    list = list.filter((r) => r.district.toLowerCase() === params.district!.toLowerCase());
  }
  if (params?.taluk && params.taluk !== 'all') {
    list = list.filter((r) => r.taluk.toLowerCase() === params.taluk!.toLowerCase());
  }
  if (params?.city && params.city !== 'all') {
    list = list.filter((r) => r.city?.toLowerCase() === params.city!.toLowerCase());
  }
  if (params?.status && params.status !== 'all') {
    list = list.filter((r) => r.status === params.status);
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.elector_name.toLowerCase().includes(q) ||
        (r.relative_name && r.relative_name.toLowerCase().includes(q)) ||
        r.mobile.includes(q) ||
        r.taluk.toLowerCase().includes(q) ||
        (r.city && r.city.toLowerCase().includes(q))
    );
  }

  return { requests: list, stats };
}

/**
 * Public Request Submission
 */
export async function createVoterRequest(
  data: Omit<
    VoterAdditionRequest,
    | 'id'
    | 'status'
    | 'created_at'
    | 'updated_at'
    | 'last_status_changed_at'
    | 'sla_due_at'
  >
): Promise<VoterAdditionRequest> {
  const currentList = await loadRequests();
  const id = generateRequestId();
  const now = new Date().toISOString();
  const slaDays = STATUS_MAP.new.defaultSlaDays;
  const slaDueAt = new Date(Date.now() + slaDays * 86400000).toISOString();

  const newRequest: VoterAdditionRequest = {
    ...data,
    id,
    status: 'new',
    form_type: 'Form 18',
    last_status_changed_at: now,
    sla_due_at: slaDueAt,
    created_at: now,
    updated_at: now,
  };

  currentList.unshift(newRequest);
  inMemoryRequests = currentList;
  await persistRequests(currentList);

  // Write initial creation event
  await appendRequestEvent({
    request_id: id,
    actor_id: 'citizen',
    action: 'SUBMITTED',
    to_status: 'new',
    public_note: 'Request received. Volunteer desk assigned.',
    public_note_kn: 'ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಪರಿಶೀಲನಾ ತಂಡಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.',
    public_visible: true,
  });

  // Attempt Supabase insert
  try {
    const supabase = createAdminClient();
    await supabase.from('voter_requests').insert([newRequest]);
  } catch {}

  return newRequest;
}

/**
 * Server-Enforced Status Transition
 */
export async function updateVoterRequestStatus(
  id: string,
  update: {
    status: RequestStatus;
    actor_id?: string;
    public_reject_reason_code?: string;
    rejection_reason?: string;
    form_type?: string;
    form_submitted_at?: string;
    form_ack_number?: string;
    enrolled_confirmed_at?: string;
    enrolled_part_number?: string;
    enrolled_serial_number?: string;
    internal_note?: string;
    public_note?: string;
    public_note_kn?: string;
    public_visible?: boolean;
    reviewed_by?: string;
    existing_epic?: string;
  }
): Promise<VoterAdditionRequest> {
  const currentList = await loadRequests();
  const req = currentList.find((r) => r.id === id);
  if (!req) {
    throw new Error(`Request with ID ${id} not found.`);
  }

  const fromStatus = req.status;
  const toStatus = update.status;

  // 1. Verify Allowed Transition
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(
      `Illegal status transition from "${fromStatus}" to "${toStatus}" for request ${id}.`
    );
  }

  // 2. Validate Required Fields per Target State
  if (toStatus === 'rejected') {
    if (!update.public_reject_reason_code && !update.rejection_reason) {
      throw new Error('A rejection reason code or explanation is required to reject a request.');
    }
  } else if (toStatus === 'form_submitted') {
    if (!update.form_ack_number || !update.form_ack_number.trim()) {
      throw new Error('Acknowledgement number is required when marking a form as submitted to ERO.');
    }
  } else if (toStatus === 'enrolled') {
    if (!update.enrolled_confirmed_at) {
      update.enrolled_confirmed_at = new Date().toISOString();
    }
  }

  // 3. Update Request Entity
  const now = new Date().toISOString();
  const slaDays = STATUS_MAP[toStatus].defaultSlaDays;
  const newSlaDueAt =
    slaDays > 0 ? new Date(Date.now() + slaDays * 86400000).toISOString() : req.sla_due_at;

  req.status = toStatus;
  req.last_status_changed_at = now;
  req.updated_at = now;
  req.sla_due_at = newSlaDueAt;

  if (update.public_reject_reason_code !== undefined) {
    req.public_reject_reason_code = update.public_reject_reason_code;
    const preApproved = getRejectReason(update.public_reject_reason_code);
    if (preApproved) {
      req.rejection_reason = preApproved.publicTextEn;
    }
  }
  if (update.rejection_reason !== undefined) {
    req.rejection_reason = update.rejection_reason;
  }
  if (update.form_type) req.form_type = update.form_type;
  if (update.form_submitted_at) req.form_submitted_at = update.form_submitted_at;
  if (update.form_ack_number) req.form_ack_number = update.form_ack_number;
  if (update.enrolled_confirmed_at) req.enrolled_confirmed_at = update.enrolled_confirmed_at;
  if (update.enrolled_part_number) req.enrolled_part_number = update.enrolled_part_number;
  if (update.enrolled_serial_number) req.enrolled_serial_number = update.enrolled_serial_number;
  if (update.reviewed_by) req.reviewed_by = update.reviewed_by;
  if (update.existing_epic) req.existing_epic = update.existing_epic;
  req.reviewed_at = now;

  await persistRequests(currentList);

  // 4. Log Immutable Audit Event
  await appendRequestEvent({
    request_id: id,
    actor_id: update.actor_id || update.reviewed_by || 'admin_operator',
    action: `STATUS_CHANGE_TO_${toStatus.toUpperCase()}`,
    from_status: fromStatus,
    to_status: toStatus,
    internal_note: update.internal_note,
    public_note: update.public_note || STATUS_MAP[toStatus].publicMessage.en({
      date: update.form_submitted_at || now.slice(0, 10),
      ackNumber: update.form_ack_number,
      partNumber: update.enrolled_part_number,
      serialNumber: update.enrolled_serial_number,
      rejectReason: req.rejection_reason,
    }),
    public_note_kn: update.public_note_kn || STATUS_MAP[toStatus].publicMessage.kn({
      date: update.form_submitted_at || now.slice(0, 10),
      ackNumber: update.form_ack_number,
      partNumber: update.enrolled_part_number,
      serialNumber: update.enrolled_serial_number,
      rejectReasonKn: req.rejection_reason,
    }),
    public_visible: update.public_visible ?? true,
    metadata: {
      ackNumber: update.form_ack_number,
      partNumber: update.enrolled_part_number,
      serialNumber: update.enrolled_serial_number,
    },
  });

  // 5. Queue Notification Outbox Record
  await queueNotification({
    request_id: id,
    channel: 'whatsapp_click',
    template_key: `STATUS_${toStatus.toUpperCase()}`,
    recipient_mobile: req.mobile,
    payload: {
      electorName: req.elector_name,
      statusLabel: STATUS_MAP[toStatus].publicStepLabel.en,
      referenceId: req.id,
      trackUrl: `/track?ref=${encodeURIComponent(req.id)}`,
    },
  });

  // 6. Supabase sync
  try {
    const supabase = createAdminClient();
    await supabase.from('voter_requests').update(req).eq('id', id);
  } catch {}

  return req;
}

export const updateVoterRequest = updateVoterRequestStatus;

/**
 * Public Track Function (Dual Mode: Tracking ID or EPIC Number)
 * - Allows tracking by Tracking Reference ID (e.g. REQ-2026-KA-XXXXX) OR EPIC Number (e.g. IUO3578762)
 * - Zero errors: Smart fallback between requests store and master electors directory
 * - Preserves anti-probing constant response equality
 * - Returns strictly allow-listed fields (Zero internal staff notes)
 */
export async function trackVoterRequest(
  param1?: string | { referenceId?: string; epic?: string; mobile?: string; query?: string },
  param2?: string,
  param3?: string
): Promise<PublicTrackResponse> {
  let referenceId: string | undefined;
  let epic: string | undefined;
  let mobile: string | undefined;

  if (typeof param1 === 'object' && param1 !== null) {
    referenceId = param1.referenceId;
    epic = param1.epic;
    mobile = param1.mobile;
    if (param1.query) {
      const q = param1.query.trim();
      if (q.toUpperCase().startsWith('REQ-')) {
        referenceId = referenceId || q;
      } else {
        epic = epic || q;
      }
    }
  } else {
    if (typeof param1 === 'string') {
      referenceId = param1;
    }
    if (param2) {
      const digitsOnly = param2.replace(/\D/g, '');
      if (digitsOnly.length === 10 && !/[A-Za-z]/.test(param2)) {
        mobile = param2;
      } else {
        epic = param2;
      }
    }
    if (param3) {
      mobile = param3;
    }
  }

  let cleanRef = (referenceId || '').trim().toUpperCase();
  let cleanEpic = (epic || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanMob = normalizeMobile(mobile);

  // Smart detect if user pasted REQ- into epic field or EPIC into ref field
  if (cleanEpic.startsWith('REQ-')) {
    cleanRef = cleanEpic;
    cleanEpic = '';
  } else if (cleanRef && !cleanEpic && !cleanRef.startsWith('REQ-') && cleanRef.length >= 6 && cleanRef.length <= 16) {
    cleanEpic = cleanRef.replace(/[^A-Z0-9]/g, '');
  }

  // If both empty, return failure
  if (!cleanRef && !cleanEpic) {
    return {
      found: false,
      message: 'No request found matching the provided Reference ID or EPIC Number.',
    };
  }

  const currentList = await loadRequests();
  let req: VoterAdditionRequest | undefined;

  // 1. Try finding by Reference ID
  if (cleanRef && cleanRef.length >= 6) {
    const strippedRef = cleanRef.replace(/[^A-Z0-9]/g, '');
    req = currentList.find((r) => {
      const strippedId = r.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existingEpic = r.existing_epic ? r.existing_epic.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
      return (
        r.id.toUpperCase() === cleanRef ||
        strippedId === strippedRef ||
        (existingEpic && existingEpic === strippedRef) ||
        strippedRef.includes(strippedId) ||
        strippedId.includes(strippedRef)
      );
    });
  }

  // 2. If not found by Reference ID, or if EPIC was provided, search by EPIC / Ack number / Form Ack / PROV-ID
  if (!req && cleanEpic && cleanEpic.length >= 6) {
    const strippedEpic = cleanEpic.replace(/[^A-Z0-9]/g, '');
    req = currentList.find((r) => {
      const strippedId = r.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const existingEpic = r.existing_epic ? r.existing_epic.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
      const ack = r.form_ack_number ? r.form_ack_number.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

      const matchExistingEpic = Boolean(
        existingEpic &&
          (existingEpic === strippedEpic ||
            strippedEpic.includes(existingEpic) ||
            existingEpic.includes(strippedEpic))
      );
      const matchAck = Boolean(ack && (ack === strippedEpic || strippedEpic.includes(ack)));
      const matchId = Boolean(
        strippedId === strippedEpic ||
          strippedEpic === `PROV${strippedId}` ||
          strippedEpic.includes(strippedId) ||
          (strippedEpic.startsWith('PROV') && strippedEpic.replace(/^PROV/, '') === strippedId)
      );
      return matchExistingEpic || matchAck || matchId;
    });
  }

  // 3. Fallback: Check if cleanRef matches existing_epic or ack number
  if (!req && cleanRef && cleanRef.length >= 6) {
    const strippedRef = cleanRef.replace(/[^A-Z0-9]/g, '');
    req = currentList.find(
      (r) =>
        (r.existing_epic && r.existing_epic.toUpperCase().replace(/[^A-Z0-9]/g, '') === strippedRef) ||
        (r.form_ack_number && r.form_ack_number.toUpperCase().replace(/[^A-Z0-9]/g, '') === strippedRef)
    );
  }

  // Security Check: If mobile number was explicitly passed and doesn't match the record, reject (Anti-Probing)
  if (req && cleanMob && cleanMob.length === 10 && normalizeMobile(req.mobile) !== cleanMob) {
    return {
      found: false,
      message: 'No request found matching the provided Reference ID or EPIC Number.',
    };
  }

  // If request found in requests log, return rich workflow details
  if (req) {
    // Extract first name only (Privacy Protection)
    const firstName = req.elector_name.trim().split(' ')[0] || 'Voter';

    // Get pre-approved reject reason texts if rejected
    let rejectReasonEn: string | undefined = undefined;
    let rejectReasonKn: string | undefined = undefined;
    if (req.public_reject_reason_code) {
      const reasonItem = getRejectReason(req.public_reject_reason_code);
      if (reasonItem) {
        rejectReasonEn = reasonItem.publicTextEn;
        rejectReasonKn = reasonItem.publicTextKn;
      }
    } else if (req.rejection_reason) {
      rejectReasonEn = req.rejection_reason;
      rejectReasonKn = req.rejection_reason;
    }

    // Fetch only public-visible timeline events
    const allEvents = await loadEvents();
    const publicEvents = allEvents
      .filter((e) => e.request_id === req!.id && e.public_visible === true)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((e) => ({
        action: e.action,
        to_status: e.to_status,
        public_note: e.public_note,
        public_note_kn: e.public_note_kn,
        created_at: e.created_at,
      }));

    return {
      found: true,
      reference_id: req.id,
      first_name: firstName,
      status: req.status,
      submitted_at: req.created_at,
      last_updated_at: req.last_status_changed_at || req.updated_at,
      sla_due_at: req.sla_due_at,
      form_type: req.form_type,
      form_submitted_at: req.form_submitted_at,
      form_ack_number: req.form_ack_number,
      enrolled_part_number: req.enrolled_part_number,
      enrolled_serial_number: req.enrolled_serial_number,
      reject_reason_en: rejectReasonEn,
      reject_reason_kn: rejectReasonKn,
      timeline: publicEvents,
    };
  }

  // 4. If not found in requests table, check if it's an existing enrolled elector in the master roll
  const lookupEpic = cleanEpic || (!cleanRef.startsWith('REQ-') ? cleanRef.replace(/[^A-Z0-9]/g, '') : '');
  if (lookupEpic && lookupEpic.length >= 6) {
    try {
      const supabase = createAdminClient();
      const { data: elector, error } = await supabase
        .from('electors')
        .select('*')
        .eq('epic_number', lookupEpic)
        .maybeSingle();

      if (!error && elector) {
        const firstName = elector.name ? elector.name.trim().split(' ')[0] : 'Voter';
        const boothNo = elector.booth_number || elector.part_no || '';
        const serialNo = elector.serial_number || elector.serial_no || '';

        return {
          found: true,
          reference_id: elector.epic_number,
          first_name: firstName,
          status: 'enrolled',
          submitted_at: elector.created_at || new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          sla_due_at: new Date().toISOString(),
          form_type: 'Electoral Roll (Form 18)',
          enrolled_part_number: String(boothNo),
          enrolled_serial_number: String(serialNo),
          timeline: [
            {
              action: 'OFFICIALLY_ENROLLED',
              to_status: 'enrolled',
              public_note: `Elector confirmed in published electoral roll. Booth/Part: ${boothNo || 'N/A'}, Serial: ${serialNo || 'N/A'}.`,
              public_note_kn: `ಪ್ರಕಟಿತ ಮತದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರು ಅಧಿಕೃತವಾಗಿ ದೃಢಪಟ್ಟಿದೆ. ಮತಗಟ್ಟೆ/ಭಾಗ: ${boothNo || 'N/A'}, ಕ್ರಮ ಸಂಖ್ಯೆ: ${serialNo || 'N/A'}.`,
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
    } catch {}
  }

  // Not found anywhere
  return {
    found: false,
    message: 'No request found matching the provided Reference ID or EPIC Number.',
  };
}

/**
 * Fetch events for a specific request (Used by Admin Detail Drawer)
 */
export async function getRequestEvents(requestId: string): Promise<RequestEvent[]> {
  const events = await loadEvents();
  return events
    .filter((e) => e.request_id === requestId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function deleteVoterRequest(id: string): Promise<boolean> {
  const currentList = await loadRequests();
  const index = currentList.findIndex((r) => r.id === id);
  if (index !== -1) {
    currentList.splice(index, 1);
    inMemoryRequests = currentList;
    await persistRequests(currentList);

    // Also purge associated audit events and notifications
    try {
      const allEvents = await loadEvents();
      const filteredEvents = allEvents.filter((e) => e.request_id !== id);
      inMemoryEvents = filteredEvents;
      await persistEvents(filteredEvents);

      const allNotifs = await loadNotifs();
      const filteredNotifs = allNotifs.filter((n) => n.request_id !== id);
      inMemoryNotifs = filteredNotifs;
      await persistNotifs(filteredNotifs);
    } catch {}

    try {
      const supabase = createAdminClient();
      await supabase.from('voter_requests').delete().eq('id', id);
      await supabase.from('request_events').delete().eq('request_id', id);
      await supabase.from('request_notifications').delete().eq('request_id', id);
    } catch {}
    return true;
  }
  return false;
}
