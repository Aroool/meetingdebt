import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const COLS = [
    { key: 'pending', label: 'Pending', color: '#f59e0b', bg: '#FAEEDA' },
    { key: 'overdue', label: 'Overdue', color: '#ef4444', bg: '#FCEBEB' },
    { key: 'blocked', label: 'Blocked', color: '#3b82f6', bg: '#E6F1FB' },
    { key: 'done', label: 'Done', color: '#16a34a', bg: '#EAF3DE' },
];

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

const avColors = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#ede9fe', color: '#7c3aed' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ffe4e6', color: '#be123c' },
    { bg: '#ccfbf1', color: '#0f766e' },
];

export default function LayoutB({ data, onOpenModal, onUpdate, onOpenPicker, currentLayout }) {
    const { commitments, meetings, loading, userName, workspaceName, total } = data;
    const [dragging, setDragging] = useState(null);
    const [hoveredCol, setHoveredCol] = useState(null);
    const navigate = useNavigate();

    const meetingsWithCount = meetings.map(m => ({
        ...m, commitmentCount: commitments.filter(c => c.meeting_id === m.id).length,
    }));

    async function handleDrop(colKey) {
        if (!dragging || getStatus(dragging) === colKey) { setDragging(null); setHoveredCol(null); return; }
        const statusMap = { pending: 'pending', overdue: 'overdue', blocked: 'blocked', done: 'completed' };
        try {
            await api.patch(`/commitments/${dragging.id}`, { status: statusMap[colKey] });
            onUpdate();
        } catch (err) { console.error(err); }
        setDragging(null);
        setHoveredCol(null);
    }

    function getInitials(name) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }
    function getAv(name) { return avColors[(name?.charCodeAt(0) || 0) % avColors.length]; }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '18px 24px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.8, marginBottom: 2 }}>
                        {userName ? `${userName}'s workspace` : 'Your workspace'}
                        {workspaceName && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>· {workspaceName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {total > 0 && <span style={{ marginLeft: 8 }}>· {total} commitments</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Meeting pills */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {meetingsWithCount.slice(0, 3).map(m => (
                            <motion.div key={m.id} whileHover={{ scale: 1.02 }}
                                onClick={() => navigate('/meetings', { state: { selectedMeetingId: m.id } })}
                                style={{
                                    padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                                    background: 'var(--bg)', border: '1px solid var(--border)',
                                    fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                📋 <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                                <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>{m.commitmentCount}</span>
                            </motion.div>
                        ))}
                    </div>
                    {/* Layout picker */}
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={onOpenPicker}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg)',
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
                            color: 'var(--text-muted)', fontWeight: 500,
                        }}
                    >
                        <span>⊞</span> Layout
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                            Kanban
                        </span>
                    </motion.button>
                </div>
            </div>

            {/* Board */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden' }}>
                {COLS.map((col, ci) => {
                    const tasks = commitments.filter(c => getStatus(c) === col.key);
                    const isHovered = hoveredCol === col.key;
                    return (
                        <div
                            key={col.key}
                            onDragOver={e => { e.preventDefault(); setHoveredCol(col.key); }}
                            onDragLeave={() => setHoveredCol(null)}
                            onDrop={() => handleDrop(col.key)}
                            style={{
                                borderRight: ci < 3 ? '1px solid var(--border)' : 'none',
                                display: 'flex', flexDirection: 'column', height: '100%',
                                background: isHovered ? col.bg + '30' : 'transparent',
                                transition: 'background 0.2s',
                            }}
                        >
                            <div style={{
                                padding: '14px 14px 10px', borderBottom: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {col.label}
                                    </span>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.bg, color: col.color }}>
                                    {tasks.length}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                                {loading ? (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '16px 4px' }}>Loading...</div>
                                ) : tasks.length === 0 ? (
                                    <div style={{
                                        border: '1px dashed var(--border)', borderRadius: 10,
                                        padding: '20px 12px', textAlign: 'center',
                                        fontSize: 11, color: 'var(--text-muted)',
                                    }}>
                                        No {col.label.toLowerCase()} tasks
                                    </div>
                                ) : tasks.map((c, i) => {
                                    const av = getAv(c.owner);
                                    const isDragging = dragging?.id === c.id;
                                    return (
                                        <motion.div
                                            key={c.id}
                                            layout
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.04 }}
                                            draggable
                                            onDragStart={() => setDragging(c)}
                                            onDragEnd={() => { setDragging(null); setHoveredCol(null); }}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: `1px solid ${col.key === 'overdue' ? '#ef444430' : 'var(--border)'}`,
                                                borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                                                cursor: 'grab', opacity: col.key === 'done' ? 0.65 : 1,
                                            }}
                                        >
                                            <div style={{
                                                fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                                                marginBottom: 8, lineHeight: 1.4,
                                                textDecoration: col.key === 'done' ? 'line-through' : 'none',
                                            }}>
                                                {c.task}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{
                                                    width: 18, height: 18, borderRadius: '50%',
                                                    background: av.bg, color: av.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 7, fontWeight: 800, flexShrink: 0,
                                                }}>
                                                    {getInitials(c.owner)}
                                                </div>
                                                <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.owner}
                                                </span>
                                                {c.deadline && (
                                                    <span style={{ fontSize: 9, color: col.key === 'overdue' ? '#ef4444' : 'var(--text-muted)', fontWeight: col.key === 'overdue' ? 700 : 400 }}>
                                                        {c.deadline}
                                                    </span>
                                                )}
                                            </div>
                                            {c.meeting_title && (
                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5, padding: '2px 6px', background: 'var(--bg)', borderRadius: 4, display: 'inline-block' }}>
                                                    📋 {c.meeting_title}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}