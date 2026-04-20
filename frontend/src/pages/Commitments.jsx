import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import CommitmentRow from '../components/CommitmentRow';
import { supabase } from '../supabase';
import useIsMobile from '../hooks/useIsMobile';


const SORT_OPTIONS = [
    { key: 'newest', label: 'Newest first' },
    { key: 'oldest', label: 'Oldest first' },
    { key: 'deadline', label: 'By deadline' },
    { key: 'owner', label: 'By person' },
    { key: 'status', label: 'By status' },
];

function parseDate(s) { if (!s) return null; const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }
function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline) {
        const due = parseDate(c.deadline);
        if (due && due < new Date()) return 'overdue';
    }
    return 'pending';
}

const statusOrder = { overdue: 0, blocked: 1, pending: 2, done: 3 };

export default function Commitments() {
    const [commitments, setCommitments] = useState([]);
    const [members, setMembers] = useState([]);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [personFilter, setPersonFilter] = useState('All');
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'grouped');
    const [loading, setLoading] = useState(true);
    const [sortOpen, setSortOpen] = useState(false);
    const [personOpen, setPersonOpen] = useState(false);

    function switchView(v) {
        setView(v);
        localStorage.setItem('commitmentsView', v);
    }

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const workspaceId = localStorage.getItem('workspaceId');
            const role = localStorage.getItem('userRole');

            let url = `/commitments`;
            if (workspaceId) {
                url = `/commitments?workspaceId=${workspaceId}`;
            } else if (userId) {
                url = `/commitments?userId=${userId}`;
            }
            const res = await api.get(url);
            setCommitments(res.data);

            if (workspaceId && role === 'manager') {
                const membersRes = await api.get(`/workspaces/${workspaceId}/members`);
                setMembers(membersRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // All unique owners for person filter
    const allPeople = ['All', ...new Set(commitments.map(c => c.owner).filter(Boolean))];

    // Stats
    const overdue = commitments.filter(c => getStatus(c) === 'overdue').length;
    const pending = commitments.filter(c => getStatus(c) === 'pending').length;
    const blocked = commitments.filter(c => getStatus(c) === 'blocked').length;
    const done = commitments.filter(c => getStatus(c) === 'done').length;

    // Filter + search + person
    let filtered = commitments.filter(c => {
        const matchesFilter = (() => {
            if (filter === 'All') return true;
            const s = getStatus(c);
            if (filter === 'Overdue') return s === 'overdue';
            if (filter === 'Pending') return s === 'pending';
            if (filter === 'Done') return s === 'done';
            if (filter === 'Blocked') return s === 'blocked';
            return true;
        })();
        const matchesSearch = search === '' ||
            c.task?.toLowerCase().includes(search.toLowerCase()) ||
            c.owner?.toLowerCase().includes(search.toLowerCase()) ||
            c.meeting_title?.toLowerCase().includes(search.toLowerCase());
        const matchesPerson = personFilter === 'All' || c.owner === personFilter;
        return matchesFilter && matchesSearch && matchesPerson;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
        if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'deadline') {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return parseDate(a.deadline) - parseDate(b.deadline);
        }
        if (sort === 'owner') return (a.owner || '').localeCompare(b.owner || '');
        if (sort === 'status') return (statusOrder[getStatus(a)] || 0) - (statusOrder[getStatus(b)] || 0);
        return 0;
    });

    // Group by meeting
    const grouped = filtered.reduce((acc, c) => {
        const key = c.meeting_id || 'personal';
        const title = c.meeting_title || (c.is_personal ? 'Personal Tasks' : 'Untitled Meeting');
        if (!acc[key]) acc[key] = { title, commitments: [] };
        acc[key].commitments.push(c);
        return acc;
    }, {});

    const isMobile = useIsMobile();

    const card = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--bg)', padding: isMobile ? '16px' : '24px 32px' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 20 }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
                            {localStorage.getItem('userRole') === 'member' ? 'My Tasks' : 'Commitments'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {commitments.length} total · {filtered.length} shown
                        </div>
                    </div>
                    {/* View toggle */}
                    <div className="filter-tabs" style={{ background: 'var(--bg)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
                        {[
                            { key: 'grouped', icon: '⊞', label: 'By meeting' },
                            { key: 'flat', icon: '☰', label: 'List' },
                        ].map(v => (
                            <button key={v.key} onClick={() => switchView(v.key)}
                                className={`ftab${view === v.key ? ' active' : ''}`}
                                style={view === v.key ? { background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : undefined}>
                                <span>{v.icon}</span> {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Overdue', value: overdue, color: 'var(--red)', bg: 'var(--red-light)', filter: 'Overdue' },
                        { label: 'Pending', value: pending, color: 'var(--amber)', bg: 'var(--amber-light)', filter: 'Pending' },
                        { label: 'Blocked', value: blocked, color: 'var(--blue)', bg: 'var(--blue-light)', filter: 'Blocked' },
                        { label: 'Done', value: done, color: 'var(--accent-text)', bg: 'var(--accent-light)', filter: 'Done' },
                    ].map(s => (
                        <div key={s.label}
                            onClick={() => setFilter(filter === s.filter ? 'All' : s.filter)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                                background: filter === s.filter ? s.bg : 'var(--bg-card)',
                                border: `1px solid ${filter === s.filter ? s.color + '40' : 'var(--border)'}`,
                                transition: 'all 0.15s',
                            }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {s.label}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>
                                {s.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Search + Sort + Person filter */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>
                            ⌕
                        </div>
                        <input
                            placeholder="Search tasks, people, meetings..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '9px 12px 9px 32px',
                                borderRadius: 8, border: '1px solid var(--border)',
                                background: 'var(--bg-card)', fontSize: 13,
                                color: 'var(--text-primary)', fontFamily: 'inherit',
                                outline: 'none', transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>
                                ×
                            </button>
                        )}
                    </div>

                    {/* Person filter */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setPersonOpen(v => !v)}
                            style={{
                                padding: '9px 14px', borderRadius: 8,
                                border: '1px solid var(--border)', background: 'var(--bg-card)',
                                fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            👤 {personFilter === 'All' ? 'All people' : personFilter}
                        </button>
                        <AnimatePresence>
                            {personOpen && (
                                <>
                                    <div onClick={() => setPersonOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        className="dropdown-menu"
                                        style={{ right: 'auto', left: 0, minWidth: 160, maxHeight: 240, overflowY: 'auto' }}
                                    >
                                        {allPeople.map(p => (
                                            <div key={p}
                                                onClick={() => { setPersonFilter(p); setPersonOpen(false); }}
                                                className={`dropdown-item${personFilter === p ? ' dropdown-item--active' : ''}`}
                                                style={personFilter === p ? { fontWeight: 600 } : undefined}
                                            >
                                                {p === 'All' ? 'All people' : p}
                                                {personFilter === p && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                                            </div>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sort */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setSortOpen(v => !v)}
                            style={{
                                padding: '9px 14px', borderRadius: 8,
                                border: '1px solid var(--border)', background: 'var(--bg-card)',
                                fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            ↕ {SORT_OPTIONS.find(s => s.key === sort)?.label}
                        </button>
                        <AnimatePresence>
                            {sortOpen && (
                                <>
                                    <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        className="dropdown-menu"
                                        style={{ minWidth: 160 }}
                                    >
                                        {SORT_OPTIONS.map(s => (
                                            <div key={s.key}
                                                onClick={() => { setSort(s.key); setSortOpen(false); }}
                                                className={`dropdown-item${sort === s.key ? ' dropdown-item--active' : ''}`}
                                                style={sort === s.key ? { fontWeight: 600, justifyContent: 'space-between' } : { justifyContent: 'space-between' }}
                                            >
                                                {s.label}
                                                {sort === s.key && <span style={{ fontSize: 11 }}>✓</span>}
                                            </div>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Clear filters */}
                    {(filter !== 'All' || search || personFilter !== 'All') && (
                        <button
                            onClick={() => { setFilter('All'); setSearch(''); setPersonFilter('All'); }}
                            className="btn-ghost-danger"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Content */}
            {loading ? (
                <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Loading...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                        No commitments found
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        {search ? `No results for "${search}"` : 'Try changing your filters'}
                    </div>
                    {(filter !== 'All' || search || personFilter !== 'All') && (
                        <button
                            onClick={() => { setFilter('All'); setSearch(''); setPersonFilter('All'); }}
                            style={{
                                padding: '8px 20px', borderRadius: 8,
                                background: 'var(--accent-light)', color: 'var(--accent-text)',
                                border: 'none', cursor: 'pointer', fontSize: 13,
                                fontWeight: 600, fontFamily: 'inherit',
                            }}>
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence mode="wait">

                    {/* FLAT VIEW */}
                    {view === 'flat' && (
                        <motion.div key="flat"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div style={{ ...card, overflow: 'hidden' }}>
                                {filtered.map((c, i) => (
                                    <CommitmentRow key={c.id} commitment={c} index={i}
                                        onUpdate={fetchData} members={members} commitments={commitments} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* GROUPED VIEW */}
                    {view === 'grouped' && (
                        <motion.div key="grouped"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {Object.entries(grouped).map(([meetingId, group], gi) => {
                                const gDone = group.commitments.filter(c => getStatus(c) === 'done').length;
                                const gOverdue = group.commitments.filter(c => getStatus(c) === 'overdue').length;
                                const gBlocked = group.commitments.filter(c => getStatus(c) === 'blocked').length;
                                const pct = group.commitments.length > 0
                                    ? Math.round((gDone / group.commitments.length) * 100) : 0;
                                return (
                                    <motion.div key={meetingId}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: gi * 0.05 }}
                                        style={{ marginBottom: 20 }}>
                                        {/* Group header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            marginBottom: 8, padding: '0 4px',
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {group.title}
                                            </span>
                                            <span className="pill pill-green">{group.commitments.length}</span>
                                            {gOverdue > 0 && <span className="pill pill-red">{gOverdue} late</span>}
                                            {gBlocked > 0 && <span className="pill pill-blue">{gBlocked} blocked</span>}
                                            {gDone > 0 && <span className="pill pill-green">{gDone} done</span>}
                                            {/* Progress bar */}
                                            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', maxWidth: 100, marginLeft: 'auto' }}>
                                                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{pct}%</span>
                                        </div>
                                        <div style={{ ...card, overflow: 'hidden' }}>
                                            {group.commitments.map((c, i) => (
                                                <CommitmentRow key={c.id} commitment={c} index={i}
                                                    onUpdate={fetchData} members={members} commitments={commitments} />
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}