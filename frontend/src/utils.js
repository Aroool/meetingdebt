/**
 * Derive the display status of a commitment.
 * Single source of truth used across Dashboard, Commitments, CommitmentRow, etc.
 */
export function getStatus(commitment) {
    if (commitment.status === 'completed') return 'done';
    if (commitment.status === 'blocked') return 'blocked';
    if (commitment.status === 'overdue') return 'overdue';
    if (commitment.deadline) {
        const due = new Date(commitment.deadline);
        if (!isNaN(due) && due < new Date()) return 'overdue';
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
        const due = new Date(commitment.deadline);
        if (!isNaN(due) && due < new Date()) return 'overdue';
    }
    return 'pending';
}
