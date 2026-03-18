import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API from '../config';

const STATUSES = [
    { key: 'pending', label: 'Pending', cls: 'pill-amber' },
    { key: 'completed', label: 'Done', cls: 'pill-green' },
    { key: 'blocked', label: 'Blocked', cls: 'pill-blue' },
    { key: 'overdue', label: 'Overdue', cls: 'pill-red' },
];

const avatarColors = ['av-blue', 'av-purple', 'av-amber', 'av-rose', 'av-teal', 'av-green'];

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
    if (!name) return avatarColors[0];
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

function getStatus(commitment) {
    if (commitment.status === 'completed') return 'completed';
    if (commitment.status === 'blocked') return 'blocked';
    if (commitment.status === 'overdue') return 'overdue';
    if (commitment.deadline) {
        const due = new Date(commitment.deadline);
        if (!isNaN(due) && due < new Date()) return 'overdue';
    }
    return 'pending';
}

function getPillConfig(status) {
    switch (status) {
        case 'completed': return { label: 'Done', cls: 'pill-green' };
        case 'blocked': return { label: 'Blocked', cls: 'pill-blue' };
        case 'overdue': return { label: 'Overdue', cls: 'pill-red' };
        default: return { label: 'Pending', cls: 'pill-amber' };
    }
}

export default function CommitmentRow({ commitment, index, onUpdate }) {
    const [localStatus, setLocalStatus] = useState(getStatus(commitment));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function changeStatus(newStatus) {
        setDropdownOpen(false);
        setSaving(true);
        setLocalStatus(newStatus);
        try {
            await axios.patch(`${API}/commitments/${commitment.id}`, {
                status: newStatus
            });
            onUpdate && onUpdate();
        } catch (err) {
            console.error(err);
            setLocalStatus(getStatus(commitment));
        } finally {
            setSaving(false);
        }
    }

    const config = getPillConfig(localStatus);
    const initials = getInitials(commitment.owner);
    const avatarCls = getAvatarColor(commitment.owner);

    return (
        <motion.div
            className="commitment-row"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ opacity: localStatus === 'completed' ? 0.65 : 1 }}
        >
            <div className={`avatar ${avatarCls}`}>{initials}</div>

            <div className="commit-info">
                <div className="commit-task" style={{
                    textDecoration: localStatus === 'completed' ? 'line-through' : 'none'
                }}>
                    {commitment.task}
                </div>
                <div className="commit-meta">
                    {commitment.owner} · {commitment.deadline || 'No deadline'}
                </div>
            </div>

            <div className="commit-right" ref={dropdownRef} style={{ position: 'relative' }}>
                <motion.span
                    className={`pill ${config.cls}`}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.15, type: 'spring', stiffness: 300 }}
                >
                    {saving ? '...' : config.label}
                    <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
                </motion.span>

                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div
                            className="status-dropdown"
                            initial={{ opacity: 0, scale: 0.92, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {STATUSES.map(s => (
                                <div
                                    key={s.key}
                                    className={`status-option ${localStatus === s.key ? 'active' : ''}`}
                                    onClick={() => changeStatus(s.key)}
                                >
                                    <span className={`pill ${s.cls}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                                        {s.label}
                                    </span>
                                    {localStatus === s.key && (
                                        <span style={{ fontSize: 11, color: 'var(--accent)' }}>✓</span>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}