import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

function parseDate(s) { if (!s) return null; const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }
function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && parseDate(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

const avColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
function avatarColor(name) { return avColors[(name?.charCodeAt(0) || 0) % avColors.length]; }
function initials(name) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }

export default function LayoutC({ data, onUpdate, onOpenPicker, currentLayout }) {
    const { commitments, meetings, loading, overdue, pending, done, total, userName, workspaceName } = data;
    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const navigate = useNavigate();

    const meetingsWithCount = meetings.map(m => ({
        ...m, commitmentCount: commitments.filter(c => c.meeting_id === m.id).length,
    }));

    const filtered = commitments.filter(c => {
        if (personFilter && c.owner !== personFilter) return false;
        if (filter === 'All') return true;
        const s = getStatus(c);
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Pending') return s === 'pending';
        if (filter === 'Done') return s === 'done';
        return true;
    });

    const topPeople = Object.values(
        commitments.reduce((acc, c) => {
            if (!c.owner) return acc;
            if (!acc[c.owner]) acc[c.owner] = { name: c.owner, pending: 0, overdue: 0, done: 0 };
            const s = getStatus(c);
            if (s === 'pending') acc[c.owner].pending++;
            if (s === 'overdue') acc[c.owner].overdue++;
            if (s === 'done') acc[c.owner].done++;
            return acc;
        }, {})
    ).sort((a, b) => (b.overdue * 2 + b.pending) - (a.overdue * 2 + a.pending)).slice(0, 5);

    async function toggleDone(c) {
        const newStatus = c.status === 'completed' ? 'pending' : 'completed';
        try {
            await api.patch(`/commitments/${c.id}`, { status: newStatus });
            onUpdate();
        } catch (err) { console.error(err); }
    }

    const pillStyle = status => ({
        done: { bg: '#EAF3DE', color: '#16a34a' },
        overdue: { bg: '#FCEBEB', color: '#ef4444' },
        blocked: { bg: '#E6F1FB', color: '#3b82f6' },
        pending: { bg: '#FAEEDA', color: '#f59e0b' },
    }[status] || { bg: '#FAEEDA', color: '#f59e0b' });

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* Main list */}
            <div style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px 20px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{workspaceName || 'Personal'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1 }}>
                            {userName ? `${userName}'s workspace` : 'Your workspace'}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={onOpenPicker}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 8,
                                border: '1px solid var(--border)', background: 'var(--bg)',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                                color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0,
                            }}
                        >
                            <span>⊞</span> Layout
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                                Focus
                            </span>
                        </motion.button>
                    </div>

                    {/* Filter pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                            { key: 'All', label: `All ${total}` },
                            { key: 'Overdue', label: `Overdue ${overdue}` },
                            { key: 'Pending', label: `Pending ${pending}` },
                            { key: 'Done', label: `Done ${done}` },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                style={{
                                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: 12, fontWeight: filter === f.key ? 700 : 400,
                                    border: filter === f.key ? 'none' : '1px solid var(--border)',
                                    background: filter === f.key ? 'var(--text-primary)' : 'transparent',
                                    color: filter === f.key ? 'var(--bg)' : 'var(--text-muted)',
                                    transition: 'all 0.15s',
                                }}
                            >{f.label}</button>
                        ))}
                        {personFilter && (
                            <button onClick={() => setPersonFilter(null)}
                                style={{
                                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                                    border: 'none', background: 'var(--accent-light)',
                                    color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                {personFilter} ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Task rows */}
                <div style={{ flex: 1, padding: '0 32px 24px' }}>
                    {loading ? (
                        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '80px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {personFilter ? `No tasks for ${personFilter}` : `No ${filter.toLowerCase()} tasks`}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filtered.map((c, i) => {
                                const s = getStatus(c);
                                const pill = pillStyle(s);
                                const isDone = s === 'done';
                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '12px 0', borderBottom: '0.5px solid var(--border)',
                                            opacity: isDone ? 0.55 : 1,
                                        }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            onClick={() => toggleDone(c)}
                                            style={{
                                                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                                border: isDone ? 'none' : '1.5px solid var(--border)',
                                                background: isDone ? '#16a34a' : 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {isDone && (
                                                <svg width="10" height="10" viewBox="0 0 10 10">
                                                    <polyline points="2,5 4,7 8,3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </motion.div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                                                textDecoration: isDone ? 'line-through' : 'none', marginBottom: 3,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {c.task}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: avatarColor(c.owner) + '22', color: avatarColor(c.owner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, fontWeight: 800 }}>
                                                    {initials(c.owner)}
                                                </div>
                                                {c.owner}
                                                {c.meeting_title && <span>· {c.meeting_title}</span>}
                                                {c.deadline && <span>· {c.deadline}</span>}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: pill.bg, color: pill.color, flexShrink: 0 }}>
                                            {s === 'done' ? 'Done' : s === 'overdue' ? 'Overdue' : s === 'blocked' ? 'Blocked' : 'Pending'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Right panel */}
            <div style={{
                width: 260, flexShrink: 0, height: '100%', overflowY: 'auto',
                borderLeft: '1px solid var(--border)', background: 'var(--bg-card)',
                padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 20,
            }}>
                {topPeople.length > 0 && (
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Accountability
                        </div>
                        {topPeople.map((p, i) => {
                            const t = p.pending + p.overdue + p.done;
                            const pct = t ? Math.round((p.done / t) * 100) : 0;
                            const isActive = personFilter === p.name;
                            return (
                                <motion.div key={p.name}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => setPersonFilter(isActive ? null : p.name)}
                                    whileHover={{ background: isActive ? 'var(--accent-light)' : 'var(--bg)' }}
                                    style={{
                                        marginBottom: 10, cursor: 'pointer', padding: '8px', borderRadius: 8,
                                        background: isActive ? 'var(--accent-light)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: avatarColor(p.name) + '22', color: avatarColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900 }}>
                                                {initials(p.name)}
                                            </div>
                                            <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)' }}>{p.name}</span>
                                        </div>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t} tasks</span>
                                    </div>
                                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 3 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }}
                                            style={{ height: '100%', background: '#16a34a', borderRadius: 10 }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pct}% done</div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <div style={{ height: 1, background: 'var(--border)' }} />

                <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                        Recent Meetings
                    </div>
                    {meetingsWithCount.slice(0, 5).map((m, i) => (
                        <motion.div key={m.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => navigate('/meetings', { state: { selectedMeetingId: m.id } })}
                            whileHover={{ x: 2 }}
                            style={{ padding: '7px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}
                        >
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.title}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{m.commitmentCount} items</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}