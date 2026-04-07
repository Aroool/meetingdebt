import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import api from '../../api';
import CommitmentRow from '../CommitmentRow';

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

function timeAgo(d) {
    if (!d) return 'recently';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return 'recently';
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const dy = Math.floor(h / 24);
    if (dy > 0) return `${dy}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
}

function formatHeaderDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

const avPalette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
function avColor(name) {
    return avPalette[(name?.charCodeAt(0) || 0) % avPalette.length];
}
function initials(name) {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function ActivityItem({ item }) {
    const map = {
        status_changed: { icon: '✓', bg: 'var(--accent-light)', color: 'var(--accent-text)' },
        task_reassigned: { icon: '↻', bg: 'var(--blue-light)', color: 'var(--blue)' },
        meeting_created: { icon: '+', bg: '#ede9fe', color: '#8b5cf6' },
        member_invited: { icon: '→', bg: 'var(--amber-light)', color: 'var(--amber)' },
        nudge_sent: { icon: '!', bg: 'var(--red-light)', color: 'var(--red)' },
    };
    const s = map[item?.type] || { icon: '·', bg: 'var(--bg)', color: 'var(--text-muted)' };

    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)', minHeight: 54 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    <strong style={{ fontWeight: 700 }}>{item?.actor_name || 'Someone'}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{item?.message || 'updated the workspace'}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{timeAgo(item?.created_at)}</div>
            </div>
        </div>
    );
}

function TaskFocusItem({ c }) {
    const status = getStatus(c);
    const isOverdue = status === 'overdue';

    return (
        <div
            style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 12,
                background: isOverdue ? 'var(--red-light)' : 'var(--bg)',
                border: `1px solid ${isOverdue ? 'var(--red)30' : 'var(--border)'}`,
                marginBottom: 8,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                cursor: 'default',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: avColor(c?.owner) + '20', color: avColor(c?.owner), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                {initials(c?.owner)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c?.task || 'Untitled task'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c?.owner || 'Unassigned'}</div>
            </div>
            <div style={{ height: 22, padding: '0 10px', borderRadius: 999, background: isOverdue ? 'var(--red-light)' : 'var(--amber-light)', color: isOverdue ? 'var(--red)' : 'var(--amber)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', border: `1px solid ${isOverdue ? 'var(--red)' : 'var(--amber)'}20` }}>
                {isOverdue ? 'Overdue' : 'Today'}
            </div>
        </div>
    );
}

function ProfilePopup({ userName, currentRole, workspaceName, onClose }) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99,
                    background: 'rgba(15, 23, 42, 0.12)',
                    backdropFilter: 'blur(6px)',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: 56,
                    left: 0,
                    zIndex: 100,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: 20,
                    width: 252,
                    boxShadow: '0 18px 44px rgba(0,0,0,0.14)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--accent-light)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>
                        {userName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'User'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{currentRole || 'member'}</div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Workspace</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{workspaceName || 'Personal'}</div>
                </div>
            </motion.div>
        </>
    );
}

function DeleteMeetingModal({ deleteConfirm, deleting, onCancel, onConfirm }) {
    return (
        <AnimatePresence>
            {deleteConfirm && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.38)',
                            zIndex: 98,
                            backdropFilter: 'blur(4px)',
                        }}
                    />

                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            padding: 20,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                width: 'min(372px, 100%)',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 20,
                                padding: 24,
                                boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
                                pointerEvents: 'auto',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>Delete this meeting?</div>
                            <div style={{ fontSize: 12.5, color: 'var(--red)', marginBottom: 20, padding: '10px 12px', background: 'var(--red-light)', borderRadius: 12, lineHeight: 1.6 }}>
                                This will permanently delete the meeting and all of its commitments.
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={onCancel}
                                    style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-primary)', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={deleting}
                                    style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete meeting'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function LayoutA({ data, onUpdate, onOpenPicker }) {
    const { commitments, members, loading, overdue, pending, blocked, done, total, userName, workspaceName, currentRole } = data;

    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'grouped');
    const [activity, setActivity] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [expandedMeetings, setExpandedMeetings] = useState(new Set());
    const expandInitialized = useRef(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const headerRef = useRef(null);
    const leftRef = useRef(null);
    const centerRef = useRef(null);
    const rightRef = useRef(null);
    const progressRefs = useRef([]);
    const hiddenAtRef = useRef(null);
    const hasAnimatedRef = useRef(!!sessionStorage.getItem('layoutA_animated'));

    useEffect(() => {
        function handleVisibility() {
            if (document.hidden) {
                hiddenAtRef.current = Date.now();
            } else {
                const awayMs = Date.now() - (hiddenAtRef.current || 0);
                if (awayMs >= 2 * 60 * 1000) {
                    hasAnimatedRef.current = false;
                    sessionStorage.removeItem('layoutA_animated');
                }
            }
        }
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    useEffect(() => {
        if (expandInitialized.current || commitments.length === 0) return;
        expandInitialized.current = true;
        const ids = new Set(commitments.map(c => c.meeting_id).filter(Boolean));
        setExpandedMeetings(ids);
    }, [commitments]);

    useEffect(() => {
        let ignore = false;
        const workspaceId = localStorage.getItem('workspaceId');
        if (!workspaceId) {
            setActivity([]);
            return () => { ignore = true; };
        }

        api.get(`/activity?workspaceId=${workspaceId}&limit=10`)
            .then(r => {
                if (!ignore) setActivity(Array.isArray(r.data) ? r.data : []);
            })
            .catch(() => {
                if (!ignore) setActivity([]);
            });

        return () => {
            ignore = true;
        };
    }, [commitments]);

    useEffect(() => {
        if (loading) return;
        if (hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        sessionStorage.setItem('layoutA_animated', '1');

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl
                .fromTo(headerRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.42 })
                .fromTo(leftRef.current, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.42 }, '-=0.22')
                .fromTo(centerRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.42 }, '-=0.32')
                .fromTo(rightRef.current, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.42 }, '-=0.32');

            progressRefs.current.filter(Boolean).forEach((bar, i) => {
                gsap.fromTo(bar, { width: '0%' }, { width: bar.dataset.width, duration: 0.9, ease: 'power2.out', delay: 0.7 + i * 0.08 });
            });
        });
        return () => ctx.revert();
    }, [loading]);

    useEffect(() => {
        if (loading) return;
        if (!hasAnimatedRef.current) return;
        [headerRef, leftRef, centerRef, rightRef].forEach(ref => {
            if (ref.current) ref.current.style.opacity = '1';
        });
    }, [loading]);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key !== 'Escape') return;
            if (deleteConfirm) {
                setDeleteConfirm(null);
                return;
            }
            if (showProfile) {
                setShowProfile(false);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteConfirm, showProfile]);

    useEffect(() => {
        if (!deleteConfirm && !showProfile) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [deleteConfirm, showProfile]);

    function toggleMeeting(id) {
        setExpandedMeetings(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function handleDeleteMeeting(meetingId) {
        if (!meetingId) return;
        setDeleting(true);
        try {
            await api.delete(`/meetings/${meetingId}`);
            setDeleteConfirm(null);
            onUpdate();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    }

    const todayTasks = commitments.filter(c => {
        const s = getStatus(c);
        if (s === 'done') return false;
        if (s === 'overdue') return true;
        if (!c.deadline) return false;
        return new Date(c.deadline).toDateString() === new Date().toDateString();
    }).slice(0, 5);

    const filtered = commitments.filter(c => {
        if (personFilter && c.owner !== personFilter) return false;
        if (filter === 'All') return true;
        const s = getStatus(c);
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Pending') return s === 'pending';
        if (filter === 'Done') return s === 'done';
        return true;
    });

    const topPeople = Object.values(
        commitments.reduce((acc, c) => {
            if (!c.owner) return acc;
            if (!acc[c.owner]) acc[c.owner] = { name: c.owner, pending: 0, overdue: 0, done: 0 };
            const s = getStatus(c);
            if (s === 'pending') acc[c.owner].pending++;
            if (s === 'overdue') acc[c.owner].overdue++;
            if (s === 'done') acc[c.owner].done++;
            return acc;
        }, {})
    ).sort((a, b) => (b.overdue * 2 + b.pending) - (a.overdue * 2 + a.pending)).slice(0, 5);

    const groupedCommitments = Object.entries(
        filtered.reduce((acc, c) => {
            const key = c.meeting_id || 'no-meeting';
            const title = c.meetings?.title || c.meeting_title || 'Untitled Meeting';
            if (!acc[key]) acc[key] = { title, items: [] };
            acc[key].items.push(c);
            return acc;
        }, {})
    );

    const card = (extra = {}) => ({
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        boxShadow: '0 10px 28px rgba(0,0,0,0.04)',
        ...extra,
    });

    const sectionLabel = () => ({
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginBottom: 14,
    });

    const statPills = [
        { label: 'Pending', value: pending, color: 'var(--amber)', bg: 'var(--amber-light)' },
        { label: 'Overdue', value: overdue, color: 'var(--red)', bg: 'var(--red-light)' },
        { label: 'Blocked', value: blocked, color: 'var(--blue)', bg: 'var(--blue-light)' },
        { label: 'Done', value: done, color: 'var(--accent-text)', bg: 'var(--accent-light)' },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
            <style>{`
                @media (max-width: 1180px) {
                    .layoutA-grid {
                        grid-template-columns: 250px minmax(0, 1fr) 280px !important;
                    }
                }
                @media (max-width: 1024px) {
                    .layoutA-grid {
                        grid-template-columns: 1fr !important;
                        overflow-y: auto !important;
                        padding-right: 18px !important;
                    }
                    .layoutA-col {
                        min-height: auto !important;
                    }
                    .layoutA-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 14px !important;
                    }
                    .layoutA-header-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
                @media (max-width: 640px) {
                    .layoutA-header-actions {
                        flex-wrap: wrap;
                    }
                }
            `}</style>

            <DeleteMeetingModal
                deleteConfirm={deleteConfirm}
                deleting={deleting}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={() => handleDeleteMeeting(deleteConfirm)}
            />

            <div
                ref={headerRef}
                className="layoutA-header"
                style={{
                    ...card(),
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    padding: '14px 24px',
                    flexShrink: 0,
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', minWidth: 0 }}>
                    <div
                        onClick={() => setShowProfile(v => !v)}
                        style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: 'var(--accent-text)', cursor: 'pointer', transition: 'transform 0.15s ease, opacity 0.15s ease', border: '1px solid var(--border)', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {userName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>

                    <AnimatePresence>
                        {showProfile && (
                            <ProfilePopup
                                userName={userName}
                                currentRole={currentRole}
                                workspaceName={workspaceName}
                                onClose={() => setShowProfile(false)}
                            />
                        )}
                    </AnimatePresence>

                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {userName ? `${userName}'s workspace` : 'Your workspace'}
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8 }}>· {workspaceName || 'Personal'}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>{formatHeaderDate()}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                {currentRole || 'manager'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="layoutA-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        onClick={onOpenPicker}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--accent)50';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--text-muted)', transition: 'border-color 0.15s ease, transform 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    >
                        ⊞
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent-text)' }}>Command</span>
                    </button>

                    <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        {[{ key: 'grouped', icon: '⊞' }, { key: 'flat', icon: '☰' }].map(v => (
                            <button
                                key={v.key}
                                onClick={() => {
                                    setView(v.key);
                                    localStorage.setItem('commitmentsView', v.key);
                                }}
                                style={{
                                    padding: '6px 11px',
                                    borderRadius: 9,
                                    border: 'none',
                                    background: view === v.key ? 'var(--bg-card)' : 'transparent',
                                    color: view === v.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: 'inherit',
                                    boxShadow: view === v.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.15s ease',
                                    fontWeight: view === v.key ? 700 : 500,
                                }}
                            >
                                {v.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="layoutA-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 320px', gap: 16, padding: '16px 24px 18px', overflow: 'hidden', minHeight: 0 }}>
                <div ref={leftRef} className="layoutA-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', opacity: 0, minHeight: 0 }}>
                    <div style={{ ...card({ padding: 18 }), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                            Today's Focus
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{todayTasks.length} tasks</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                            {todayTasks.length === 0 ? (
                                <div style={{ padding: '34px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>All clear</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nothing due today</div>
                                </div>
                            ) : todayTasks.map(c => <TaskFocusItem key={c.id} c={c} />)}
                        </div>
                    </div>

                    <div style={{ ...card({ padding: 18 }), flexShrink: 0 }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                            Accountability
                        </div>
                        {topPeople.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>No team data yet</div>
                        ) : topPeople.map((p, i) => {
                            const t = p.pending + p.overdue + p.done;
                            const pct = t ? Math.round((p.done / t) * 100) : 0;
                            const isActive = personFilter === p.name;
                            return (
                                <div
                                    key={p.name}
                                    onClick={() => setPersonFilter(isActive ? null : p.name)}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'var(--bg)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                    style={{ padding: '8px 10px', borderRadius: 12, cursor: 'pointer', background: isActive ? 'var(--accent-light)' : 'transparent', transition: 'background 0.15s ease, transform 0.15s ease', marginBottom: 6 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: avColor(p.name) + '20', color: avColor(p.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, flexShrink: 0 }}>
                                            {initials(p.name)}
                                        </div>
                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                        {p.overdue > 0 && <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 800 }}>{p.overdue} late</span>}
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                        <div
                                            ref={el => progressRefs.current[i] = el}
                                            data-width={`${pct}%`}
                                            style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: '0%' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div ref={centerRef} className="layoutA-col" style={{ ...card(), display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: 0, minHeight: 0 }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginRight: 4 }}>Commitments</span>
                        {['All', 'Overdue', 'Pending', 'Done'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: filter === f ? 'var(--accent-light)' : 'transparent',
                                    color: filter === f ? 'var(--accent-text)' : 'var(--text-muted)',
                                    fontWeight: filter === f ? 700 : 500,
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {f}
                                {f === 'Overdue' && overdue > 0 && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 800, color: 'var(--red)' }}>{overdue}</span>}
                                {f === 'Pending' && pending > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{pending}</span>}
                                {f === 'Done' && done > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{done}</span>}
                            </button>
                        ))}
                        {personFilter && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', borderRadius: 999, padding: '5px 10px' }}>
                                <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 700 }}>{personFilter}</span>
                                <button onClick={() => setPersonFilter(null)} style={{ fontSize: 14, color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: 0, lineHeight: 1 }}>×</button>
                            </div>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} tasks</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.01), transparent 80px)' }}>
                        {loading ? (
                            <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                Loading...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '72px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    {personFilter ? `No tasks for ${personFilter}` : filter === 'All' ? 'No commitments yet' : `No ${filter.toLowerCase()} tasks`}
                                </div>
                                {filter === 'All' && !personFilter && (
                                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                                        Click + to add your first meeting
                                    </div>
                                )}
                            </div>
                        ) : view === 'flat' ? (
                            <div
                                style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    background: 'var(--bg-card)',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
                                }}
                            >
                                {filtered.map((c, i) => (
                                    <CommitmentRow
                                        key={c.id}
                                        commitment={c}
                                        index={i}
                                        onUpdate={onUpdate}
                                        members={members}
                                        commitments={commitments}
                                    />
                                ))}
                            </div>
                        ) : (
                            groupedCommitments.map(([mid, group]) => {
                                const gDone = group.items.filter(c => getStatus(c) === 'done').length;
                                const gOverdue = group.items.filter(c => getStatus(c) === 'overdue').length;
                                const isExpanded = expandedMeetings.has(mid);

                                return (
                                    <div key={mid} style={{ marginBottom: 14 }}>
                                        <div
                                            onClick={() => toggleMeeting(mid)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '13px 14px',
                                                borderRadius: 16,
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease, transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                                border: '1px solid var(--border)',
                                                background: isExpanded ? 'var(--bg)' : 'var(--bg-card)',
                                                boxShadow: isExpanded
                                                    ? '0 8px 22px rgba(0,0,0,0.03)'
                                                    : '0 3px 10px rgba(0,0,0,0.02)',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.borderColor = 'var(--border-hover)';
                                                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.05)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.boxShadow = isExpanded
                                                    ? '0 8px 22px rgba(0,0,0,0.03)'
                                                    : '0 3px 10px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 10,
                                                    border: '1px solid var(--border)',
                                                    background: isExpanded ? 'var(--accent-light)' : 'var(--bg)',
                                                    color: isExpanded ? 'var(--accent-text)' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 0.18s ease',
                                                    fontSize: 12,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease',
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    ›
                                                </div>
                                            </div>

                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 800,
                                                        color: 'var(--text-primary)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {group.title}
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        marginTop: 4,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                        {group.items.length} commitment{group.items.length !== 1 ? 's' : ''}
                                                    </span>

                                                    {gOverdue > 0 && (
                                                        <span
                                                            style={{
                                                                fontSize: 10.5,
                                                                fontWeight: 800,
                                                                padding: '3px 8px',
                                                                borderRadius: 999,
                                                                background: 'var(--red-light)',
                                                                color: 'var(--red)',
                                                            }}
                                                        >
                                                            {gOverdue} late
                                                        </span>
                                                    )}

                                                    {gDone > 0 && (
                                                        <span
                                                            style={{
                                                                fontSize: 10.5,
                                                                fontWeight: 800,
                                                                padding: '3px 8px',
                                                                borderRadius: 999,
                                                                background: 'var(--accent-light)',
                                                                color: 'var(--accent-text)',
                                                            }}
                                                        >
                                                            {gDone} done
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        padding: '5px 10px',
                                                        borderRadius: 999,
                                                        background: isExpanded ? 'var(--accent-light)' : 'var(--bg)',
                                                        color: isExpanded ? 'var(--accent-text)' : 'var(--text-muted)',
                                                        border: '1px solid var(--border)',
                                                    }}
                                                >
                                                    {group.items.length}
                                                </span>

                                                {mid !== 'no-meeting' && currentRole === 'manager' && (
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setDeleteConfirm(mid);
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'var(--red-light)';
                                                            e.currentTarget.style.color = 'var(--red)';
                                                            e.currentTarget.style.borderColor = 'var(--red)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = 'var(--text-muted)';
                                                            e.currentTarget.style.borderColor = 'var(--border)';
                                                        }}
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 10,
                                                            border: '1px solid var(--border)',
                                                            background: 'transparent',
                                                            color: 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.15s ease',
                                                            fontFamily: 'inherit',
                                                            flexShrink: 0,
                                                        }}
                                                        title="Delete meeting"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ height: 10 }} />
                                                    <div
                                                        style={{
                                                            border: '1px solid var(--border)',
                                                            borderRadius: 16,
                                                            overflow: 'hidden',
                                                            background: 'var(--bg-card)',
                                                            boxShadow: '0 8px 22px rgba(0,0,0,0.03)',
                                                        }}
                                                    >
                                                        {group.items.map((c, i) => (
                                                            <CommitmentRow
                                                                key={c.id}
                                                                commitment={c}
                                                                index={i}
                                                                onUpdate={onUpdate}
                                                                members={members}
                                                                commitments={commitments}
                                                            />
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div ref={rightRef} className="layoutA-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden', opacity: 0, minHeight: 0 }}>
                    <div style={{ ...card({ padding: 18 }), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                            Activity
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                            {activity.length === 0 ? (
                                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>No activity yet</div>
                                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Actions will appear here</div>
                                </div>
                            ) : activity.map(a => <ActivityItem key={a.id} item={a} />)}
                        </div>
                    </div>

                    <div style={{ ...card({ padding: 18 }), flexShrink: 0 }}>
                        <div style={sectionLabel()}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
                            Status
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                            {statPills.map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>{s.label}</span>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: s.value > 0 ? s.color : 'var(--text-muted)', lineHeight: 1 }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
                                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-text)', lineHeight: 1 }}>{done}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {total} tasks completed</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 999, width: total > 0 ? `${Math.round(done / total * 100)}%` : '0%', transition: 'width 1s ease' }} />
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{total > 0 ? Math.round(done / total * 100) : 0}% completion rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
