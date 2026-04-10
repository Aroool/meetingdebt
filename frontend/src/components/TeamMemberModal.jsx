import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function parseDate(s) { if (!s) return null; const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }
function getStatusColor(status, deadline) {
    if (status === 'completed') return { bg: '#EAF3DE', color: '#16a34a' };
    if (status === 'blocked') return { bg: '#E6F1FB', color: '#3b82f6' };
    if (deadline && parseDate(deadline) < new Date()) return { bg: '#FCEBEB', color: '#ef4444' };
    return { bg: '#FAEEDA', color: '#f59e0b' };
}

function getStatusLabel(status, deadline) {
    if (status === 'completed') return 'Done';
    if (status === 'blocked') return 'Blocked';
    if (deadline && parseDate(deadline) < new Date()) return 'Overdue';
    return 'Pending';
}

export default function TeamMemberModal({ member, tasks, loading, onClose }) {
    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!member) return null;

    const meta = member.user_metadata || {};
    const fullName = meta.full_name || member.name || member.email?.split('@')[0] || 'Team Member';
    const nickname = meta.nickname;
    const bio = meta.bio;
    const avatarUrl = meta.avatar_url;
    const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const avatarColors = [
        { bg: '#dbeafe', color: '#1d4ed8' },
        { bg: '#ede9fe', color: '#7c3aed' },
        { bg: '#fef3c7', color: '#92400e' },
        { bg: '#ffe4e6', color: '#be123c' },
        { bg: '#ccfbf1', color: '#0f766e' },
    ];
    const av = avatarColors[fullName.charCodeAt(0) % avatarColors.length];

    const done = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.status !== 'completed' && t.deadline && parseDate(t.deadline) < new Date()).length;
    const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'blocked').length - overdue;

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                }}
            />
            <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    margin: 'auto',
                    height: 'fit-content',
                    zIndex: 201, width: '100%', maxWidth: 420,
                    background: 'var(--bg-card)', borderRadius: 20,
                    border: '1px solid var(--border)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                    overflow: 'hidden', maxHeight: '85vh',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Close button */}
                <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Avatar + name */}
                <div style={{ textAlign: 'center', padding: '8px 20px 16px', flexShrink: 0 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: avatarUrl ? 'transparent' : av.bg,
                        margin: '0 auto 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 800, color: av.color,
                        border: '3px solid var(--border)', overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials
                        }
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {fullName}
                        {nickname && (
                            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                                "{nickname}"
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                            background: member.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                            color: member.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)',
                        }}>
                            {member.role}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    {bio && (
                        <div style={{
                            fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic',
                            padding: '8px 16px', background: 'var(--bg)', borderRadius: 8,
                            margin: '0 16px',
                        }}>
                            "{bio}"
                        </div>
                    )}
                </div>

                {/* Mini stats */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 8, margin: '0 20px 16px',
                    padding: '12px', background: 'var(--bg)', borderRadius: 10,
                    flexShrink: 0,
                }}>
                    {[
                        { label: 'Pending', value: pending, color: '#f59e0b' },
                        { label: 'Overdue', value: overdue, color: '#ef4444' },
                        { label: 'Done', value: done, color: '#16a34a' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 2 }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tasks */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        Assigned tasks ({tasks.length})
                    </div>
                    {loading ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                            Loading tasks...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                            No tasks assigned yet
                        </div>
                    ) : tasks.map((task, i) => {
                        const s = getStatusColor(task.status, task.deadline);
                        return (
                            <div key={task.id} style={{
                                padding: '10px 0',
                                borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
                                display: 'flex', alignItems: 'flex-start', gap: 10,
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 3 }}>
                                        {task.task}
                                    </div>
                                    {task.meeting_title && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {task.meeting_title}
                                            {task.deadline && (' · Due ' + parseDate(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                    borderRadius: 20, flexShrink: 0,
                                    background: s.bg, color: s.color,
                                }}>
                                    {getStatusLabel(task.status, task.deadline)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '12px 20px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <a
                        href={'mailto:' + member.email}
                        style={{
                            fontSize: 13,
                            color: '#16a34a',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {'✉ Send email to ' + fullName.split(' ')[0]}
                    </a>
                </div>
            </motion.div>
        </AnimatePresence >
    );
}