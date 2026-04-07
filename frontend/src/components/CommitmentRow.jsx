import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getPill(status) {
    return STATUSES.find((s) => s.key === status) || STATUSES[0];
}

function safeDateText(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function calculateFloatingPosition(anchorEl, menuEl, options = {}) {
    const {
        gap = 8,
        padding = 8,
        align = 'end',
        preferredPlacement = 'bottom',
    } = options;

    if (!anchorEl) {
        return { top: -9999, left: -9999, transformOrigin: 'top right' };
    }

    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = menuEl?.offsetWidth || 180;
    const menuHeight = menuEl?.offsetHeight || 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = align === 'start' ? rect.left : rect.right - menuWidth;
    left = clamp(left, padding, Math.max(padding, vw - menuWidth - padding));

    const spaceBelow = vh - rect.bottom - padding;
    const spaceAbove = rect.top - padding;

    let top = rect.bottom + gap;
    let placement = 'bottom';

    if (preferredPlacement === 'bottom') {
        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
            top = rect.top - menuHeight - gap;
            placement = 'top';
        }
    } else if (spaceAbove >= menuHeight) {
        top = rect.top - menuHeight - gap;
        placement = 'top';
    }

    top = clamp(top, padding, Math.max(padding, vh - menuHeight - padding));

    return {
        top,
        left,
        transformOrigin: placement === 'top' ? 'bottom right' : 'top right',
    };
}

function useFloatingMenu(open, anchorRef, menuRef, options) {
    const [position, setPosition] = useState({ top: -9999, left: -9999, transformOrigin: 'top right' });

    useEffect(() => {
        if (!open) return undefined;

        let raf1 = 0;
        let raf2 = 0;

        const update = () => {
            setPosition(calculateFloatingPosition(anchorRef.current, menuRef.current, options));
        };

        raf1 = requestAnimationFrame(() => {
            update();
            raf2 = requestAnimationFrame(update);
        });

        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);

        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [open, anchorRef, menuRef, options]);

    return position;
}

function PortalMenu({ open, menuRef, position, children, width = 180 }) {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -4 }}
                transition={{ duration: 0.14 }}
                style={{
                    position: 'fixed',
                    top: position.top,
                    left: position.left,
                    transformOrigin: position.transformOrigin,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 4,
                    zIndex: 9999,
                    minWidth: width,
                    boxShadow: '0 14px 32px rgba(0,0,0,0.14)',
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

function MemberProfilePopup({ member, commitments, onClose }) {
    const navigate = useNavigate();
    const avIdx = (member?.name?.charCodeAt(0) || 0) % avColors.length;
    const av = avColors[avIdx];
    const gradient = coverGradients[avIdx];

    const memberCommitments = commitments.filter((c) =>
        c.assigned_to === member?.user_id || c.owner?.toLowerCase() === member?.name?.toLowerCase()
    );

    const pending = memberCommitments.filter((c) => {
        if (c.status === 'completed' || c.status === 'blocked') return false;
        if (c.deadline && new Date(c.deadline) < new Date()) return false;
        return true;
    }).length;

    const overdue = memberCommitments.filter((c) => {
        if (c.status === 'completed') return false;
        return c.deadline && new Date(c.deadline) < new Date();
    }).length;

    const done = memberCommitments.filter((c) => c.status === 'completed').length;
    const total = memberCommitments.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const displayName = member?.name || member?.email?.split('@')[0] || 'Unknown';
    const email = member?.email || '';

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9997,
                        background: 'rgba(15, 23, 42, 0.14)',
                        backdropFilter: 'blur(6px)',
                    }}
                />

                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        pointerEvents: 'none',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 8 }}
                        transition={{ duration: 0.16 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(340px, 100%)',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 18,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                            overflow: 'hidden',
                            pointerEvents: 'auto',
                        }}
                    >
                        <div style={{ height: 84, background: gradient, position: 'relative' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.16)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                ×
                            </button>
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -22,
                                    left: 18,
                                    width: 54,
                                    height: 54,
                                    borderRadius: '50%',
                                    background: member?.avatar_url ? 'transparent' : av.bg,
                                    color: av.color,
                                    border: '3px solid var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16,
                                    fontWeight: 900,
                                    overflow: 'hidden',
                                }}
                            >
                                {member?.avatar_url ? (
                                    <img src={member.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials(displayName)
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '38px 20px 20px' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{displayName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: 20,
                                        background: 'var(--blue-light)',
                                        color: 'var(--blue)',
                                    }}
                                >
                                    {member?.role || 'member'}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{localStorage.getItem('workspaceName') || 'Demo Team'}</span>
                            </div>

                            <div
                                style={{
                                    fontSize: 11,
                                    color: member?.bio ? 'var(--text-secondary)' : 'var(--text-muted)',
                                    lineHeight: 1.6,
                                    marginBottom: 12,
                                    paddingBottom: 12,
                                    borderBottom: '1px solid var(--border)',
                                    fontStyle: member?.bio ? 'normal' : 'italic',
                                }}
                            >
                                {member?.bio || 'No bio yet.'}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
                                {[
                                    { label: 'Pending', value: pending, color: 'var(--amber)' },
                                    { label: 'Overdue', value: overdue, color: 'var(--red)' },
                                    { label: 'Done', value: done, color: 'var(--accent-text)' },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 4px',
                                            borderRadius: 10,
                                            background: 'var(--bg)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <div style={{ fontSize: 18, fontWeight: 800, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1, marginBottom: 2 }}>
                                            {s.value}
                                        </div>
                                        <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>{pct}% completion rate · {total} tasks</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {email && (
                                    <a
                                        href={`mailto:${email}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            background: 'var(--accent-light)',
                                            color: 'var(--accent-text)',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '0.84';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                    >
                                        <span>✉</span>
                                        Send email to {displayName.split(' ')[0]}
                                    </a>
                                )}
                                <button
                                    onClick={() => {
                                        navigate('/workspace');
                                        onClose();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        background: 'var(--bg)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border)',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <span>↗</span>
                                    View full profile
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </>
        </AnimatePresence>,
        document.body
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

    const statusButtonRef = useRef(null);
    const statusMenuRef = useRef(null);
    const reassignButtonRef = useRef(null);
    const reassignMenuRef = useRef(null);
    const isManager = localStorage.getItem('userRole') === 'manager';

    const uniqueMembers = useMemo(() => {
        const seen = new Set();
        return members.filter((m) => {
            if (!m?.user_id || seen.has(m.user_id)) return false;
            seen.add(m.user_id);
            return true;
        });
    }, [members]);

    const statusPosition = useFloatingMenu(dropdownOpen, statusButtonRef, statusMenuRef, {
        align: 'end',
        preferredPlacement: 'bottom',
        gap: 8,
    });

    const reassignPosition = useFloatingMenu(reassignOpen, reassignButtonRef, reassignMenuRef, {
        align: 'end',
        preferredPlacement: 'bottom',
        gap: 8,
    });

    useEffect(() => {
        let ignore = false;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session || ignore) return;
            setCurrentUserId(session.user.id || '');
            const meta = session.user.user_metadata;
            const name = meta?.full_name || meta?.first_name || session.user.email?.split('@')[0] || '';
            setCurrentUserName(name.toLowerCase());
        });
        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        setLocalStatus(getStatusKey(commitment));
    }, [commitment]);

    useEffect(() => {
        function handlePointerDown(e) {
            const target = e.target;

            if (
                dropdownOpen &&
                !statusButtonRef.current?.contains(target) &&
                !statusMenuRef.current?.contains(target)
            ) {
                setDropdownOpen(false);
            }

            if (
                reassignOpen &&
                !reassignButtonRef.current?.contains(target) &&
                !reassignMenuRef.current?.contains(target)
            ) {
                setReassignOpen(false);
            }
        }

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [dropdownOpen, reassignOpen]);

    useEffect(() => {
        function handleEscape(e) {
            if (e.key !== 'Escape') return;
            if (profileMember) {
                setProfileMember(null);
                return;
            }
            if (reassignOpen) {
                setReassignOpen(false);
                return;
            }
            if (dropdownOpen) {
                setDropdownOpen(false);
            }
        }

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [dropdownOpen, reassignOpen, profileMember]);

    useEffect(() => {
        if (!profileMember) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [profileMember]);

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

    async function changeStatus(newStatus) {
        setDropdownOpen(false);
        setSaving(true);
        const previousStatus = localStatus;
        setLocalStatus(newStatus);
        try {
            await api.patch(`/commitments/${commitment.id}`, { status: newStatus });
            onUpdate?.();
        } catch (err) {
            console.error(err);
            setLocalStatus(previousStatus);
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
        const ownerName = commitment.owner?.trim().toLowerCase();
        const assignedId = commitment.assigned_to;

        const member =
            uniqueMembers.find((m) => m.user_id === assignedId) ||
            uniqueMembers.find((m) => m.name?.trim().toLowerCase() === ownerName) ||
            uniqueMembers.find((m) => m.email?.split('@')[0]?.trim().toLowerCase() === ownerName);

        if (member) {
            setDropdownOpen(false);
            setReassignOpen(false);
            setProfileMember(member);
        }
    }

    const pill = getPill(localStatus);
    const ownerDisplay = displayName(commitment.owner);
    const assignedMember = uniqueMembers.find((m) => m.user_id === commitment.assigned_to);
    const assignedDisplay = displayAssignedName(
        commitment.assigned_to,
        assignedMember?.name || assignedMember?.email?.split('@')[0]
    );

    const avIdx = (commitment.owner?.charCodeAt(0) || 0) % avColors.length;
    const av = avColors[avIdx];
    const isCompleted = localStatus === 'completed';
    const deadlineDisplay = safeDateText(commitment.deadline);

    return (
        <>
            <motion.div
                className="commitment-row"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                style={{ opacity: isCompleted ? 0.6 : 1 }}
            >
                <div
                    onClick={handleAvatarClick}
                    title={commitment.owner ? `View ${commitment.owner}'s profile` : 'View member profile'}
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: av.bg,
                        color: av.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                        e.currentTarget.style.boxShadow = `0 0 0 2px ${av.color}40`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {getInitials(commitment.owner)}
                </div>

                <div className="commit-info" style={{ flex: 1, minWidth: 0 }}>
                    <div
                        className="commit-task"
                        style={{
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                    >
                        {commitment.task}
                    </div>
                    <div className="commit-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <span
                            style={{
                                fontWeight: ownerDisplay === 'You' ? 700 : 400,
                                color: ownerDisplay === 'You' ? 'var(--accent-text)' : 'var(--text-muted)',
                            }}
                        >
                            {ownerDisplay}
                        </span>
                        {assignedDisplay && assignedDisplay !== ownerDisplay && (
                            <>
                                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '1px 7px',
                                        borderRadius: 20,
                                        background: assignedDisplay === 'You' ? 'var(--accent-light)' : 'var(--blue-light)',
                                        color: assignedDisplay === 'You' ? 'var(--accent-text)' : 'var(--blue)',
                                    }}
                                >
                                    {assignedDisplay}
                                </span>
                            </>
                        )}
                        {commitment.meeting_title && <span style={{ color: 'var(--text-muted)' }}>· {commitment.meeting_title}</span>}
                        {deadlineDisplay && <span style={{ color: 'var(--text-muted)' }}>· {deadlineDisplay}</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isManager && (
                        <div ref={reassignButtonRef} style={{ position: 'relative' }}>
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                    if (saving) return;
                                    setDropdownOpen(false);
                                    setReassignOpen((v) => !v);
                                }}
                                disabled={reassigning}
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    cursor: reassigning ? 'wait' : 'pointer',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    opacity: reassigning ? 0.7 : 1,
                                }}
                            >
                                {reassigning ? '...' : '↻ Reassign'}
                            </motion.button>

                            <PortalMenu open={reassignOpen} menuRef={reassignMenuRef} position={reassignPosition} width={198}>
                                <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Reassign to
                                </div>

                                <div
                                    onClick={() => reassignTo(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '7px 10px',
                                        borderRadius: 7,
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        color: 'var(--text-muted)',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>—</div>
                                    Unassigned
                                </div>

                                {uniqueMembers.map((m, i) => {
                                    const isAssigned = m.user_id === commitment.assigned_to;
                                    const isCurrentUser = m.user_id === currentUserId;
                                    const memberName = isCurrentUser ? 'You' : m.name || m.email?.split('@')[0] || 'Member';
                                    const mav = avColors[i % avColors.length];
                                    return (
                                        <div
                                            key={m.user_id}
                                            onClick={() => reassignTo(m.user_id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '7px 10px',
                                                borderRadius: 7,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                color: 'var(--text-primary)',
                                                background: isAssigned ? 'var(--accent-light)' : 'transparent',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isAssigned) e.currentTarget.style.background = 'var(--bg)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isAssigned) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    background: mav.bg,
                                                    color: mav.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 9,
                                                    fontWeight: 800,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {(m.name || m.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: isAssigned ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberName}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.role || 'member'}</div>
                                            </div>
                                            {isAssigned && <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </PortalMenu>
                        </div>
                    )}

                    <div ref={statusButtonRef} style={{ position: 'relative' }}>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                if (reassigning) return;
                                setReassignOpen(false);
                                setDropdownOpen((v) => !v);
                            }}
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 10px',
                                borderRadius: 20,
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: pill.bg,
                                color: pill.color,
                                minWidth: 86,
                                justifyContent: 'center',
                            }}
                        >
                            {saving ? '...' : pill.label}
                            <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
                        </motion.button>

                        <PortalMenu open={dropdownOpen} menuRef={statusMenuRef} position={statusPosition} width={144}>
                            <div style={{ padding: '4px 10px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Update status
                            </div>
                            {STATUSES.map((s) => (
                                <div
                                    key={s.key}
                                    onClick={() => changeStatus(s.key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '7px 10px',
                                        borderRadius: 7,
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        color: 'var(--text-primary)',
                                        background: localStatus === s.key ? s.bg : 'transparent',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (localStatus !== s.key) e.currentTarget.style.background = 'var(--bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (localStatus !== s.key) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                        {s.label}
                                    </div>
                                    {localStatus === s.key && <span style={{ color: s.color, fontSize: 12 }}>✓</span>}
                                </div>
                            ))}
                        </PortalMenu>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {profileMember && <MemberProfilePopup member={profileMember} commitments={commitments} onClose={() => setProfileMember(null)} />}
            </AnimatePresence>
        </>
    );
}
