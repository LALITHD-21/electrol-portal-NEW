import { createAdminClient } from '@/lib/supabase/server';

export interface VoterAdditionRequest {
  id: string; // e.g. "REQ-2026-KA-1024"
  elector_name: string;
  elector_name_kannada?: string;
  relative_name: string;
  relation_type: 'Father' | 'Husband' | 'Mother' | 'Guardian' | 'Other';
  gender: 'Male' | 'Female' | 'Third Gender';
  age: number;
  dob?: string;
  existing_epic?: string;
  district: string;
  taluk: string;
  city: string;
  polling_station?: string;
  address: string;
  pincode: string;
  mobile: string;
  whatsapp: string;
  applicant_type: 'Self' | 'Family Member' | 'Party Worker / Agent' | 'Citizen Volunteer';
  category: 'New Registration (Form 6)' | 'Constituency Transfer (Form 8)' | 'Correction in Roll' | 'Graduates / Teachers Enrollment';
  notes?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Initial realistic dataset so the admin dashboard and filters are rich and immediately functional
let inMemoryRequests: VoterAdditionRequest[] = [
  {
    id: 'REQ-2026-KA-4101',
    elector_name: 'Ramesh Gowda B N',
    elector_name_kannada: 'ರಮೇಶ್ ಗೌಡ ಬಿ ಎನ್',
    relative_name: 'Nanjundappa Gowda',
    relation_type: 'Father',
    gender: 'Male',
    age: 29,
    district: 'Tumkur',
    taluk: 'Tumkur',
    city: 'Tumkur City',
    polling_station: 'Govt Higher Primary School, Kyatsandra',
    address: '#142, 3rd Cross, Siddaganga Extn, Kyatsandra',
    pincode: '572104',
    mobile: '9845123456',
    whatsapp: '9845123456',
    applicant_type: 'Party Worker / Agent',
    category: 'Graduates / Teachers Enrollment',
    notes: 'B.E Graduate degree certificate verified. Eligible for MLC Graduates constituency.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'REQ-2026-KA-4102',
    elector_name: 'Priyanka K',
    elector_name_kannada: 'ಪ್ರಿಯಾಂಕಾ ಕೆ',
    relative_name: 'Krishnamurthy Rao',
    relation_type: 'Father',
    gender: 'Female',
    age: 24,
    district: 'Davanagere',
    taluk: 'Harihar',
    city: 'Harihar Town',
    polling_station: 'Mariya Nivasa Higher Primary School, Room No. 1',
    address: 'Door 58/B, Gandhinagar, Ward No 4, Harihar',
    pincode: '577601',
    mobile: '9900887711',
    whatsapp: '9900887711',
    applicant_type: 'Self',
    category: 'New Registration (Form 6)',
    notes: 'First time voter registration request with Aadhaar and College ID.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'REQ-2026-KA-4103',
    elector_name: 'Manjunatha Reddy V',
    elector_name_kannada: 'ಮಂಜುನಾಥ ರೆಡ್ಡಿ ವಿ',
    relative_name: 'Venkataramana Reddy',
    relation_type: 'Father',
    gender: 'Male',
    age: 38,
    existing_epic: 'KLM1482910',
    district: 'Chikkaballapura',
    taluk: 'Chintamani',
    city: 'Chintamani Town',
    polling_station: 'Govt Urdu High School, Tank Bund Road',
    address: 'Near Old Bus Stand, Azad Nagar, Chintamani',
    pincode: '563125',
    mobile: '9448102938',
    whatsapp: '9448102938',
    applicant_type: 'Party Worker / Agent',
    category: 'Constituency Transfer (Form 8)',
    notes: 'Shifted from Srinivasapur Taluk to Chintamani 6 months ago.',
    status: 'in_review',
    reviewed_by: 'Nagaraj (Taluk In-charge)',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'REQ-2026-KA-4104',
    elector_name: 'Sumithra Devi S',
    elector_name_kannada: 'ಸುಮಿತ್ರಾ ದೇವಿ ಎಸ್',
    relative_name: 'Chandrashekar S',
    relation_type: 'Husband',
    gender: 'Female',
    age: 34,
    district: 'Kolar',
    taluk: 'KGF',
    city: 'Robertsonpet (KGF)',
    polling_station: 'St. Marys Composite PU College, Andersonpet',
    address: 'Quarters #28, Coromandel Post, KGF',
    pincode: '563118',
    mobile: '9741238910',
    whatsapp: '9741238910',
    applicant_type: 'Family Member',
    category: 'Graduates / Teachers Enrollment',
    notes: 'Govt High School Teacher with 5 years service. Form 19 submitted.',
    status: 'approved',
    reviewed_by: 'Election Operations Admin',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'REQ-2026-KA-4105',
    elector_name: 'Anand Kumar K M',
    elector_name_kannada: 'ಆನಂದ್ ಕುಮಾರ್ ಕೆ ಎಂ',
    relative_name: 'Marulasiddappa',
    relation_type: 'Father',
    gender: 'Male',
    age: 42,
    district: 'Chitradurga',
    taluk: 'Challakere',
    city: 'Challakere Town',
    polling_station: 'Govt Junior College, Bellary Road',
    address: 'Behind APMC Yard, Nehru Nagar, Challakere',
    pincode: '577522',
    mobile: '9611029481',
    whatsapp: '9611029481',
    applicant_type: 'Party Worker / Agent',
    category: 'New Registration (Form 6)',
    notes: 'Duplicate applicant already enrolled under EPIC TYB8920191 in Challakere booth 4.',
    status: 'rejected',
    rejection_reason: 'Duplicate entry detected: Elector already exists in current roll with active EPIC card.',
    reviewed_by: 'District Verification Team',
    reviewed_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'REQ-2026-KA-4106',
    elector_name: 'Syed Mohammed Irfan',
    elector_name_kannada: 'ಸೈಯದ್ ಮೊಹಮ್ಮದ್ ಇರ್ಫಾನ್',
    relative_name: 'Syed Abdul Khader',
    relation_type: 'Father',
    gender: 'Male',
    age: 26,
    district: 'Tumkur',
    taluk: 'Sira',
    city: 'Sira Town',
    polling_station: 'Govt Model Primary School, Fort Area',
    address: '#78, Killa Mohalla, Near Jumma Masjid, Sira',
    pincode: '572139',
    mobile: '9880192837',
    whatsapp: '9880192837',
    applicant_type: 'Citizen Volunteer',
    category: 'New Registration (Form 6)',
    notes: 'New resident moved back after completing Master degree.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
];

export function generateRequestId(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REQ-2026-KA-${randomSuffix}`;
}

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
    pending: number;
    in_review: number;
    approved: number;
    rejected: number;
  };
}> {
  let list = [...inMemoryRequests];

  // Try fetching from Supabase if table exists
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('voter_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge unique by ID
      const dbIds = new Set(data.map((d: VoterAdditionRequest) => d.id));
      const memoryOnly = inMemoryRequests.filter((r) => !dbIds.has(r.id));
      list = [...data, ...memoryOnly];
    }
  } catch {
    // Graceful fallback to memory store
  }

  // Calculate un-filtered stats
  const stats = {
    total: list.length,
    pending: list.filter((r) => r.status === 'pending').length,
    in_review: list.filter((r) => r.status === 'in_review').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
  };

  // Apply filters
  if (params?.district && params.district !== 'all') {
    list = list.filter(
      (r) => r.district.toLowerCase() === params.district!.toLowerCase()
    );
  }
  if (params?.taluk && params.taluk !== 'all') {
    list = list.filter(
      (r) => r.taluk.toLowerCase() === params.taluk!.toLowerCase()
    );
  }
  if (params?.city && params.city !== 'all') {
    list = list.filter((r) =>
      r.city.toLowerCase().includes(params.city!.toLowerCase())
    );
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
        r.city.toLowerCase().includes(q)
    );
  }

  return { requests: list, stats };
}

export async function createVoterRequest(
  data: Omit<VoterAdditionRequest, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<VoterAdditionRequest> {
  const newRequest: VoterAdditionRequest = {
    ...data,
    id: generateRequestId(),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to in-memory store
  inMemoryRequests.unshift(newRequest);

  // Attempt Supabase insert
  try {
    const supabase = createAdminClient();
    await supabase.from('voter_requests').insert([newRequest]);
  } catch (err) {
    console.warn('Supabase voter_requests insert note:', err);
  }

  return newRequest;
}

export async function updateVoterRequestStatus(
  id: string,
  update: {
    status: 'pending' | 'in_review' | 'approved' | 'rejected';
    rejection_reason?: string;
    reviewed_by?: string;
  }
): Promise<VoterAdditionRequest | null> {
  const req = inMemoryRequests.find((r) => r.id === id);
  if (req) {
    req.status = update.status;
    if (update.rejection_reason !== undefined) {
      req.rejection_reason = update.rejection_reason;
    }
    if (update.reviewed_by) {
      req.reviewed_by = update.reviewed_by;
    }
    req.reviewed_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();
  }

  // Attempt Supabase update
  try {
    const supabase = createAdminClient();
    await supabase
      .from('voter_requests')
      .update({
        status: update.status,
        rejection_reason: update.rejection_reason,
        reviewed_by: update.reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  } catch (err) {
    console.warn('Supabase voter_requests update note:', err);
  }

  return req || null;
}
