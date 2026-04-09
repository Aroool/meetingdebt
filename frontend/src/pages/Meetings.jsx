import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import api from '../api';
import CommitmentRow from '../components/CommitmentRow';

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

export default function Meetings() {
    const [teamMeetings, setTeamMeetings] = useState([]);
    const [personalMeetings, setPersonalMeetings] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [members, setMembers] = useState([]);
    const [tab, setTab] = useState('team');
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const location = useLocation();

    const role = localStorage.getItem('userRole') || 'solo';
    const workspaceId = localStorage.getItem('workspaceId');
    const isSolo = localStorage.getItem('soloMode') === 'true';

    const fetchData = useCallback(async () => {
        try {
            const [teamRes, commitmentsRes, membersRes] = await Promise.all([
                workspaceId && !isSolo
                    ? api.get('/meetings', { params: { workspaceId } })
                    : Promise.resolve({ data: [] }),
                workspaceId
                    ? api.get('/commitments', { params: { workspaceId } })
                    : Promise.resolve({ data: [] }),
                workspaceId && role === 'manager'
                    ? api.get(`/workspaces/${workspaceId}/members`)
                    : Promise.resolve({ data: [] }),
            ]);
            setTeamMeetings(teamRes.data);
            setPersonalMeetings([]);
            setCommitments(commitmentsRes.data);
            setMembers(membersRes.data);

            // Auto-expand first meeting
            if (teamRes.data.length > 0) {
                setExpandedIds(new Set([teamRes.data[0].id]));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, role, isSolo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Handle navigation state
    useEffect(() => {
        const stateId = location.state?.selectedMeetingId;
        if (stateId) {
            setExpandedIds(new Set([stateId]));
            const isTeam = teamMeetings.find(m => m.id === stateId);
            if (isTeam) setTab('team');
        }
    }, [teamMeetings, personalMeetings, location.state]);

    function toggleExpand(id) {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function handleDelete(meeting) {
        setDeleting(true);
        try {
            await api.delete(`/meetings/${meeting.id}`);
            setDeleteConfirm(null);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    }

    const activeMeetings = tab === 'team' ? teamMeetings : personalMeetings;
    const showTabs = !isSolo && workspaceId;

    function formatDate(d) {
        return new Date(d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    }

    return (
        <div style={{ padding: '24px 32px', minHeight: 'calc(100vh - 56px)', background: 'var(--bg)' }}>
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-title">Meetings</div>
                <div className="page-sub">
                    {showTabs
                        ? `${teamMeetings.length} team · ${personalMeetings.length} personal`
                        : `${teamMeetings.length} meetings recorded`}
                </div>
            </motion.div>

            {showTabs && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="filter-tabs" style={{ marginBottom: 16 }}>
                        {[
                            { key: 'team', label: 'Team meetings', count: teamMeetings.length },
                            { key: 'personal', label: 'Personal', count: personalMeetings.length },
                        ].map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`ftab${tab === t.key ? ' active' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {t.label}
                                <span className={`pill ${tab === t.key ? 'pill-green' : 'pill-neutral'}`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Delete confirmation modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 98, backdropFilter: 'blur(2px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{
                                position: 'fixed', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 16, padding: 24, width: 360, zIndex: 99,
                                boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
                            }}
                        >
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                Delete this meeting?
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.title}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 20, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>
                                This will permanently delete the meeting and all its commitments. This cannot be undone.
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setDeleteConfirm(null)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="btn-danger">
                                    {deleting ? 'Deleting...' : 'Delete meeting'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="empty-state"><div className="empty-title">Loading...</div></div>
            ) : activeMeetings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 48 }}>
                    <div className="empty-title">
                        {tab === 'team' ? 'No team meetings yet' : 'No personal meetings yet'}
                    </div>
                    <div className="empty-sub">
                        {tab === 'team' && role === 'member'
                            ? "Your manager hasn't added any meetings yet"
                            : 'Extract a transcript from the dashboard to create a meeting'}
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                    {activeMeetings.map((m, i) => {
                        const mCommitments = commitments.filter(c => c.meeting_id === m.id);
                        const isExpanded = expandedIds.has(m.id);
                        const overdue = mCommitments.filter(c => getStatus(c) === 'overdue').length;
                        const done = mCommitments.filter(c => getStatus(c) === 'done').length;

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Meeting header */}
                                <div
                                    onClick={() => toggleExpand(m.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px', cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.title}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {formatDate(m.created_at)}
                                            <span>·</span>
                                            <span>{mCommitments.length} commitments</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                                        {overdue > 0 && <span className="pill pill-red">{overdue} late</span>}
                                        {done > 0 && <span className="pill pill-green">{done} done</span>}
                                        <span className="pill pill-neutral">{mCommitments.length}</span>

                                        {/* Delete button — manager only */}
                                        {role === 'manager' && (
                                            <button
                                                onClick={e => { e.stopPropagation(); setDeleteConfirm(m); }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-light)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 7,
                                                    border: '1px solid var(--border)',
                                                    background: 'transparent',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer', fontSize: 13,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s', fontFamily: 'inherit',
                                                }}>
                                                ×
                                            </button>
                                        )}

                                        {/* Chevron */}
                                        <div style={{
                                            fontSize: 10, color: 'var(--text-muted)',
                                            transition: 'transform 0.2s',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Commitments — collapsible */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                                {mCommitments.length === 0 ? (
                                                    <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                                                        No commitments extracted
                                                    </div>
                                                ) : (
                                                    mCommitments.map((c, idx) => (
                                                        <CommitmentRow
                                                            key={c.id}
                                                            commitment={c}
                                                            index={idx}
                                                            onUpdate={fetchData}
                                                            members={members}
                                                            commitments={commitments}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}