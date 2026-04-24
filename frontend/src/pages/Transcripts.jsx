import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import useIsMobile from '../hooks/useIsMobile';

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function TranscriptCard({ meeting, isOpen, onToggle }) {
    const wordCount = meeting.transcript ? meeting.transcript.trim().split(/\s+/).length : 0;
    const isPersonal = !meeting.workspace_id;

    return (
        <div style={{
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            transition: 'box-shadow 0.15s',
        }}>
            {/* Header */}
            <div
                onClick={onToggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                {/* Icon */}
                <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: isPersonal ? 'rgba(168,85,247,0.12)' : 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                }}>
                    📄
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 3,
                    }}>
                        {meeting.title || 'Untitled Meeting'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDate(meeting.created_at)} · {formatTime(meeting.created_at)}
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                            background: isPersonal ? 'rgba(168,85,247,0.12)' : 'var(--accent-light)',
                            color: isPersonal ? '#9333ea' : 'var(--accent-text)',
                        }}>
                            {isPersonal ? 'Personal' : 'Team'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {wordCount.toLocaleString()} words
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <div style={{
                    flexShrink: 0, color: 'var(--text-muted)', fontSize: 11,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                }}>
                    ▼
                </div>
            </div>

            {/* Transcript body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            borderTop: '1px solid var(--border)',
                            padding: '16px',
                            background: 'var(--bg)',
                        }}>
                            <pre style={{
                                margin: 0,
                                fontSize: 13, lineHeight: 1.8,
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                fontFamily: 'inherit',
                                maxHeight: 420, overflowY: 'auto',
                            }}>
                                {meeting.transcript}
                            </pre>
                            <div style={{
                                marginTop: 12, paddingTop: 12,
                                borderTop: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {wordCount.toLocaleString()} words · saved {formatDate(meeting.created_at)}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(meeting.transcript);
                                    }}
                                    style={{
                                        fontSize: 11, padding: '4px 12px', borderRadius: 6,
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-card)', color: 'var(--text-muted)',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'color 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-text)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Transcripts() {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState(null);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'team' | 'personal'
    const isMobile = useIsMobile();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const workspaceId = localStorage.getItem('workspaceId');
            const params = workspaceId ? { workspaceId } : {};
            const { data } = await api.get('/meetings', { params });
            // Only keep meetings that have a transcript saved
            const withTranscript = (data || []).filter(m => m.transcript && m.transcript.trim().length > 0);
            setMeetings(withTranscript);
        } catch (err) {
            console.error('Failed to load transcripts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handler = () => fetchData();
        window.addEventListener('workspaceSwitched', handler);
        return () => window.removeEventListener('workspaceSwitched', handler);
    }, [fetchData]);

    const filtered = meetings.filter(m => {
        const matchesTab =
            tab === 'all' ? true :
            tab === 'team' ? !!m.workspace_id :
            !m.workspace_id;
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            (m.title || '').toLowerCase().includes(q) ||
            (m.transcript || '').toLowerCase().includes(q);
        return matchesTab && matchesSearch;
    });

    const teamCount = meetings.filter(m => !!m.workspace_id).length;
    const personalCount = meetings.filter(m => !m.workspace_id).length;

    return (
        <div style={{
            minHeight: 'calc(100vh - 52px)',
            background: 'var(--bg)',
            padding: isMobile ? '20px 16px' : '28px 32px',
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Transcripts
                    </h1>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    All saved meeting transcripts — {meetings.length} total
                </p>
            </div>

            {/* Search + Tabs row */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                flexWrap: 'wrap', marginBottom: 20,
            }}>
                {/* Search */}
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by title or content..."
                    style={{
                        flex: 1, minWidth: 200,
                        fontSize: 13, padding: '8px 12px',
                        borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card)', color: 'var(--text-primary)',
                        fontFamily: 'inherit', outline: 'none',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />

                {/* Tabs */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'var(--bg-card)', borderRadius: 8,
                    border: '1px solid var(--border)', padding: 3,
                    flexShrink: 0,
                }}>
                    {[
                        { key: 'all', label: `All (${meetings.length})` },
                        { key: 'team', label: `Team (${teamCount})` },
                        { key: 'personal', label: `Personal (${personalCount})` },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                fontSize: 12, fontWeight: tab === t.key ? 600 : 500,
                                padding: '5px 12px', borderRadius: 6, border: 'none',
                                background: tab === t.key ? 'var(--accent-light)' : 'transparent',
                                color: tab === t.key ? 'var(--accent-text)' : 'var(--text-muted)',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: 70, borderRadius: 12,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            animation: 'pulse 1.4s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    color: 'var(--text-muted)',
                }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                        {search ? 'No transcripts match your search' : 'No transcripts saved yet'}
                    </div>
                    <div style={{ fontSize: 13 }}>
                        {search
                            ? 'Try a different keyword'
                            : 'When you create a meeting and paste a transcript, it gets saved here automatically.'
                        }
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(m => (
                        <TranscriptCard
                            key={m.id}
                            meeting={m}
                            isOpen={openId === m.id}
                            onToggle={() => setOpenId(prev => prev === m.id ? null : m.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
