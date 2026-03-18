import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CommitmentRow from '../components/CommitmentRow';
import API from '../config';

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
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/commitments`);
            setCommitments(res.data);
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

    return (
        <div className="main">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="page-title">All commitments</div>
                <div className="page-sub">
                    {commitments.length} total · {filtered.length} shown
                </div>
            </motion.div>

            <motion.div
                className="search-bar-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                <input
                    className="search-input"
                    placeholder="Search by task or person..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </motion.div>

            <div className="card" style={{ marginTop: 16 }}>
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
                        <div className="empty-title">No commitments found</div>
                        <div className="empty-sub">
                            {search ? 'Try a different search' : 'No commitments in this category'}
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
        </div>
    );
}