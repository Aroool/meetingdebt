import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import StatCard from '../components/StatCard';
import CommitmentRow from '../components/CommitmentRow';
import MeetingCard from '../components/MeetingCard';
import NewMeetingModal from '../components/NewMeetingModal';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import LogoTransition from '../components/LogoTransition';
import { getStatus } from '../utils';

const FILTERS = ['All', 'Overdue', 'Pending', 'Done'];

function getHour() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const [commitments, setCommitments] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [members, setMembers] = useState([]);
    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showTransition, setShowTransition] = useState(false);
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'flat');
    const [currentRole, setCurrentRole] = useState(localStorage.getItem('userRole') || 'solo');
    const navigate = useNavigate();

    useEffect(() => {
        const shouldShow = sessionStorage.getItem('showTransition');
        if (shouldShow) {
            sessionStorage.removeItem('showTransition');
            setShowTransition(true);
        }
    }, []);

    useEffect(() => {
        function handleSwitch() {
            setCurrentRole(localStorage.getItem('userRole') || 'solo');
        }
        window.addEventListener('workspaceSwitched', handleSwitch);
        return () => window.removeEventListener('workspaceSwitched', handleSwitch);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const workspaceId = localStorage.getItem('workspaceId');
            const role = localStorage.getItem('userRole') || 'solo';

            let commitmentsParams = {};
            let meetingsParams = {};

            if (workspaceId && role === 'manager') {
                commitmentsParams = { workspaceId };
                meetingsParams = { workspaceId };
            } else if (workspaceId && role === 'member') {
                commitmentsParams = { workspaceId };
                meetingsParams = { workspaceId };
            }

            const [cm, mm] = await Promise.all([
                api.get('/commitments', { params: commitmentsParams }),
                api.get('/meetings', { params: meetingsParams }),
            ]);

            setCommitments(cm.data);
            setMeetings(mm.data);

            if (workspaceId && role === 'manager') {
                const membersRes = await api.get(`/workspaces/${workspaceId}/members`);
                setMembers(membersRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = commitments.filter(c => {
        if (personFilter && c.owner !== personFilter) return false;
        if (filter === 'All') return true;
        const s = getStatus(c);
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Pending') return s === 'pending';
        if (filter === 'Done') return s === 'done';
        return true;
    });

    const overdue = commitments.filter(c => getStatus(c) === 'overdue').length;
    const pending = commitments.filter(c => getStatus(c) === 'pending').length;
    const blocked = commitments.filter(c => getStatus(c) === 'blocked').length;
    const done = commitments.filter(c => getStatus(c) === 'done').length;

    const meetingsWithCount = meetings.map(m => ({
        ...m,
        commitmentCount: commitments.filter(c => c.meeting_id === m.id).length,
    }));

    const topPeople = Object.values(
        commitments.reduce((acc, c) => {
            if (!c.owner) return acc;
            if (!acc[c.owner]) acc[c.owner] = { name: c.owner, pending: 0, overdue: 0 };
            const s = getStatus(c);
            if (s === 'pending') acc[c.owner].pending++;
            if (s === 'overdue') acc[c.owner].overdue++;
            return acc;
        }, {})
    ).sort((a, b) => b.overdue - a.overdue).slice(0, 4);

    const avatarColors = ['av-blue', 'av-purple', 'av-amber', 'av-rose', 'av-teal'];
    function getAvatarColor(name) {
        return avatarColors[name?.charCodeAt(0) % avatarColors.length] || avatarColors[0];
    }
    function getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    if (showTransition) {
        return <LogoTransition onComplete={() => setShowTransition(false)} />;
    }

    return (
        <div className="main">
            <div className="greeting-wrap">
                <motion.div
                    className="greeting-main"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
                >
                    <motion.span
                        className="greeting-sun"
                        animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                        transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
                    >
                        {new Date().getHours() < 18 ? '☀️' : '🌙'}
                    </motion.span>
                    <span className="greeting-text">{getHour()}</span>
                    <motion.span
                        className="greeting-wave"
                        animate={{ rotate: [0, 20, -10, 20, 0] }}
                        transition={{ duration: 1.2, delay: 0.8, ease: 'easeInOut' }}
                        style={{ display: 'inline-block', originX: '70%', originY: '70%' }}
                    >
                        👋
                    </motion.span>
                </motion.div>
                <motion.div
                    className="page-sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {overdue > 0 && (
                        <span className="attention-badge">{overdue} need attention</span>
                    )}
                </motion.div>
            </div>

            <div className="stats-grid">
                <StatCard label="Overdue" value={overdue} color="red" index={0} />
                <StatCard label="Pending" value={pending} color="amber" index={1} />
                <StatCard label="Blocked" value={blocked} color="blue" index={2} />
                <StatCard label="Completed" value={done} color="green" index={3} />
            </div>

            <PanelGroup direction="horizontal" style={{ gap: 0 }}>
                <Panel defaultSize={72} minSize={40}>
                    <div className="card" style={{ marginRight: 8 }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="card-title">Commitments</div>
                                {personFilter && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: 'var(--accent-light)', borderRadius: 20,
                                        padding: '2px 10px',
                                    }}>
                                        <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 600 }}>
                                            {personFilter}
                                        </span>
                                        <button
                                            onClick={() => setPersonFilter(null)}
                                            style={{
                                                fontSize: 12, color: 'var(--accent-text)', background: 'none',
                                                border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    display: 'flex', gap: 2, background: 'var(--bg)',
                                    borderRadius: 6, padding: 2, border: '1px solid var(--border)'
                                }}>
                                    {[{ key: 'flat', icon: '☰' }, { key: 'grouped', icon: '⊞' }].map(v => (
                                        <button
                                            key={v.key}
                                            onClick={() => { setView(v.key); localStorage.setItem('commitmentsView', v.key); }}
                                            style={{
                                                padding: '3px 8px', borderRadius: 4, border: 'none',
                                                background: view === v.key ? 'var(--bg-card)' : 'transparent',
                                                color: view === v.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                                cursor: 'pointer', fontSize: 12,
                                                boxShadow: view === v.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            {v.icon}
                                        </button>
                                    ))}
                                </div>
                                <div className="filter-tabs">
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
                        </div>

                        {loading ? (
                            <div className="empty-state"><div className="empty-title">Loading...</div></div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-title">No commitments here</div>
                                <div className="empty-sub">
                                    {personFilter
                                        ? `No commitments for ${personFilter}`
                                        : filter === 'All' ? 'Click + to add your first meeting'
                                            : `No ${filter.toLowerCase()} commitments`}
                                </div>
                            </div>
                        ) : (
                            view === 'flat' ? (
                                filtered.map((c, i) => (
                                    <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={fetchData} members={members} />
                                ))
                            ) : (
                                Object.entries(
                                    filtered.reduce((acc, c) => {
                                        const key = c.meeting_id || 'no-meeting';
                                        const title = c.meeting_title || 'Untitled Meeting';
                                        if (!acc[key]) acc[key] = { title, commitments: [] };
                                        acc[key].commitments.push(c);
                                        return acc;
                                    }, {})
                                ).map(([meetingId, group], gi) => (
                                    <div key={meetingId}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 20px 6px',
                                            borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                                        }}>
                                            <span style={{ fontSize: 13 }}>📋</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {group.title}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                {group.commitments.length} items
                                            </span>
                                        </div>
                                        {group.commitments.map((c, i) => (
                                            <CommitmentRow key={c.id} commitment={c} index={i} onUpdate={fetchData} members={members} />
                                        ))}
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </Panel>

                <PanelResizeHandle style={{ width: 6, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 3, height: 40, borderRadius: 4, background: 'var(--border)' }} />
                </PanelResizeHandle>

                <Panel defaultSize={28} minSize={20}>
                    <div className="sidebar" style={{ marginLeft: 8 }}>
                        <div className="sidebar-card">
                            <div className="sidebar-head">Recent meetings</div>
                            {meetingsWithCount.length === 0 ? (
                                <div className="empty-state" style={{ padding: '24px 16px' }}>
                                    <div className="empty-sub">No meetings yet</div>
                                </div>
                            ) : (
                                meetingsWithCount.slice(0, 5).map((m, i) => (
                                    <MeetingCard key={m.id} meeting={m} index={i} />
                                ))
                            )}
                        </div>

                        {topPeople.length > 0 && (
                            <motion.div
                                className="sidebar-card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="sidebar-head">Top accountability</div>
                                {topPeople.map((p) => (
                                    <div
                                        key={p.name}
                                        className="person-row"
                                        onClick={() => setPersonFilter(personFilter === p.name ? null : p.name)}
                                        style={{
                                            cursor: 'pointer',
                                            background: personFilter === p.name ? 'var(--accent-light)' : 'transparent',
                                            borderRadius: 6,
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        <div className="person-left">
                                            <div className={`avatar ${getAvatarColor(p.name)}`} style={{ width: 26, height: 26, fontSize: 9 }}>
                                                {getInitials(p.name)}
                                            </div>
                                            {p.name}
                                        </div>
                                        <div className="person-right">
                                            {p.pending} pending
                                            {p.overdue > 0 && (
                                                <><br /><span className="overdue-text">{p.overdue} overdue</span></>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </Panel>
            </PanelGroup>

            {currentRole !== 'member' && (
                <motion.button
                    className="fab"
                    onClick={() => setModalOpen(true)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                    +
                </motion.button>
            )}

            <NewMeetingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}