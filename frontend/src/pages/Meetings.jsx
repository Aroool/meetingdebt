import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import api from '../api';
import CommitmentRow from '../components/CommitmentRow';

export default function Meetings() {
    const [teamMeetings, setTeamMeetings] = useState([]);
    const [personalMeetings, setPersonalMeetings] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [members, setMembers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [tab, setTab] = useState('team');
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const role = localStorage.getItem('userRole') || 'solo';
    const workspaceId = localStorage.getItem('workspaceId');
    const isSolo = localStorage.getItem('soloMode') === 'true';

    const fetchData = useCallback(async () => {
        try {
            const promises = [];

            if (workspaceId && !isSolo) {
                promises.push(api.get('/meetings', { params: { workspaceId } }));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }

            promises.push(api.get('/meetings'));

            let commitmentsParams = {};
            if (workspaceId && (role === 'manager' || role === 'member')) {
                commitmentsParams = { workspaceId };
            }
            promises.push(api.get('/commitments', { params: commitmentsParams }));

            if (workspaceId && role === 'manager') {
                promises.push(api.get(`/workspaces/${workspaceId}/members`));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }

            const [teamRes, personalRes, commitmentsRes, membersRes] = await Promise.all(promises);
            const personalOnly = personalRes.data.filter(m => !m.workspace_id);

            setTeamMeetings(teamRes.data);
            setPersonalMeetings(personalOnly);
            setCommitments(commitmentsRes.data);
            setMembers(membersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, role, isSolo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-select from navigation state or default to first
    useEffect(() => {
        const allMeetings = [...teamMeetings, ...personalMeetings];
        if (allMeetings.length === 0) return;

        const stateId = location.state?.selectedMeetingId;
        if (stateId) {
            const target = allMeetings.find(m => m.id === stateId);
            if (target) {
                // Switch to correct tab
                const isTeam = teamMeetings.find(m => m.id === stateId);
                setTab(isTeam ? 'team' : 'personal');
                setSelected(target);
                return;
            }
        }

        const activeList = tab === 'team' ? teamMeetings : personalMeetings;
        if (activeList.length > 0) setSelected(activeList[0]);
    }, [teamMeetings, personalMeetings, location.state]);

    // When tab changes manually
    useEffect(() => {
        const list = tab === 'team' ? teamMeetings : personalMeetings;
        if (list.length > 0) setSelected(list[0]);
        else setSelected(null);
    }, [tab]);

    const activeMeetings = tab === 'team' ? teamMeetings : personalMeetings;
    const selectedCommitments = commitments.filter(c => c.meeting_id === selected?.id);
    const showTabs = !isSolo && workspaceId;

    function formatDate(d) {
        return new Date(d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    }

    return (
        <div className="main">
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-title">Meetings</div>
                <div className="page-sub">
                    {showTabs
                        ? `${teamMeetings.length} team · ${personalMeetings.length} personal`
                        : `${personalMeetings.length} meetings recorded`}
                </div>
            </motion.div>

            {showTabs && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {[
                        { key: 'team', label: '🏢 Team meetings', count: teamMeetings.length },
                        { key: 'personal', label: '🙋 Personal', count: personalMeetings.length },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: '7px 16px', borderRadius: 8, border: 'none',
                                background: tab === t.key ? 'var(--accent-light)' : 'transparent',
                                color: tab === t.key ? 'var(--accent-text)' : 'var(--text-muted)',
                                fontWeight: tab === t.key ? 600 : 400,
                                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            {t.label}
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                                background: tab === t.key ? 'var(--accent)' : 'var(--border)',
                                color: tab === t.key ? '#fff' : 'var(--text-muted)',
                            }}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </motion.div>
            )}

            {loading ? (
                <div className="empty-state"><div className="empty-title">Loading...</div></div>
            ) : activeMeetings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 48 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{tab === 'team' ? '🏢' : '🙋'}</div>
                    <div className="empty-title">{tab === 'team' ? 'No team meetings yet' : 'No personal meetings yet'}</div>
                    <div className="empty-sub">
                        {tab === 'team' && role === 'member'
                            ? "Your manager hasn't added any meetings yet"
                            : tab === 'team'
                                ? 'Extract a transcript from the dashboard to create a team meeting'
                                : 'Personal meetings are ones you extract outside of a team workspace'}
                    </div>
                </div>
            ) : (
                <div className="meetings-layout">
                    <div className="meetings-list">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.15 }}
                            >
                                {activeMeetings.map((m, i) => {
                                    const count = commitments.filter(c => c.meeting_id === m.id).length;
                                    return (
                                        <motion.div
                                            key={m.id}
                                            className={`meeting-list-item ${selected?.id === m.id ? 'active' : ''}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => setSelected(m)}
                                        >
                                            <div className="mli-top">
                                                <div className="mli-title">{m.title}</div>
                                                <div className="meeting-badge">{count} items</div>
                                            </div>
                                            <div className="mli-date">{formatDate(m.created_at)}</div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected.id}
                                className="meeting-detail"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="card">
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">{selected.title}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {formatDate(selected.created_at)}
                                                <span style={{
                                                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                                                    padding: '1px 7px', borderRadius: 20,
                                                    background: tab === 'team' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                    color: tab === 'team' ? 'var(--accent-text)' : 'var(--blue)'
                                                }}>
                                                    {tab}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="meeting-badge">{selectedCommitments.length} commitments</div>
                                    </div>

                                    {selectedCommitments.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-title">
                                                {role === 'member' ? 'No tasks assigned to you from this meeting' : 'No commitments extracted'}
                                            </div>
                                        </div>
                                    ) : (
                                        selectedCommitments.map((c, i) => (
                                            <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={fetchData} members={members} />
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" className="meeting-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="card">
                                    <div className="empty-state" style={{ padding: '64px 20px' }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>👈</div>
                                        <div className="empty-title">Select a meeting</div>
                                        <div className="empty-sub">Click any meeting on the left to see its commitments</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}