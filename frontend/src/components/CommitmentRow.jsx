import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { getStatusKey } from '../utils';

const STATUSES = [
    { key: 'pending', label: 'Pending', cls: 'pill-amber' },
    { key: 'completed', label: 'Done', cls: 'pill-green' },
    { key: 'blocked', label: 'Blocked', cls: 'pill-blue' },
    { key: 'overdue', label: 'Overdue', cls: 'pill-red' },
];

const avatarColors = ['av-blue', 'av-purple', 'av-amber', 'av-rose', 'av-teal', 'av-green'];

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
    if (!name) return avatarColors[0];
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

function getStatus(commitment) {
    return getStatusKey(commitment);
}

function getPillConfig(status) {
    switch (status) {
        case 'completed': return { label: 'Done', cls: 'pill-green' };
        case 'blocked': return { label: 'Blocked', cls: 'pill-blue' };
        case 'overdue': return { label: 'Overdue', cls: 'pill-red' };
        default: return { label: 'Pending', cls: 'pill-amber' };
    }
}

export default function CommitmentRow({ commitment, index, onUpdate, members = [] }) {
    const [localStatus, setLocalStatus] = useState(getStatus(commitment));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [reassignOpen, setReassignOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    const dropdownRef = useRef(null);
    const reassignRef = useRef(null);
    const isManager = localStorage.getItem('userRole') === 'manager';

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
            if (reassignRef.current && !reassignRef.current.contains(e.target)) {
                setReassignOpen(false);
            }
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
            onUpdate && onUpdate();
        } catch (err) {
            console.error(err);
            setLocalStatus(getStatus(commitment));
        } finally {
            setSaving(false);
        }
    }

    async function reassignTo(userId) {
        setReassignOpen(false);
        setReassigning(true);
        try {
            await api.patch(`/commitments/${commitment.id}`, {
                assigned_to: userId || null
            });
            onUpdate && onUpdate();
        } catch (err) {
            console.error(err);
        } finally {
            setReassigning(false);
        }
    }

    const config = getPillConfig(localStatus);
    const initials = getInitials(commitment.owner);
    const avatarCls = getAvatarColor(commitment.owner);

    // Find currently assigned member name
    const assignedMember = members.find(m => m.user_id === commitment.assigned_to);
    const assignedName = assignedMember?.name || assignedMember?.email?.split('@')[0] || null;

    return (
        <motion.div
            className="commitment-row"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ opacity: localStatus === 'completed' ? 0.65 : 1 }}
        >

            <div className={`avatar ${avatarCls}`}>{initials}</div>

            <div className="commit-info">
                <div className="commit-task" style={{
                    textDecoration: localStatus === 'completed' ? 'line-through' : 'none'
                }}>
                    {commitment.task}
                </div>
                <div className="commit-meta">
                    {commitment.owner}
                    {assignedName && (
                        <span style={{
                            marginLeft: 6,
                            fontSize: 10, fontWeight: 700,
                            padding: '1px 7px', borderRadius: 20,
                            background: 'var(--blue-light)',
                            color: 'var(--blue)'
                        }}>
                            → {assignedName}
                        </span>
                    )}
                    {commitment.meeting_title && (
                        <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
                            · {commitment.meeting_title}
                        </span>
                    )}
                    <span style={{ marginLeft: 6 }}>
                        · {commitment.deadline || 'No deadline'}
                    </span>
                </div>
            </div>

            <div className="commit-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* Reassign button — manager only */}
                {isManager && (
                    <div ref={reassignRef} style={{ position: 'relative' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setReassignOpen(!reassignOpen)}
                            style={{
                                fontSize: 11, fontWeight: 600,
                                padding: '3px 10px', borderRadius: 20,
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all 0.15s',
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
                                        top: (() => {
                                            const el = reassignRef.current;
                                            if (!el) return 0;
                                            const rect = el.getBoundingClientRect();
                                            return rect.bottom + 6;
                                        })(),
                                        right: (() => {
                                            const el = reassignRef.current;
                                            if (!el) return 0;
                                            return window.innerWidth - el.getBoundingClientRect().right;
                                        })(),
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 10,
                                        padding: 4,
                                        zIndex: 9999,
                                        minWidth: 180,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <div style={{
                                        padding: '6px 10px 4px',
                                        fontSize: 10, fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Reassign to
                                    </div>

                                    {/* Unassigned option */}
                                    <div
                                        onClick={() => reassignTo(null)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '7px 10px', borderRadius: 7,
                                            cursor: 'pointer', fontSize: 12,
                                            color: 'var(--text-muted)',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 10
                                        }}>—</div>
                                        Unassigned
                                        {!commitment.assigned_to && (
                                            <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 11 }}>✓</span>
                                        )}
                                    </div>

                                    {members.map((m, i) => {
                                        const isCurrentlyAssigned = m.user_id === commitment.assigned_to;
                                        const memberName = m.name || m.email?.split('@')[0];
                                        const colors = [
                                            { bg: '#dbeafe', color: '#1d4ed8' },
                                            { bg: '#ede9fe', color: '#7c3aed' },
                                            { bg: '#fef3c7', color: '#92400e' },
                                            { bg: '#ffe4e6', color: '#be123c' },
                                            { bg: '#ccfbf1', color: '#0f766e' },
                                        ];
                                        const av = colors[i % colors.length];

                                        return (
                                            <div
                                                key={m.user_id}
                                                onClick={() => reassignTo(m.user_id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    padding: '7px 10px', borderRadius: 7,
                                                    cursor: 'pointer', fontSize: 12,
                                                    color: 'var(--text-primary)',
                                                    background: isCurrentlyAssigned ? 'var(--accent-light)' : 'transparent',
                                                    transition: 'background 0.1s',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isCurrentlyAssigned)
                                                        e.currentTarget.style.background = 'var(--bg)';
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isCurrentlyAssigned)
                                                        e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: av.bg, color: av.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 9, fontWeight: 800, flexShrink: 0
                                                }}>
                                                    {memberName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: isCurrentlyAssigned ? 600 : 400 }}>
                                                        {memberName}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                        {m.role}
                                                    </div>
                                                </div>
                                                {isCurrentlyAssigned && (
                                                    <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Status dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        style={{
                            fontSize: 11, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                            border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: config.cls === 'pill-green' ? 'var(--accent-light)' :
                                config.cls === 'pill-red' ? 'var(--red-light)' :
                                    config.cls === 'pill-blue' ? 'var(--blue-light)' : 'var(--amber-light)',
                            color: config.cls === 'pill-green' ? 'var(--accent-text)' :
                                config.cls === 'pill-red' ? 'var(--red)' :
                                    config.cls === 'pill-blue' ? 'var(--blue)' : 'var(--amber)',
                        }}
                    >
                        {saving ? '...' : config.label}
                        <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
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
                                    top: (() => {
                                        const el = dropdownRef.current;
                                        if (!el) return 0;
                                        return el.getBoundingClientRect().bottom + 6;
                                    })(),
                                    right: (() => {
                                        const el = dropdownRef.current;
                                        if (!el) return 0;
                                        return window.innerWidth - el.getBoundingClientRect().right;
                                    })(),
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    padding: 4,
                                    zIndex: 9999,
                                    minWidth: 130,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                }}
                            >
                                <div style={{ padding: '4px 10px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Status
                                </div>
                                {STATUSES.map(s => (
                                    <div
                                        key={s.key}
                                        onClick={() => changeStatus(s.key)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '7px 10px', borderRadius: 7,
                                            cursor: 'pointer', fontSize: 12,
                                            color: 'var(--text-primary)',
                                            background: localStatus === s.key ? 'var(--accent-light)' : 'transparent',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => { if (localStatus !== s.key) e.currentTarget.style.background = 'var(--bg)'; }}
                                        onMouseLeave={e => { if (localStatus !== s.key) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                background: s.cls === 'pill-green' ? '#16a34a' :
                                                    s.cls === 'pill-red' ? '#ef4444' :
                                                        s.cls === 'pill-blue' ? '#3b82f6' : '#f59e0b'
                                            }} />
                                            {s.label}
                                        </div>
                                        {localStatus === s.key && (
                                            <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>
                                        )}
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