import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import StatCard from '../components/StatCard';
import CommitmentRow from '../components/CommitmentRow';
import MeetingCard from '../components/MeetingCard';
import NewMeetingModal from '../components/NewMeetingModal';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

const FILTERS = ['All', 'Overdue', 'Pending', 'Done'];

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline) {
        const due = new Date(c.deadline);
        if (!isNaN(due) && due < new Date()) return 'overdue';
    }
    return 'pending';
}

function getHour() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const [commitments, setCommitments] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [filter, setFilter] = useState('All');
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [cm, mm] = await Promise.all([
                axios.get('http://localhost:5001/commitments'),
                axios.get('http://localhost:5001/meetings'),
            ]);
            setCommitments(cm.data);
            setMeetings(mm.data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = commitments.filter(c => {
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
                        <span className="attention-badge">
                            {overdue} need attention
                        </span>
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
                            <div className="card-title">Commitments</div>
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

                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-title">Loading...</div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-title">No commitments here</div>
                                <div className="empty-sub">
                                    {filter === 'All'
                                        ? 'Click + to add your first meeting'
                                        : `No ${filter.toLowerCase()} commitments`}
                                </div>
                            </div>
                        ) : (
                            filtered.map((c, i) => (
                                <CommitmentRow
                                    key={c.id}
                                    commitment={c}
                                    index={i}
                                    onUpdate={fetchData}
                                />
                            ))
                        )}
                    </div>
                </Panel>

                <PanelResizeHandle style={{
                    width: 6,
                    cursor: 'col-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: 3,
                        height: 40,
                        borderRadius: 4,
                        background: 'var(--border)',
                        transition: 'background 0.15s',
                    }} />
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
                                    <div key={p.name} className="person-row">
                                        <div className="person-left">
                                            <div className={`avatar ${getAvatarColor(p.name)}`}
                                                style={{ width: 26, height: 26, fontSize: 9 }}>
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

            <NewMeetingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}