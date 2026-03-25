import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CommitmentRow from '../components/CommitmentRow';
import API from '../config';
import { supabase } from '../supabase';

const FILTERS = ['All', 'Overdue', 'Pending', 'Done', 'Blocked'];

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.status === 'overdue') return 'overdue';
    if (c.deadline) {
        const due = new Date(c.deadline);
        if (!isNaN(due) && due < new Date()) return 'overdue';
    }
    return 'pending';
}

export default function Commitments() {
    const [commitments, setCommitments] = useState([]);
    const [members, setMembers] = useState([]);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(
        localStorage.getItem('commitmentsView') || 'flat'
    );

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

            let url = `${API}/commitments?userId=${userId}`;
            if (workspaceId && role === 'manager') {
                url = `${API}/commitments?workspaceId=${workspaceId}`;
            } else if (workspaceId && role === 'member') {
                url = `${API}/commitments?workspaceId=${workspaceId}&userId=${userId}`;
            }

            const res = await axios.get(url);
            setCommitments(res.data);

            if (workspaceId && role === 'manager') {
                const membersRes = await axios.get(`${API}/workspaces/${workspaceId}/members`);
                setMembers(membersRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = commitments.filter(c => {
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
            c.owner?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Group by meeting
    const grouped = filtered.reduce((acc, c) => {
        const key = c.meeting_id || 'no-meeting';
        const title = c.meeting_title || 'Untitled Meeting';
        if (!acc[key]) acc[key] = { title, commitments: [] };
        acc[key].commitments.push(c);
        return acc;
    }, {});

    return (
        <div className="main">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
                <div>
                    <div className="page-title">
                        {localStorage.getItem('userRole') === 'member' ? 'My Tasks' : 'Commitments'}
                    </div>
                    <div className="page-sub">
                        {commitments.length} total · {filtered.length} shown
                    </div>
                </div>

                {/* View toggle */}
                <div style={{
                    display: 'flex', gap: 2, background: 'var(--bg)',
                    borderRadius: 8, padding: 3, border: '1px solid var(--border)'
                }}>
                    {[
                        { key: 'flat', icon: '☰', label: 'List' },
                        { key: 'grouped', icon: '⊞', label: 'By meeting' },
                    ].map(v => (
                        <button
                            key={v.key}
                            onClick={() => switchView(v.key)}
                            title={v.label}
                            style={{
                                padding: '5px 12px', borderRadius: 6, border: 'none',
                                background: view === v.key ? 'var(--bg-card)' : 'transparent',
                                color: view === v.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                                fontWeight: view === v.key ? 600 : 400,
                                boxShadow: view === v.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                            }}
                        >
                            <span>{v.icon}</span>
                            <span style={{ fontSize: 12 }}>{v.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Search + filters */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <input
                    className="search-input"
                    placeholder="Search by task or person..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            className={`ftab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="empty-state"><div className="empty-title">Loading...</div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-title">No commitments found</div>
                    <div className="empty-sub">
                        {search ? 'Try a different search' : 'No commitments in this category'}
                    </div>
                </div>
            ) : (
                <AnimatePresence mode="wait">

                    {/* FLAT VIEW */}
                    {view === 'flat' && (
                        <motion.div
                            key="flat"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">All commitments</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {filtered.length} items
                                    </div>
                                </div>
                                {filtered.map((c, i) => (
                                    <CommitmentRow
                                        key={c.id}
                                        commitment={c}
                                        index={i}
                                        onUpdate={fetchData}
                                        members={members}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* GROUPED VIEW */}
                    {view === 'grouped' && (
                        <motion.div
                            key="grouped"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {Object.entries(grouped).map(([meetingId, group], gi) => (
                                <motion.div
                                    key={meetingId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: gi * 0.05 }}
                                    style={{ marginBottom: 16 }}
                                >
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        marginBottom: 8, padding: '0 4px'
                                    }}>
                                        <div style={{ fontSize: 16 }}>📋</div>
                                        <div>
                                            <div style={{
                                                fontSize: 14, fontWeight: 700,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {group.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                {group.commitments.length} commitment{group.commitments.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {/* Mini stats for this meeting */}
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                            {[
                                                { label: 'pending', color: 'var(--amber)', bg: 'var(--amber-light)' },
                                                { label: 'overdue', color: 'var(--red)', bg: 'var(--red-light)' },
                                                { label: 'done', color: 'var(--accent)', bg: 'var(--accent-light)' },
                                            ].map(s => {
                                                const count = group.commitments.filter(c =>
                                                    s.label === 'done'
                                                        ? getStatus(c) === 'done'
                                                        : getStatus(c) === s.label
                                                ).length;
                                                if (!count) return null;
                                                return (
                                                    <span key={s.label} style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: '2px 8px', borderRadius: 20,
                                                        background: s.bg, color: s.color
                                                    }}>
                                                        {count} {s.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="card">
                                        {group.commitments.map((c, i) => (
                                            <CommitmentRow
                                                key={c.id}
                                                commitment={c}
                                                index={i}
                                                onUpdate={fetchData}
                                                members={members}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}