import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CommitmentRow from '../CommitmentRow';

const FILTERS = ['All', 'Overdue', 'Pending', 'Done'];

function AnimatedNumber({ value }) {
    const [shown, setShown] = useState(0);
    useEffect(() => {
        const controls = animate(0, value, {
            duration: 0.8, ease: 'easeOut',
            onUpdate: v => setShown(Math.round(v)),
        });
        return controls.stop;
    }, [value]);
    return <span>{shown}</span>;
}

function DonutChart({ data, size = 100 }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = 38;
    const circ = 2 * Math.PI * r;
    let cumulative = 0;
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
            {data.map((d, i) => {
                const dash = (d.value / total) * circ;
                const so = -(cumulative / total) * circ;
                cumulative += d.value;
                return (
                    <motion.circle key={d.label} cx="50" cy="50" r={r}
                        fill="none" stroke={d.color} strokeWidth="12"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={so}
                        initial={{ opacity: 0, strokeDasharray: `0 ${circ}` }}
                        animate={{ opacity: 1, strokeDasharray: `${dash} ${circ - dash}` }}
                        transition={{ delay: i * 0.12, duration: 0.8, ease: 'easeOut' }}
                    />
                );
            })}
        </svg>
    );
}

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

export default function LayoutA({ data, onOpenModal, onUpdate, onOpenPicker, currentLayout }) {
    const { commitments, meetings, members, loading,
        overdue, pending, blocked, done, total,
        userName, workspaceName } = data;
    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'grouped');
    const navigate = useNavigate();

    const filtered = commitments.filter(c => {
        if (personFilter && c.owner !== personFilter) return false;
        if (filter === 'All') return true;
        const s = getStatus(c);
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Pending') return s === 'pending';
        if (filter === 'Done') return s === 'done';
        return true;
    });

    const meetingsWithCount = meetings.map(m => ({
        ...m, commitmentCount: commitments.filter(c => c.meeting_id === m.id).length,
    }));

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
    ).sort((a, b) => (b.overdue * 2 + b.pending) - (a.overdue * 2 + a.pending)).slice(0, 6);

    const donutData = [
        { label: 'Done', value: done, color: '#16a34a' },
        { label: 'Pending', value: pending, color: '#f59e0b' },
        { label: 'Overdue', value: overdue, color: '#ef4444' },
        { label: 'Blocked', value: blocked, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    const avColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
    function avatarColor(name) { return avColors[(name?.charCodeAt(0) || 0) % avColors.length]; }
    function initials(name) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* ── SIDEBAR ── */}
            <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    width: 240, flexShrink: 0, height: '100%', overflowY: 'auto',
                    borderRight: '1px solid var(--border)',
                    background: 'var(--bg-card)', display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Overview + donut */}
                <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                        Overview
                    </div>

                    {/* Donut */}
                    <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 14px' }}>
                        <DonutChart data={donutData.length ? donutData : [{ label: 'empty', value: 1, color: 'var(--border)' }]} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                                <AnimatedNumber value={total} />
                            </div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                                tasks
                            </div>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                            { label: 'Overdue', value: overdue, color: '#ef4444', bg: '#FCEBEB', icon: '🔴' },
                            { label: 'Pending', value: pending, color: '#f59e0b', bg: '#FAEEDA', icon: '🟡' },
                            { label: 'Blocked', value: blocked, color: '#3b82f6', bg: '#E6F1FB', icon: '🔵' },
                            { label: 'Done', value: done, color: '#16a34a', bg: '#EAF3DE', icon: '✅' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', borderRadius: 10,
                                    background: s.value > 0 ? s.bg : 'var(--bg)',
                                    border: `1px solid ${s.value > 0 ? s.color + '30' : 'var(--border)'}`,
                                    boxShadow: s.value > 0 ? `0 2px 8px ${s.color}15` : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 12 }}>{s.icon}</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {s.label}
                                    </span>
                                </div>
                                <span style={{ fontSize: 18, fontWeight: 900, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>
                                    <AnimatedNumber value={s.value} />
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {(overdue + blocked) > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                                background: '#ef444410', border: '1px solid #ef444425',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <motion.span
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ fontSize: 14 }}
                            >🔥</motion.span>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{overdue + blocked} need attention</div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{overdue} overdue · {blocked} blocked</div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Recent meetings */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                        Recent Meetings
                    </div>
                    {meetingsWithCount.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No meetings yet</div>
                    ) : meetingsWithCount.slice(0, 4).map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => navigate('/meetings', { state: { selectedMeetingId: m.id } })}
                            whileHover={{ x: 2, background: 'var(--bg)' }}
                            style={{ padding: '6px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, transition: 'background 0.15s' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {m.title}
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent-text)', flexShrink: 0, marginLeft: 4 }}>
                                    {m.commitmentCount}
                                </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Accountability */}
                {topPeople.length > 0 && (
                    <div style={{ padding: '14px 16px', flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                            Accountability
                        </div>
                        {topPeople.map((p, i) => {
                            const t = p.pending + p.overdue + p.done;
                            const pct = t ? Math.round((p.done / t) * 100) : 0;
                            const isActive = personFilter === p.name;
                            return (
                                <motion.div
                                    key={p.name}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.06 }}
                                    onClick={() => setPersonFilter(isActive ? null : p.name)}
                                    whileHover={{ background: isActive ? 'var(--accent-light)' : 'var(--bg)' }}
                                    style={{
                                        padding: '7px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                                        background: isActive ? 'var(--accent-light)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                            background: avatarColor(p.name) + '22', color: avatarColor(p.name),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 8, fontWeight: 900,
                                        }}>
                                            {initials(p.name)}
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </span>
                                        {p.overdue > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444' }}>{p.overdue}🔴</span>}
                                    </div>
                                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 2 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                                            style={{ height: '100%', background: '#16a34a', borderRadius: 10 }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pct}% done · {t} tasks</div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* ── MAIN ── */}
            <div style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{
                    padding: '18px 28px 14px', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-card)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.8, marginBottom: 2 }}>
                            {userName ? `${userName}'s workspace` : 'Your workspace'}
                            {workspaceName && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>· {workspaceName}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            {total > 0 && <span style={{ marginLeft: 8 }}>· {total} commitments</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Layout picker */}
                        <motion.button
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={onOpenPicker}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 8,
                                border: '1px solid var(--border)', background: 'var(--bg)',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                                color: 'var(--text-muted)', fontWeight: 500,
                            }}
                        >
                            <span>⊞</span>
                            <span>Layout</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                                {currentLayout === 'A' ? 'Command' : currentLayout === 'B' ? 'Kanban' : 'Focus'}
                            </span>
                        </motion.button>
                        {/* View toggle */}
                        <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
                            {[{ key: 'grouped', icon: '⊞' }, { key: 'flat', icon: '☰' }].map(v => (
                                <button key={v.key}
                                    onClick={() => { setView(v.key); localStorage.setItem('commitmentsView', v.key); }}
                                    style={{
                                        padding: '5px 10px', borderRadius: 6, border: 'none',
                                        background: view === v.key ? 'var(--bg-card)' : 'transparent',
                                        color: view === v.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                        cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                                        boxShadow: view === v.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                >{v.icon}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div style={{ padding: '10px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`ftab ${filter === f ? 'active' : ''}`}>
                            {f}
                            {f === 'Overdue' && overdue > 0 && <span style={{ marginLeft: 4, fontSize: 9 }}>{overdue}</span>}
                            {f === 'Pending' && pending > 0 && <span style={{ marginLeft: 4, fontSize: 9 }}>{pending}</span>}
                            {f === 'Done' && done > 0 && <span style={{ marginLeft: 4, fontSize: 9 }}>{done}</span>}
                        </button>
                    ))}
                    {personFilter && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', borderRadius: 20, padding: '3px 10px' }}>
                            <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 600 }}>{personFilter}</span>
                            <button onClick={() => setPersonFilter(null)} style={{ fontSize: 14, color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>×</button>
                        </div>
                    )}
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} tasks</div>
                </div>

                {/* Tasks */}
                <div style={{ padding: '20px 28px', flex: 1 }}>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                Loading...
                            </motion.div>
                        ) : filtered.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {personFilter ? `No tasks for ${personFilter}` : filter === 'All' ? 'No commitments yet' : `No ${filter.toLowerCase()} tasks`}
                                </div>
                                {filter === 'All' && !personFilter && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click + to extract your first meeting</div>
                                )}
                            </motion.div>
                        ) : view === 'flat' ? (
                            <motion.div key="flat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                                {filtered.map((c, i) => (
                                    <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={onUpdate} members={members} />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {Object.entries(
                                    filtered.reduce((acc, c) => {
                                        const key = c.meeting_id || 'no-meeting';
                                        const title = c.meeting_title || 'Untitled Meeting';
                                        if (!acc[key]) acc[key] = { title, items: [] };
                                        acc[key].items.push(c);
                                        return acc;
                                    }, {})
                                ).map(([mid, group], gi) => {
                                    const gDone = group.items.filter(c => getStatus(c) === 'done').length;
                                    const gOverdue = group.items.filter(c => getStatus(c) === 'overdue').length;
                                    return (
                                        <motion.div key={mid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: gi * 0.06 }} style={{ marginBottom: 18 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                                                <span style={{ fontSize: 14 }}>📋</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{group.title}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{group.items.length} tasks</span>
                                                {gOverdue > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: '#FCEBEB', color: '#ef4444' }}>{gOverdue} overdue</span>}
                                                {gDone > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: '#EAF3DE', color: '#16a34a' }}>{gDone} done</span>}
                                            </div>
                                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                                                {group.items.map((c, i) => (
                                                    <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={onUpdate} members={members} />
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}