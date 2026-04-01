import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { supabase } from '../../supabase';
import api from '../../api';

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

function formatDeadline(d) {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date)) return d;
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const avPalette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
function avColor(n) { return avPalette[(n?.charCodeAt(0) || 0) % avPalette.length]; }
function initials(n) { return n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }

const COLS = [
    { key: 'pending', label: 'Pending', color: 'var(--amber)', countBg: 'var(--amber-light)', countColor: 'var(--amber)' },
    { key: 'overdue', label: 'Overdue', color: 'var(--red)', countBg: 'var(--red-light)', countColor: 'var(--red)' },
    { key: 'blocked', label: 'Blocked', color: 'var(--blue)', countBg: 'var(--blue-light)', countColor: 'var(--blue)' },
    { key: 'done', label: 'Done', color: 'var(--accent-text)', countBg: 'var(--accent-light)', countColor: 'var(--accent-text)' },
];

// ── FOCUS TAB ──
function FocusTab({ commitments, members, onUpdate, currentUserId }) {
    const [idx, setIdx] = useState(0);
    const [filter, setFilter] = useState('All');
    const [direction, setDirection] = useState(1);
    const progressRef = useRef(null);

    const filtered = commitments.filter(c => {
        if (filter === 'All') return true;
        if (filter === 'Overdue') return getStatus(c) === 'overdue';
        if (filter === 'Pending') return getStatus(c) === 'pending';
        if (filter === 'Mine') return c.assigned_to === currentUserId;
        return true;
    });

    const overdue = commitments.filter(c => getStatus(c) === 'overdue').length;
    const pending = commitments.filter(c => getStatus(c) === 'pending').length;
    const mine = commitments.filter(c => c.assigned_to === currentUserId).length;

    const safeIdx = Math.min(idx, Math.max(filtered.length - 1, 0));
    const current = filtered[safeIdx];

    useEffect(() => {
        if (progressRef.current && filtered.length > 0) {
            gsap.to(progressRef.current, {
                width: `${((safeIdx + 1) / filtered.length) * 100}%`,
                duration: 0.4, ease: 'power2.out'
            });
        }
    }, [safeIdx, filtered.length]);

    function go(newIdx) {
        setDirection(newIdx > safeIdx ? 1 : -1);
        setIdx(Math.max(0, Math.min(newIdx, filtered.length - 1)));
    }

    async function markDone() {
        if (!current) return;
        try {
            await api.patch(`/commitments/${current.id}`, { status: 'completed' });
            onUpdate();
            if (safeIdx < filtered.length - 1) go(safeIdx);
        } catch (err) { console.error(err); }
    }

    async function markBlocked() {
        if (!current) return;
        try {
            await api.patch(`/commitments/${current.id}`, { status: 'blocked' });
            onUpdate();
        } catch (err) { console.error(err); }
    }

    const statusStyle = {
        done: { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Done' },
        overdue: { bg: 'var(--red-light)', color: 'var(--red)', label: 'Overdue' },
        blocked: { bg: 'var(--blue-light)', color: 'var(--blue)', label: 'Blocked' },
        pending: { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'Pending' },
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

            {/* Progress bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)' }}>
                <div ref={progressRef} style={{ height: '100%', background: 'var(--accent)', borderRadius: '0 2px 2px 0', width: '0%' }} />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {[
                    { key: 'All', label: `All ${commitments.length}` },
                    { key: 'Overdue', label: `Overdue ${overdue}` },
                    { key: 'Pending', label: `Pending ${pending}` },
                    { key: 'Mine', label: `Mine ${mine}` },
                ].map(f => (
                    <button key={f.key} onClick={() => { setFilter(f.key); setIdx(0); }}
                        style={{
                            padding: '4px 12px', borderRadius: 20,
                            border: filter === f.key ? '1px solid var(--accent)30' : '1px solid var(--border)',
                            cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
                            background: filter === f.key ? 'var(--accent-light)' : 'var(--bg-card)',
                            color: filter === f.key ? 'var(--accent-text)' : 'var(--text-muted)',
                            transition: 'all 0.15s',
                        }}>{f.label}</button>
                ))}
            </div>

            {/* Counter */}
            {filtered.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Task <span style={{ color: 'var(--text-secondary)' }}>{safeIdx + 1}</span> of <span style={{ color: 'var(--text-secondary)' }}>{filtered.length}</span>
                </div>
            )}

            {/* Card */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No tasks here</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try a different filter</div>
                </div>
            ) : (
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current?.id}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 60, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: direction * -60, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: 'power2.out' }}
                        style={{ width: '100%', maxWidth: 520, position: 'relative' }}
                    >
                        {/* Ghost cards */}
                        <div style={{ position: 'absolute', bottom: -10, left: 16, right: 16, height: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, zIndex: -1 }} />
                        <div style={{ position: 'absolute', bottom: -18, left: 28, right: 28, height: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, zIndex: -2, opacity: 0.5 }} />

                        {/* Main card */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 36px' }}>

                            {/* Meeting label */}
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                                {current.meeting_title || 'Personal Task'}
                            </div>

                            {/* Task */}
                            <div style={{ fontSize: 20, fontWeight: 700, color: current.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 22, textDecoration: current.status === 'completed' ? 'line-through' : 'none' }}>
                                {current.task}
                            </div>

                            {/* Meta */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: avColor(current.owner) + '20', color: avColor(current.owner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0 }}>
                                    {initials(current.owner)}
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{current.owner}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        {members.find(m => m.user_id === current.assigned_to)?.role || 'member'}
                                    </div>
                                </div>
                                {current.deadline && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: getStatus(current) === 'overdue' ? 'var(--red)' : 'var(--text-muted)', fontWeight: getStatus(current) === 'overdue' ? 700 : 400 }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: getStatus(current) === 'overdue' ? 'var(--red)' : 'var(--amber)' }} />
                                        {formatDeadline(current.deadline)}
                                    </div>
                                )}
                            </div>

                            {/* Status badge */}
                            {(() => {
                                const s = statusStyle[getStatus(current)] || statusStyle.pending;
                                return (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: s.bg, fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 24 }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
                                        {s.label}
                                    </div>
                                );
                            })()}

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={markDone}
                                    style={{ flex: 1, padding: '11px', borderRadius: 11, border: '1px solid var(--accent)30', background: 'var(--accent-light)', color: 'var(--accent-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    ✓ Mark done
                                </button>
                                <button onClick={markBlocked}
                                    style={{ flex: 1, padding: '11px', borderRadius: 11, border: '1px solid var(--blue)30', background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    ⊘ Blocked
                                </button>
                                <button onClick={() => go(safeIdx + 1)}
                                    style={{ flex: 1, padding: '11px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                    → Skip
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Navigation */}
            {filtered.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
                    <button onClick={() => go(safeIdx - 1)} disabled={safeIdx === 0}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: safeIdx === 0 ? 'var(--border)' : 'var(--text-muted)', cursor: safeIdx === 0 ? 'default' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        ←
                    </button>
                    <div style={{ display: 'flex', gap: 5 }}>
                        {filtered.slice(0, Math.min(filtered.length, 9)).map((_, i) => (
                            <div key={i} onClick={() => go(i)}
                                style={{ height: 6, borderRadius: 3, background: i === safeIdx ? 'var(--accent)' : 'var(--border)', width: i === safeIdx ? 20 : 6, cursor: 'pointer', transition: 'all 0.3s' }} />
                        ))}
                        {filtered.length > 9 && <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingTop: 1 }}>+{filtered.length - 9}</div>}
                    </div>
                    <button onClick={() => go(safeIdx + 1)} disabled={safeIdx === filtered.length - 1}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: safeIdx === filtered.length - 1 ? 'var(--border)' : 'var(--text-muted)', cursor: safeIdx === filtered.length - 1 ? 'default' : 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        →
                    </button>
                </div>
            )}
        </div>
    );
}

// ── BOARD TAB ──
function BoardTab({ commitments, members, onUpdate, currentUserId }) {
    const [dragging, setDragging] = useState(null);
    const [hoveredCol, setHoveredCol] = useState(null);
    const [personFilter, setPersonFilter] = useState('All');
    const [meetingFilter, setMeetingFilter] = useState('All');

    const allPeople = ['All', ...new Set(commitments.map(c => c.owner).filter(Boolean))];
    const allMeetings = ['All', ...new Set(commitments.map(c => c.meeting_title).filter(Boolean))];

    const filtered = commitments.filter(c => {
        const matchPerson = personFilter === 'All' || c.owner === personFilter;
        const matchMeeting = meetingFilter === 'All' || c.meeting_title === meetingFilter;
        return matchPerson && matchMeeting;
    });

    async function handleDrop(colKey) {
        if (!dragging || getStatus(dragging) === colKey) { setDragging(null); setHoveredCol(null); return; }
        const statusMap = { pending: 'pending', overdue: 'overdue', blocked: 'blocked', done: 'completed' };
        try {
            await api.patch(`/commitments/${dragging.id}`, { status: statusMap[colKey] });
            onUpdate();
        } catch (err) { console.error(err); }
        setDragging(null);
        setHoveredCol(null);
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
            {/* Filters */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0, background: 'var(--bg-card)' }}>
                {[
                    { value: personFilter, onChange: setPersonFilter, options: allPeople, allLabel: 'All people' },
                    { value: meetingFilter, onChange: setMeetingFilter, options: allMeetings, allLabel: 'All meetings' },
                ].map((s, i) => (
                    <select key={i} value={s.value} onChange={e => s.onChange(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                        {s.options.map(p => <option key={p} value={p}>{p === 'All' ? s.allLabel : p}</option>)}
                    </select>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {filtered.length} tasks
                </div>
            </div>

            {/* Columns */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, padding: 12, overflow: 'hidden' }}>
                {COLS.map(col => {
                    const tasks = filtered.filter(c => getStatus(c) === col.key);
                    const isHovered = hoveredCol === col.key;
                    return (
                        <div key={col.key}
                            onDragOver={e => { e.preventDefault(); setHoveredCol(col.key); }}
                            onDragLeave={() => setHoveredCol(null)}
                            onDrop={() => handleDrop(col.key)}
                            style={{ background: isHovered ? 'var(--accent-light)' : 'var(--bg-card)', border: `1px solid ${isHovered ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.2s' }}
                        >
                            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color }} />
                                    {col.label}
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.countBg, color: col.countColor }}>
                                    {tasks.length}
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {tasks.length === 0 ? (
                                    <div style={{ border: '1px dashed var(--border)', borderRadius: 9, padding: '20px 10px', textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                                        {isHovered ? 'Drop here' : `No ${col.label.toLowerCase()} tasks`}
                                    </div>
                                ) : tasks.map(c => (
                                    <motion.div key={c.id} layout
                                        draggable
                                        onDragStart={() => setDragging(c)}
                                        onDragEnd={() => { setDragging(null); setHoveredCol(null); }}
                                        style={{
                                            background: 'var(--bg)', border: `1px solid var(--border)`,
                                            borderRadius: 10, padding: '10px 11px', cursor: 'grab',
                                            opacity: dragging?.id === c.id ? 0.3 : col.key === 'done' ? 0.5 : 1,
                                            transition: 'opacity 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 500, color: col.key === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4, textDecoration: col.key === 'done' ? 'line-through' : 'none' }}>
                                            {c.task}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: avColor(c.owner) + '20', color: avColor(c.owner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, fontWeight: 900, flexShrink: 0 }}>
                                                {initials(c.owner)}
                                            </div>
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>{c.owner}</span>
                                            {c.deadline && (
                                                <span style={{ fontSize: 8, color: col.key === 'overdue' ? 'var(--red)' : 'var(--text-muted)', fontWeight: col.key === 'overdue' ? 700 : 400 }}>
                                                    {formatDeadline(c.deadline)}
                                                </span>
                                            )}
                                        </div>
                                        {c.meeting_title && (
                                            <div style={{ fontSize: 8, color: 'var(--text-muted)', padding: '2px 5px', background: 'var(--bg-card)', borderRadius: 4, marginTop: 5, display: 'inline-block', border: '1px solid var(--border)' }}>
                                                {c.meeting_title}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── MAIN ──
export default function LayoutB({ data, onUpdate, onOpenPicker }) {
    const { commitments, members, loading, userName, workspaceName, total } = data;
    const [tab, setTab] = useState('focus');
    const [currentUserId, setCurrentUserId] = useState('');
    const headerRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setCurrentUserId(session.user.id);
        });
    }, []);

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(headerRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
            gsap.fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.15 });
        });
        return () => ctx.revert();
    }, [loading]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

            {/* Header */}
            <div ref={headerRef} style={{ padding: '12px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', flexShrink: 0, opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-light)', border: '1px solid var(--border)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>
                        {userName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
                            {userName ? `${userName}'s workspace` : 'Your workspace'}
                            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>· {workspaceName || 'Personal'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            {total > 0 && <span style={{ marginLeft: 8 }}>· {total} commitments</span>}
                        </div>
                    </div>
                </div>
                <button onClick={onOpenPicker}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)50'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    ⊞
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                        Focus+Board
                    </span>
                </button>
            </div>

            {/* Tabs */}
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                {[
                    { key: 'focus', label: 'Focus mode' },
                    { key: 'board', label: 'Board view' },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{
                            padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            borderRadius: '8px 8px 0 0',
                            border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
                            borderBottom: 'none', position: 'relative', bottom: '-1px',
                            background: tab === t.key ? 'var(--bg)' : 'transparent',
                            color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontFamily: 'inherit', transition: 'all 0.15s',
                        }}>
                        {t.label}
                        {t.key === 'board' && total > 0 && (
                            <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                                {total}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div ref={contentRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: 0 }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            Loading...
                        </motion.div>
                    ) : tab === 'focus' ? (
                        <motion.div key="focus"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <FocusTab commitments={commitments} members={members} onUpdate={onUpdate} currentUserId={currentUserId} />
                        </motion.div>
                    ) : (
                        <motion.div key="board"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <BoardTab commitments={commitments} members={members} onUpdate={onUpdate} currentUserId={currentUserId} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}