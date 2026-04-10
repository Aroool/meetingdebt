/**
 * Parse a YYYY-MM-DD deadline string as LOCAL midnight, not UTC midnight.
 *
 * Why this matters:
 *   new Date('2026-04-10')          → UTC midnight → Apr 9 at 8 PM in EST (UTC-4)
 *   parseDate('2026-04-10')         → local midnight → Apr 10 at 12:00 AM in EST  ✓
 *
 * All deadline comparisons and display formatting in the app must go through
 * this function so dates always match what was entered by the user.
 */
export function parseDate(str) {
    if (!str) return null;
    const [year, month, day] = str.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day); // month is 0-indexed; no UTC conversion
}

/**
 * Derive the display status of a commitment.
 * Single source of truth used across Dashboard, Commitments, CommitmentRow, etc.
 */
export function getStatus(commitment) {
    if (commitment.status === 'completed') return 'done';
    if (commitment.status === 'blocked') return 'blocked';
    if (commitment.status === 'overdue') return 'overdue';
    if (commitment.deadline) {
        const due = parseDate(commitment.deadline);
        if (due && due < new Date()) return 'overdue';
    }
    return 'pending';
}

/**
 * Get the raw status key (for CommitmentRow which uses 'completed' not 'done').
 */
export function getStatusKey(commitment) {
    if (commitment.status === 'completed') return 'completed';
    if (commitment.status === 'blocked') return 'blocked';
    if (commitment.status === 'overdue') return 'overdue';
    if (commitment.deadline) {
        const due = parseDate(commitment.deadline);
        if (due && due < new Date()) return 'overdue';
    }
    return 'pending';
}
