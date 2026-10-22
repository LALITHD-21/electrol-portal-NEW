import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalize an EPIC number input by the user.
 * - Uppercase all letters.
 * - Strip all non-alphanumeric characters (spaces, hyphens, special chars).
 * Safe with null, undefined, or empty values.
 */
export function normalizeEpic(input: string | null | undefined): string {
    if (!input) return '';
    return String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Detect synthetic, placeholder, or dummy EPIC numbers.
 * Examples: P21_0843, P21_SP_00843, P112_SP_01692, P137_0380, NULL, NONE.
 * When a voter has no authentic EPIC number, they should be treated as blank.
 */
export function isSyntheticEpic(epic: string | null | undefined): boolean {
    if (!epic) return true;
    const str = String(epic).trim().toUpperCase();
    if (!str || str === '—' || str === 'NULL' || str === 'NONE' || str === 'NIL' || str === 'NA') return true;
    if (str.includes('_')) return true;
    if (/^P\d{1,4}/.test(str)) return true;
    if (/^NOP\d+/.test(str)) return true;
    if (/^[DE]\d{2}\d{6,8}$/.test(str)) return true;
    return false;
}

/**
 * Validate that an EPIC number matches a valid electoral card format.
 * - Standard EPIC: 2 to 5 letters followed by 4 to 9 digits (e.g. TYA0633792, WWS579886, BRW302298).
 * - OCR / legacy format: 7 to 13 alphanumeric chars containing at least 1 letter and at least 4 digits.
 * - Pure letters (e.g. 'SANTHOSH SN', 'RAMESHKUMAR') or pure numbers ('9876543210', '347') are NEVER valid EPICs.
 * - Synthetic/placeholder IDs (e.g. 'P21_0843', 'P21_SP_00843') are NEVER valid EPICs.
 */
export function isValidEpic(epic: string | null | undefined): boolean {
    if (!epic) return false;
    if (isSyntheticEpic(epic)) return false;
    const str = String(epic).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (str.length < 7 || str.length > 13) return false;

    // Pure letters cannot be an EPIC (it is a person's name, e.g. 'SANTHOSHSN')
    if (/^[A-Z]+$/.test(str)) return false;

    // Pure digits cannot be an EPIC (it is a mobile number or serial number)
    if (/^\d+$/.test(str)) return false;

    // Standard format: 2-5 uppercase letters followed by 4-9 digits (e.g. WWS579886, BRW302298, TYA0633792)
    if (/^[A-Z]{2,5}\d{4,9}$/.test(str)) return true;

    // Variant: digits followed by letters (e.g. 0416396UZD)
    if (/^\d{4,9}[A-Z]{2,5}$/.test(str)) return true;

    // Legacy / OCR scan with at least 1 letter and at least 3 digits
    const letterCount = (str.match(/[A-Z]/g) || []).length;
    const digitCount = (str.match(/\d/g) || []).length;
    if (letterCount >= 1 && digitCount >= 3) {
        return true;
    }

    return false;
}

/**
 * Format an EPIC number for display.
 * Adds a space between letter prefix and number suffix for readability (e.g. 'TYA 0633792', 'WWS 579886').
 * If the voter does not have an authentic EPIC number (missing or synthetic), returns '' (blank).
 */
export function formatEpicForDisplay(epic: string | null | undefined): string {
    if (!epic || isSyntheticEpic(epic)) return '';
    const str = String(epic).trim();
    if (!str) return '';
    const match = str.match(/^([A-Z]{2,4})(\d+)$/);
    if (match) {
        return `${match[1]} ${match[2]}`;
    }
    if (str.length === 10) {
        return `${str.slice(0, 3)} ${str.slice(3)}`;
    }
    return str;
}

/**
 * Get initials from a name for the photo placeholder.
 * Example: 'RAVI KUMAR' -> 'RK'
 * 100% null-safe.
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Safe name normalizer that preserves all first, middle, and last names/initials with proper single spacing.
 * - Prevents accidental concatenation or merging of trailing initials/last names (e.g. "Pooja Raj Bn", "Sanjay N Katwe").
 * - Fixes OCR CamelCase gluing (e.g. "RojaY" -> "Roja Y", "AbhilashYS" -> "Abhilash YS", "AnilKN" -> "Anil KN").
 * - Collapses multiple spaces into a single space.
 * 100% null-safe.
 */
export function formatElectorFullName(name: string | null | undefined): string {
    if (!name) return '—';
    let str = String(name).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'none' || str.toLowerCase() === 'deleted' || str.toLowerCase() === 'dele ted') return '—';

    // Strip leading OCR symbols like "#1398 ", "_— = ", "_-", "=", "#", "§", etc.
    str = str.replace(/^[\s_—\-#=§\*\.\,\:;~`\^]+/, '');
    // Strip trailing OCR symbols like " §", " #", " *", "_-", etc.
    str = str.replace(/[\s_—\-#=§\*\.\,\:;~`\^]+$/, '');
    // Strip embedded serial prefix e.g. "1398 " or "#1398 "
    str = str.replace(/^#?\d{1,5}\s+/, '');
    // Strip OCR bracket tags e.g. "[V", "[1", "]"
    str = str.replace(/\[[A-Za-z0-9]*\]?/g, '');

    if (!str || /^[\s_—\-#=§]+$/.test(str)) return '—';

    // Separate lowercase letters followed directly by uppercase letters (e.g., "RojaY" -> "Roja Y")
    str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Collapse redundant whitespace into exactly one space
    return str.replace(/\s+/g, ' ').trim();
}

export function cleanRelativeName(rel: string | null | undefined): string | null {
    if (!rel) return null;
    let str = String(rel).trim();
    // Strip duplicated or leaked district headers (e.g. "CHITRADURGA CHITRADURGA", "TUMKUR TUMKUR (Dist)")
    str = str.replace(/^(?:CHITRADURGA|TUMKUR|DAVANAGERE|KOLAR|CHIKKABALLAPURA|CHIKKABALLAPUR)\s+(?:CHITRADURGA|TUMKUR|DAVANAGERE|KOLAR|CHIKKABALLAPURA|CHIKKABALLAPUR)(?:\s+(?:Dist|District|\(Dist\)|\(District\)))?\s*/i, '');
    str = str.replace(/^(?:Chitradurga|Tumkur|Davanagere|Kolar|Chikkaballapura)\s*(?:\(Dist\)|\(District\)|Dist|District)?\s*/gi, '').trim();
    str = str.replace(/^[\s_—\-#=§\*\.\,\:;~`\^]+/, '');
    str = str.replace(/[\s_—\-#=§\*\.\,\:;~`\^]+$/, '');
    str = str.replace(/\[[A-Za-z0-9]*\]?/g, '');

    if (!str || /^[\s_—\-#=§]+$/.test(str) || /^(?:CHITRADURGA|TUMKUR|DAVANAGERE|KOLAR|CHIKKABALLAPURA)$/i.test(str)) return null;
    const res = formatElectorFullName(str);
    return res === '—' ? null : res;
}

/**
 * Validate that a phone number is an authentic 10-digit Indian mobile number.
 * - Must have exactly 10 digits (after stripping non-numeric characters).
 * - Must start with 6, 7, 8, or 9.
 * - Rejects dummy repeating numbers (e.g. 9999999999, 8888888888).
 * - Rejects timestamps, booth numbers, and ward numbers (e.g. 17, 19, 20, 4460610000).
 */
export function isValidIndianMobile(phone: string | null | undefined): boolean {
    if (!phone) return false;
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length !== 10) return false;
    if (!/^[6-9]\d{9}$/.test(digits)) return false;
    if (/^(\d)\1{9}$/.test(digits)) return false;
    return true;
}

/**
 * Extract clean 10-digit Indian mobile number or return null.
 */
export function cleanIndianMobile(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (isValidIndianMobile(digits)) {
        return digits;
    }
    return null;
}

/**
 * Sanitize polling station name, address, or location text.
 * Strips out accidental database timestamps (e.g. 2026-08-25T16:11:18.119222+00:00),
 * formula artifacts, and unwanted escape quotes.
 */
export function sanitizeDisplayLocation(text: string | null | undefined): string {
    if (!text) return '';
    let s = String(text).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'none') return '';
    // Strip ISO timestamps
    s = s.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-9.]+(?:\+00:00|Z)?\b/gi, '').trim();
    // Strip excel formula residuals
    if (s.startsWith('IFERROR(') || s.startsWith('=')) return '';
    // Strip leading/trailing bullets, commas, slashes, or dots
    s = s.replace(/^[\s·,;/\\]+|[\s·,;/\\]+$/g, '').trim();
    return s;
}
