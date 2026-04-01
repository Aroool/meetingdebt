import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const coverGradients = [
    'linear-gradient(135deg, #dbeafe, #ede9fe)',
    'linear-gradient(135deg, #ede9fe, #fce7f3)',
    'linear-gradient(135deg, #fef3c7, #ffe4e6)',
    'linear-gradient(135deg, #ccfbf1, #dbeafe)',
    'linear-gradient(135deg, #ffe4e6, #fef3c7)',
];

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getPill(status) {
    return STATUSES.find(s => s.key === status) || STATUSES[0];
}

// ── Member Profile Popup ──
function MemberProfilePopup({ member, commitments, onClose }) {
    const navigate = useNavigate();
    const avIdx = (member.name?.charCodeAt(0) || 0) % avColors.length;
    const av = avColors[avIdx];
    const gradient = coverGradients[avIdx];

    const memberCommitments = commitments.filter(c =>
        c.assigned_to === member.user_id || c.owner?.toLowerCase() === member.name?.toLowerCase()
    );

    const pending = memberCommitments.filter(c => {
        if (c.status === 'completed') return false;
        if (c.status === 'blocked') return false;
        if (c.deadline && new Date(c.deadline) < new Date()) return false;
        return true;
    }).length;

    const overdue = memberCommitments.filter(c => {
        if (c.status === 'completed') return false;
        return c.deadline && new Date(c.deadline) < new Date();
    }).length;

    const done = memberCommitments.filter(c => c.status === 'completed').length;
    const total = memberCommitments.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const displayName = member.name || member.email?.split('@')[0] || 'Unknown';
    const email = member.email || '';

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />

            {/* Popup */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    marginTop: '-200px', marginLeft: '-160px',
                    width: 320, zIndex: 999,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
                    overflow: 'hidden',
                }}
            >
                {/* Cover */}
                <div style={{ height: 80, background: gradient, position: 'relative' }}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.2)', border: 'none',
                            color: '#fff', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >×</button>
                    {/* Avatar */}
                    <div style={{
                        position: 'absolute', bottom: -22, left: 16,
                        width: 52, height: 52, borderRadius: '50%',
                        background: member.avatar_url ? 'transparent' : av.bg,
                        color: av.color,
                        border: '3px solid var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900, overflow: 'hidden',
                    }}>
                        {member.avatar_url
                            ? <img src={member.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : getInitials(displayName)
                        }
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '36px 20px 20px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {displayName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                            background: 'var(--blue-light)', color: 'var(--blue)',
                        }}>
                            {member.role || 'member'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {localStorage.getItem('workspaceName') || 'Demo Team'}
                        </span>
                    </div>

                    {/* Bio */}
                    <div style={{
                        fontSize: 11, color: member.bio ? 'var(--text-secondary)' : 'var(--text-muted)',
                        lineHeight: 1.6, marginBottom: 12, paddingBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        fontStyle: member.bio ? 'normal' : 'italic',
                    }}>
                        {member.bio || 'No bio yet.'}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
                        {[
                            { label: 'Pending', value: pending, color: 'var(--amber)' },
                            { label: 'Overdue', value: overdue, color: 'var(--red)' },
                            { label: 'Done', value: done, color: 'var(--accent-text)' },
                        ].map(s => (
                            <div key={s.label} style={{
                                textAlign: 'center', padding: '7px 4px',
                                borderRadius: 8, background: 'var(--bg)',
                                border: '1px solid var(--border)',
                            }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1, marginBottom: 2 }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
                        {pct}% completion rate · {total} tasks
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {email && (
                            <a href={`mailto:${email}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '9px 12px', borderRadius: 9,
                                    background: 'var(--accent-light)', color: 'var(--accent-text)',
                                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                <span>✉</span>
                                Send email to {displayName.split(' ')[0]}
                            </a>
                        )}
                        <button
                            onClick={() => { navigate('/workspace'); onClose(); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 12px', borderRadius: 9,
                                background: 'var(--bg)', color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'inherit', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <span>↗</span>
                            View full profile
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

export default function CommitmentRow({ commitment, index, onUpdate, members = [], commitments = [] }) {
    const [localStatus, setLocalStatus] = useState(getStatusKey(commitment));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [reassignOpen, setReassignOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
    const [profileMember, setProfileMember] = useState(null);
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

    function displayName(name) {
        if (!name) return '';
        if (currentUserName && name.toLowerCase().includes(currentUserName)) return 'You';
        return name;
    }

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

    function handleAvatarClick() {
        console.log('members:', members);
        console.log('commitment.owner:', commitment.owner);
        console.log('commitment.assigned_to:', commitment.assigned_to);

        const member = members.find(m =>
            m.user_id === commitment.assigned_to ||
            m.name?.toLowerCase() === commitment.owner?.toLowerCase() ||
            m.email?.split('@')[0]?.toLowerCase() === commitment.owner?.toLowerCase()
        );
        console.log('found member:', member);
        if (member) setProfileMember(member);
    }

    const pill = getPill(localStatus);
    const ownerDisplay = displayName(commitment.owner);
    const assignedMember = members.find(m => m.user_id === commitment.assigned_to);
    const assignedDisplay = displayAssignedName(
        commitment.assigned_to,
        assignedMember?.name || assignedMember?.email?.split('@')[0]
    );

    const avIdx = (commitment.owner?.charCodeAt(0) || 0) % avColors.length;
    const av = avColors[avIdx];
    const isCompleted = localStatus === 'completed';

    return (
        <>
            <motion.div
                className="commitment-row"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                style={{ opacity: isCompleted ? 0.6 : 1 }}
            >
                {/* Avatar — clickable */}
                <div
                    onClick={handleAvatarClick}
                    title={`View ${commitment.owner}'s profile`}
                    style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: av.bg, color: av.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800,
                        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.boxShadow = `0 0 0 2px ${av.color}40`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
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
                        <span style={{
                            fontWeight: ownerDisplay === 'You' ? 700 : 400,
                            color: ownerDisplay === 'You' ? 'var(--accent-text)' : 'var(--text-muted)',
                        }}>
                            {ownerDisplay}
                        </span>
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
                            <span style={{ color: 'var(--text-muted)' }}>· {commitment.deadline}</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

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
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>—</div>
                                            Unassigned
                                        </div>
                                        {members.map((m, i) => {
                                            const isAssigned = m.user_id === commitment.assigned_to;
                                            const isCurrentUser = m.user_id === currentUserId;
                                            const memberName = isCurrentUser ? 'You' : (m.name || m.email?.split('@')[0]);
                                            const mav = avColors[i % avColors.length];
                                            return (
                                                <div key={m.user_id}
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
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: mav.bg, color: mav.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
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
                                minWidth: 80, justifyContent: 'center',  // ← add these two
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
                                        <div key={s.key}
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

            {/* Profile popup */}
            <AnimatePresence>
                {profileMember && (
                    <MemberProfilePopup
                        member={profileMember}
                        commitments={commitments}
                        onClose={() => setProfileMember(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}