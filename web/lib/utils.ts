import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Normalize an EPIC number input by the user.
 * - Uppercase all letters.
 * - Strip all non-alphanumeric characters (spaces, hyphens, special chars).
 *
 * Examples:
 *   'tya0633792'     -> 'TYA0633792'
 *   'TYA 063 3792'   -> 'TYA0633792'
 *   'tya-0633792'    -> 'TYA0633792'
 *   ' tya0633792 '   -> 'TYA0633792'
 */
export function normalizeEpic(input: string): string {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validate that a normalized EPIC number matches the expected format:
 * exactly 3 uppercase letters followed by 7 digits (10 chars total).
 *
 * Examples:
 *   'TYA0633792'  -> true
 *   'TYA063379'   -> false (only 6 digits)
 *   'TYA06337922' -> false (7 digits, too long)
 *   '1234567890'  -> false (no letter prefix)
 *   ''            -> false
 */
export function isValidEpic(epic: string): boolean {
    return /^[A-Z0-9]{10}$/.test(epic);
}

/**
 * Format an EPIC number for display (add a space after the 3-letter prefix
 * for readability in the UI — e.g., 'TYA 0633792').
 * The stored value in the database is always the unformatted version.
 */
export function formatEpicForDisplay(epic: string): string {
    if (epic.length === 10) {
        return `${epic.slice(0, 3)} ${epic.slice(3)}`;
    }
    return epic;
}

/**
 * Get initials from a name for the photo placeholder.
 * Example: 'RAVI KUMAR' -> 'RK'
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
