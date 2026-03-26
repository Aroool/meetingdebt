import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { supabase } from '../supabase';
import { getStatusKey } from '../utils';

const STATUSES = [
    { key: 'pending', label: 'Pending', color: '#f59e0b', bg: 'var(--amber-light)' },
    { key: 'completed', label: 'Done', color: '#16a34a', bg: 'var(--accent-light)' },
    { key: 'blocked', label: 'Blocked', color: '#3b82f6', bg: 'var(--blue-light)' },
    { key: 'overdue', label: 'Overdue', color: '#ef4444', bg: 'var(--red-light)' },
];

const avColors = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#ede9fe', color: '#7c3aed' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ffe4e6', color: '#be123c' },
    { bg: '#ccfbf1', color: '#0f766e' },
];

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getPill(status) {
    return STATUSES.find(s => s.key === status) || STATUSES[0];
}

export default function CommitmentRow({ commitment, index, onUpdate, members = [] }) {
    const [localStatus, setLocalStatus] = useState(getStatusKey(commitment));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [reassignOpen, setReassignOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const dropdownRef = useRef(null);
    const reassignRef = useRef(null);
    const isManager = localStorage.getItem('userRole') === 'manager';

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return;
            setCurrentUserId(session.user.id);
            const meta = session.user.user_metadata;
            const name = meta?.full_name || meta?.first_name || session.user.email?.split('@')[0] || '';
            setCurrentUserName(name.toLowerCase());
        });
    }, []);

    // "You" if the name matches current user's name
    function displayName(name) {
        if (!name) return '';
        if (currentUserName && name.toLowerCase().includes(currentUserName)) return 'You';
        return name;
    }

    // "You" if the UUID matches current user
    function displayAssignedName(userId, fallbackName) {
        if (!userId && !fallbackName) return null;
        if (userId && currentUserId && userId === currentUserId) return 'You';
        if (fallbackName) return displayName(fallbackName);
        return null;
    }

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (reassignRef.current && !reassignRef.current.contains(e.target)) setReassignOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function changeStatus(newStatus) {
        setDropdownOpen(false);
        setSaving(true);
        setLocalStatus(newStatus);
        try {
            await api.patch(`/commitments/${commitment.id}`, { status: newStatus });
            onUpdate?.();
        } catch {
            setLocalStatus(getStatusKey(commitment));
        } finally {
            setSaving(false);
        }
    }

    async function reassignTo(userId) {
        setReassignOpen(false);
        setReassigning(true);
        try {
            await api.patch(`/commitments/${commitment.id}`, { assigned_to: userId || null });
            onUpdate?.();
        } catch (err) {
            console.error(err);
        } finally {
            setReassigning(false);
        }
    }

    const pill = getPill(localStatus);
    const ownerDisplay = displayName(commitment.owner);

    // Find assigned member correctly by UUID
    const assignedMember = members.find(m => m.user_id === commitment.assigned_to);
    const assignedDisplay = displayAssignedName(
        commitment.assigned_to,
        assignedMember?.name || assignedMember?.email?.split('@')[0]
    );

    // Avatar based on owner name
    const avIdx = (commitment.owner?.charCodeAt(0) || 0) % avColors.length;
    const av = avColors[avIdx];

    const isCompleted = localStatus === 'completed';

    return (
        <motion.div
            className="commitment-row"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            style={{ opacity: isCompleted ? 0.6 : 1 }}
        >
            {/* Avatar */}
            <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: av.bg, color: av.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800,
            }}>
                {getInitials(commitment.owner)}
            </div>

            {/* Info */}
            <div className="commit-info" style={{ flex: 1, minWidth: 0 }}>
                <div className="commit-task" style={{
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                }}>
                    {commitment.task}
                </div>
                <div className="commit-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>

                    {/* Owner — "You" if it's current user */}
                    <span style={{
                        fontWeight: ownerDisplay === 'You' ? 700 : 400,
                        color: ownerDisplay === 'You' ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}>
                        {ownerDisplay}
                    </span>

                    {/* Assigned to — show arrow only if different from owner */}
                    {assignedDisplay && assignedDisplay !== ownerDisplay && (
                        <>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                padding: '1px 7px', borderRadius: 20,
                                background: assignedDisplay === 'You' ? 'var(--accent-light)' : 'var(--blue-light)',
                                color: assignedDisplay === 'You' ? 'var(--accent-text)' : 'var(--blue)',
                            }}>
                                {assignedDisplay}
                            </span>
                        </>
                    )}

                    {commitment.meeting_title && (
                        <span style={{ color: 'var(--text-muted)' }}>· {commitment.meeting_title}</span>
                    )}

                    {commitment.deadline && (
                        <span style={{ color: 'var(--text-muted)' }}>
                            · {commitment.deadline}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

                {/* Reassign — manager only */}
                {isManager && (
                    <div ref={reassignRef} style={{ position: 'relative' }}>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setReassignOpen(!reassignOpen)}
                            style={{
                                fontSize: 11, fontWeight: 600,
                                padding: '3px 10px', borderRadius: 20,
                                border: '1px solid var(--border)',
                                background: 'transparent', color: 'var(--text-muted)',
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            {reassigning ? '...' : '↻ Reassign'}
                        </motion.button>

                        <AnimatePresence>
                            {reassignOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'fixed',
                                        top: reassignRef.current?.getBoundingClientRect().bottom + 6,
                                        right: window.innerWidth - (reassignRef.current?.getBoundingClientRect().right || 0),
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: 10, padding: 4, zIndex: 9999,
                                        minWidth: 190, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Reassign to
                                    </div>

                                    {/* Unassign option */}
                                    <div
                                        onClick={() => reassignTo(null)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                            fontSize: 12, color: 'var(--text-muted)', transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                                        }}>—</div>
                                        Unassigned
                                    </div>

                                    {members.map((m, i) => {
                                        const isAssigned = m.user_id === commitment.assigned_to;
                                        const isCurrentUser = m.user_id === currentUserId;
                                        const memberName = isCurrentUser ? 'You' : (m.name || m.email?.split('@')[0]);
                                        const mav = avColors[i % avColors.length];
                                        return (
                                            <div
                                                key={m.user_id}
                                                onClick={() => reassignTo(m.user_id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                                    fontSize: 12, color: 'var(--text-primary)',
                                                    background: isAssigned ? 'var(--accent-light)' : 'transparent',
                                                    transition: 'background 0.1s',
                                                }}
                                                onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = 'var(--bg)'; }}
                                                onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: mav.bg, color: mav.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 9, fontWeight: 800, flexShrink: 0,
                                                }}>
                                                    {(m.name || m.email)?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: isAssigned ? 700 : 400 }}>{memberName}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role}</div>
                                                </div>
                                                {isAssigned && <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Status pill */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{
                            fontSize: 11, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: pill.bg, color: pill.color,
                        }}
                    >
                        {saving ? '...' : pill.label}
                        <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
                    </motion.button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'fixed',
                                    top: dropdownRef.current?.getBoundingClientRect().bottom + 6,
                                    right: window.innerWidth - (dropdownRef.current?.getBoundingClientRect().right || 0),
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: 4, zIndex: 9999,
                                    minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                }}
                            >
                                <div style={{ padding: '4px 10px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Update status
                                </div>
                                {STATUSES.map(s => (
                                    <div
                                        key={s.key}
                                        onClick={() => changeStatus(s.key)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                            fontSize: 12, color: 'var(--text-primary)',
                                            background: localStatus === s.key ? s.bg : 'transparent',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => { if (localStatus !== s.key) e.currentTarget.style.background = 'var(--bg)'; }}
                                        onMouseLeave={e => { if (localStatus !== s.key) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                            {s.label}
                                        </div>
                                        {localStatus === s.key && <span style={{ color: s.color, fontSize: 12 }}>✓</span>}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}