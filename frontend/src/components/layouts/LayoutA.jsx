import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../../api';
import CommitmentRow from '../CommitmentRow';

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const dy = Math.floor(h / 24);
    if (dy > 0) return `${dy}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
}

const avPalette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
function avColor(n) { return avPalette[(n?.charCodeAt(0) || 0) % avPalette.length]; }
function initials(n) { return n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }

function ActivityItem({ item }) {
    const map = {
        status_changed: { icon: '✓', bg: 'var(--accent-light)', color: 'var(--accent-text)' },
        task_reassigned: { icon: '↻', bg: 'var(--blue-light)', color: 'var(--blue)' },
        meeting_created: { icon: '+', bg: '#ede9fe', color: '#8b5cf6' },
        member_invited: { icon: '→', bg: 'var(--amber-light)', color: 'var(--amber)' },
        nudge_sent: { icon: '!', bg: 'var(--red-light)', color: 'var(--red)' },
    };
    const s = map[item.type] || { icon: '·', bg: 'var(--bg)', color: 'var(--text-muted)' };
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)', minHeight: 48 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
            }}>
                {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <strong style={{ fontWeight: 600 }}>{item.actor_name}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{item.message}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {timeAgo(item.created_at)}
                </div>
            </div>
        </div>
    );
}

function TaskFocusItem({ c }) {
    const isOverdue = getStatus(c) === 'overdue';
    return (
        <div style={{
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderRadius: 8,
            background: isOverdue ? 'var(--red-light)' : 'var(--bg)',
            border: `1px solid ${isOverdue ? 'var(--red)30' : 'var(--border)'}`,
            marginBottom: 6,
            transition: 'transform 0.15s',
            cursor: 'default',
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >
            <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: avColor(c.owner) + '20', color: avColor(c.owner),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800,
            }}>
                {initials(c.owner)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.task}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.owner}</div>
            </div>
            <div style={{
                height: 20, padding: '0 9px', borderRadius: 999,
                background: isOverdue ? 'var(--red-light)' : 'var(--amber-light)',
                color: isOverdue ? 'var(--red)' : 'var(--amber)',
                fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center',
                border: `1px solid ${isOverdue ? 'var(--red)' : 'var(--amber)'}20`,
            }}>
                {isOverdue ? 'Overdue' : 'Today'}
            </div>
        </div>
    );
}

function ProfilePopup({ userName, currentRole, workspaceName, onClose }) {
    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, zIndex: 99,
            }} />
            <div style={{
                position: 'absolute', top: 52, left: 0, zIndex: 100,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 20, width: 240,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--accent-light)', color: 'var(--accent-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 900,
                    }}>
                        {userName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {userName || 'User'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {currentRole || 'member'}
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Workspace</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {workspaceName || 'Personal'}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function LayoutA({ data, onUpdate, onOpenPicker }) {
    const {
        commitments, members, loading,
        overdue, pending, blocked, done, total,
        userName, workspaceName, currentRole,
    } = data;

    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'grouped');
    const [activity, setActivity] = useState([]);
    const [showProfile, setShowProfile] = useState(false);

    const headerRef = useRef(null);
    const leftRef = useRef(null);
    const centerRef = useRef(null);
    const rightRef = useRef(null);
    const progressRefs = useRef([]);
    const hiddenAtRef = useRef(null);
    const hasAnimatedRef = useRef(!!sessionStorage.getItem('layoutA_animated'));


    // Track tab visibility — only animate if away 2+ mins
    useEffect(() => {
        function handleVisibility() {
            if (document.hidden) {
                hiddenAtRef.current = Date.now();
            } else {
                const awayMs = Date.now() - (hiddenAtRef.current || 0);
                if (awayMs >= 2 * 60 * 1000) {
                    hasAnimatedRef.current = false;
                    sessionStorage.removeItem('layoutA_animated');
                }
            }
        }
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    useEffect(() => {
        const workspaceId = localStorage.getItem('workspaceId');
        if (!workspaceId) return;
        api.get(`/activity?workspaceId=${workspaceId}&limit=10`)
            .then(r => setActivity(r.data)).catch(() => { });
    }, [commitments]);

    useEffect(() => {
        if (loading) return;
        if (hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        sessionStorage.setItem('layoutA_animated', '1');

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl
                .fromTo(headerRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4 })
                .fromTo(leftRef.current, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4 }, '-=0.2')
                .fromTo(centerRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
                .fromTo(rightRef.current, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.4 }, '-=0.3');
            progressRefs.current.filter(Boolean).forEach((bar, i) => {
                gsap.fromTo(bar, { width: '0%' },
                    { width: bar.dataset.width, duration: 1, ease: 'power2.out', delay: 0.7 + i * 0.1 });
            });
        });
        return () => ctx.revert();
    }, [loading]);

    // Make sure elements are visible even if animation skipped
    useEffect(() => {
        if (loading) return;
        if (!hasAnimatedRef.current) return;
        [headerRef, leftRef, centerRef, rightRef].forEach(ref => {
            if (ref.current) ref.current.style.opacity = '1';
        });
    }, [loading]);

    const todayTasks = commitments.filter(c => {
        const s = getStatus(c);
        if (s === 'done') return false;
        if (s === 'overdue') return true;
        if (!c.deadline) return false;
        return new Date(c.deadline).toDateString() === new Date().toDateString();
    }).slice(0, 5);

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

    const card = (extra = {}) => ({
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        ...extra,
    });

    const sectionLabel = (color = 'var(--text-muted)') => ({
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
    });

    const statPills = [
        { label: 'Pending', value: pending, color: 'var(--amber)', bg: 'var(--amber-light)' },
        { label: 'Overdue', value: overdue, color: 'var(--red)', bg: 'var(--red-light)' },
        { label: 'Blocked', value: blocked, color: 'var(--blue)', bg: 'var(--blue-light)' },
        { label: 'Done', value: done, color: 'var(--accent-text)', bg: 'var(--accent-light)' },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

            {/* ── HEADER ── */}
            <div ref={headerRef} style={{
                ...card(), borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                padding: '12px 24px', flexShrink: 0, opacity: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                    {/* Avatar — click for profile popup */}
                    <div
                        onClick={() => setShowProfile(v => !v)}
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 900, color: 'var(--accent-text)',
                            cursor: 'pointer', transition: 'opacity 0.15s',
                            border: '1px solid var(--border)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        {userName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>

                    {showProfile && (
                        <ProfilePopup
                            userName={userName}
                            currentRole={currentRole}
                            workspaceName={workspaceName}
                            onClose={() => setShowProfile(false)}
                        />
                    )}

                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
                            {userName ? `${userName}'s workspace` : 'Your workspace'}
                            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                                · {workspaceName || 'Personal'}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            <span style={{
                                fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 999,
                                background: 'var(--bg)', color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                            }}>
                                {currentRole || 'manager'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={onOpenPicker}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)50'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg)',
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                            color: 'var(--text-muted)', transition: 'border-color 0.15s',
                        }}>
                        ⊞
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                            Command
                        </span>
                    </button>
                    <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
                        {[{ key: 'grouped', icon: '⊞' }, { key: 'flat', icon: '☰' }].map(v => (
                            <button key={v.key}
                                onClick={() => { setView(v.key); localStorage.setItem('commitmentsView', v.key); }}
                                style={{
                                    padding: '5px 10px', borderRadius: 6, border: 'none',
                                    background: view === v.key ? 'var(--bg-card)' : 'transparent',
                                    color: view === v.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                                    boxShadow: view === v.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.15s',
                                }}>{v.icon}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── THREE COLUMNS ── */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 12, padding: '12px 24px 16px', overflow: 'hidden', minHeight: 0 }}>

                {/* ── LEFT ── */}
                <div ref={leftRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', opacity: 0 }}>

                    {/* Today's Focus */}
                    <div style={{ ...card({ padding: 16 }), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)' }} />
                            Today's Focus
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                {todayTasks.length} tasks
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {todayTasks.length === 0 ? (
                                <div style={{ padding: '28px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>All clear</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nothing due today</div>
                                </div>
                            ) : todayTasks.map(c => <TaskFocusItem key={c.id} c={c} />)}
                        </div>
                    </div>

                    {/* Accountability */}
                    <div style={{ ...card({ padding: 16 }), flexShrink: 0 }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
                            Accountability
                        </div>
                        {topPeople.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>No team data yet</div>
                        ) : topPeople.map((p, i) => {
                            const t = p.pending + p.overdue + p.done;
                            const pct = t ? Math.round((p.done / t) * 100) : 0;
                            const isActive = personFilter === p.name;
                            return (
                                <div key={p.name}
                                    onClick={() => setPersonFilter(isActive ? null : p.name)}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg)'; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    style={{
                                        padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                                        background: isActive ? 'var(--accent-light)' : 'transparent',
                                        transition: 'background 0.15s', marginBottom: 4,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: avColor(p.name) + '20', color: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, flexShrink: 0 }}>
                                            {initials(p.name)}
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name}
                                        </span>
                                        {p.overdue > 0 && <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>{p.overdue} late</span>}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                        <div ref={el => progressRefs.current[i] = el}
                                            data-width={`${pct}%`}
                                            style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: '0%' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── CENTER ── */}
                <div ref={centerRef} style={{ ...card(), display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: 0 }}>
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginRight: 4 }}>Commitments</span>
                        {['All', 'Overdue', 'Pending', 'Done'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                style={{
                                    padding: '4px 12px', borderRadius: 999, border: 'none',
                                    background: filter === f ? 'var(--accent-light)' : 'transparent',
                                    color: filter === f ? 'var(--accent-text)' : 'var(--text-muted)',
                                    fontWeight: filter === f ? 700 : 400,
                                    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}>
                                {f}
                                {f === 'Overdue' && overdue > 0 && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: 'var(--red)' }}>{overdue}</span>}
                                {f === 'Pending' && pending > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)' }}>{pending}</span>}
                                {f === 'Done' && done > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)' }}>{done}</span>}
                            </button>
                        ))}
                        {personFilter && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent-light)', borderRadius: 999, padding: '3px 10px' }}>
                                <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 600 }}>{personFilter}</span>
                                <button onClick={() => setPersonFilter(null)} style={{ fontSize: 14, color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button>
                            </div>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} tasks</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {loading ? (
                            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '64px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    {personFilter ? `No tasks for ${personFilter}` : filter === 'All' ? 'No commitments yet' : `No ${filter.toLowerCase()} tasks`}
                                </div>
                                {filter === 'All' && !personFilter && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click + to add your first meeting</div>
                                )}
                            </div>
                        ) : view === 'flat' ? (
                            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                                {filtered.map((c, i) => (
                                    <CommitmentRow
                                        key={c.id}
                                        commitment={c}
                                        index={i}
                                        onUpdate={onUpdate}
                                        members={members}
                                        commitments={commitments}
                                    />
                                ))}
                            </div>
                        ) : (
                            Object.entries(
                                filtered.reduce((acc, c) => {
                                    const key = c.meeting_id || 'no-meeting';
                                    const title = c.meetings?.title || c.meeting_title || 'Untitled Meeting';
                                    if (!acc[key]) acc[key] = { title, items: [] };
                                    acc[key].items.push(c);
                                    return acc;
                                }, {})
                            ).map(([mid, group]) => {
                                const gDone = group.items.filter(c => getStatus(c) === 'done').length;
                                const gOverdue = group.items.filter(c => getStatus(c) === 'overdue').length;
                                return (
                                    <div key={mid} style={{ marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 2px' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{group.title}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{group.items.length}</span>
                                            {gOverdue > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--red-light)', color: 'var(--red)' }}>{gOverdue} late</span>}
                                            {gDone > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{gDone} done</span>}
                                        </div>
                                        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)' }}>
                                            {group.items.map((c, i) => (
                                                <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={onUpdate} members={members} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div ref={rightRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', opacity: 0 }}>

                    {/* Activity */}
                    <div style={{ ...card({ padding: 16 }), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
                            Activity
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {activity.length === 0 ? (
                                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No activity yet</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Actions will appear here</div>
                                </div>
                            ) : activity.map(a => <ActivityItem key={a.id} item={a} />)}
                        </div>
                    </div>

                    {/* Status breakdown + Completion */}
                    <div style={{ ...card({ padding: 16 }), flexShrink: 0 }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
                            Status
                        </div>

                        {/* Vertical stat pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                            {statPills.map(s => (
                                <div key={s.label} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '7px 12px', borderRadius: 9,
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>
                                        {s.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Completion bar */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-text)', lineHeight: 1 }}>{done}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {total} tasks completed</span>
                            </div>
                            <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{
                                    height: '100%', background: 'var(--accent)', borderRadius: 999,
                                    width: total > 0 ? `${Math.round(done / total * 100)}%` : '0%',
                                    transition: 'width 1s ease',
                                }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {total > 0 ? Math.round(done / total * 100) : 0}% completion rate
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}