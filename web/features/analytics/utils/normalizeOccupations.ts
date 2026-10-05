import { DistributionItem } from '../types';

const OCCUPATION_ALIAS_MAP: Record<string, string> = {
  // Education & Teaching
  teacher: 'Teacher',
  teachars: 'Teacher',
  teachers: 'Teacher',
  teachar: 'Teacher',
  'asst teacher': 'Teacher',
  'govt teacher': 'Teacher',
  'teacher / educator': 'Teacher',
  'teacher / faculty': 'Teacher',
  lecturer: 'Lecturer',
  professor: 'Professor',

  // Self-employed & Business
  'self employee': 'Self Employed',
  'self employed': 'Self Employed',
  'self-employed': 'Self Employed',
  self: 'Self Employed',
  business: 'Business',
  merchant: 'Business',

  // Household
  'house wife': 'Housewife',
  housewife: 'Housewife',
  homemaker: 'Housewife',
  'home maker': 'Housewife',

  // Student
  student: 'Student',

  // Private Sector & Corporate
  'private job': 'Private Employee',
  'private employee': 'Private Employee',
  private: 'Private Employee',
  employee: 'Private Employee',

  // Agriculture
  agriculture: 'Agriculture',
  farmer: 'Agriculture',

  // Professionals
  advocate: 'Advocate',
  lawyer: 'Advocate',
  engineer: 'Engineer',
  'software engineer': 'Engineer',
  doctor: 'Doctor',
  police: 'Police',
  'govt service': 'Government Service',
  'government service': 'Government Service',
};

/**
 * Normalizes raw occupation strings by merging casing variations (e.g. Teacher, TEACHER, Teachars),
 * fixing uncapitalized names (self employee -> Self Employed, House wife -> Housewife),
 * and filtering out non-occupation placeholders like "Not recorded".
 */
export function normalizeOccupations(data?: DistributionItem[]): DistributionItem[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const totalsByCanonical: Record<string, number> = {};
  let validTotal = 0;

  for (const item of data) {
    if (!item) continue;
    const raw = (item.label || '').trim();
    const lower = raw.toLowerCase();

    // Skip unrecorded / non-occupation placeholders and generic Others
    if (
      !raw ||
      lower === 'others' ||
      lower === 'other' ||
      lower === 'not recorded' ||
      lower === 'not specified' ||
      lower === 'unknown' ||
      lower.includes('not record') ||
      lower === 'unspecified'
    ) {
      continue;
    }

    const canonical =
      OCCUPATION_ALIAS_MAP[lower] ||
      raw
        .split(/[\s/]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    totalsByCanonical[canonical] = (totalsByCanonical[canonical] || 0) + (item.count || 0);
    validTotal += item.count || 0;
  }

  return Object.entries(totalsByCanonical)
    .map(([label, count]) => ({
      label,
      count,
      pct: validTotal > 0 ? Number(((count / validTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
