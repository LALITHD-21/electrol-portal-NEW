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
