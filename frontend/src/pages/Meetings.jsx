import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CommitmentRow from '../components/CommitmentRow';
import API from '../config';
import { supabase } from '../supabase';

export default function Meetings() {
    const [meetings, setMeetings] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const [mm, cm] = await Promise.all([
                axios.get(`${API}/meetings?userId=${userId}`),
                axios.get(`${API}/commitments?userId=${userId}`),
            ]);
            setMeetings(mm.data);
            setCommitments(cm.data);
            if (mm.data.length > 0) setSelected(mm.data[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const selectedCommitments = commitments.filter(
        c => c.meeting_id === selected?.id
    );

    function formatDate(d) {
        return new Date(d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    }

    return (
        <div className="main">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="page-title">Meetings</div>
                <div className="page-sub">{meetings.length} meetings recorded</div>
            </motion.div>

            {loading ? (
                <div className="empty-state">
                    <div className="empty-title">Loading...</div>
                </div>
            ) : meetings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 48 }}>
                    <div className="empty-title">No meetings yet</div>
                    <div className="empty-sub">Click + on the dashboard to add your first meeting</div>
                </div>
            ) : (
                <div className="meetings-layout">
                    <div className="meetings-list">
                        {meetings.map((m, i) => {
                            const count = commitments.filter(c => c.meeting_id === m.id).length;
                            return (
                                <motion.div
                                    key={m.id}
                                    className={`meeting-list-item ${selected?.id === m.id ? 'active' : ''}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
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
                    </div>

                    <AnimatePresence mode="wait">
                        {selected && (
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
                                            </div>
                                        </div>
                                        <div className="meeting-badge">
                                            {selectedCommitments.length} commitments
                                        </div>
                                    </div>
                                    {selectedCommitments.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-title">No commitments</div>
                                            <div className="empty-sub">Nothing was extracted from this meeting</div>
                                        </div>
                                    ) : (
                                        selectedCommitments.map((c, i) => (
                                            <CommitmentRow
                                                key={c.id}
                                                commitment={c}
                                                index={i}
                                                onUpdate={fetchData}
                                            />
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}