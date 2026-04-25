import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import api from '../../api';
import CommitmentRow from '../CommitmentRow';
import useIsMobile from '../../hooks/useIsMobile';

function parseDate(s) { if (!s) return null; const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }

// ─── Onboarding Empty State ────────────────────────────────────────────────────
function OnboardingEmptyState({ onOpenModal, currentRole }) {
    const steps = [
        { done: true,    icon: '✓', label: 'Account ready', sub: 'You\'re signed in and good to go' },
        { done: false,   icon: '2', label: 'Add your first meeting', sub: 'Paste a transcript and let AI extract tasks', cta: true },
        { done: false,   icon: '3', label: 'Track commitments', sub: 'Deadlines, assignees, overdue alerts — all automatic' },
    ];

    const howItWorks = [
        { icon: '📋', label: 'Paste transcript' },
        { icon: '🤖', label: 'AI extracts tasks' },
        { icon: '👤', label: 'Assign to team' },
        { icon: '⏰', label: 'Track deadlines' },
    ];

    return (
        <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Welcome */}
            <div style={{ textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ fontSize: 36, marginBottom: 10 }}
                >👋</motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Welcome to MeetingDebt
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        You're all set up. Let's track your first meeting.
                    </div>
                </motion.div>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 12,
                            border: `1px solid ${step.cta ? 'var(--accent)' : 'var(--border)'}`,
                            background: step.cta ? 'var(--accent-light)' : step.done ? 'transparent' : 'var(--bg)',
                            opacity: !step.done && !step.cta ? 0.45 : 1,
                        }}
                    >
                        {/* Step icon */}
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800,
                            background: step.done ? 'var(--accent)' : step.cta ? 'var(--accent)' : 'var(--border)',
                            color: step.done || step.cta ? '#fff' : 'var(--text-muted)',
                        }}>
                            {step.icon}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 12.5, fontWeight: 700,
                                color: step.cta ? 'var(--accent-text)' : 'var(--text-primary)',
                                marginBottom: 1,
                            }}>
                                {step.label}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {step.sub}
                            </div>
                        </div>

                        {/* CTA */}
                        {step.cta && currentRole !== 'member' && (
                            <button
                                onClick={onOpenModal}
                                style={{
                                    flexShrink: 0,
                                    padding: '6px 14px', borderRadius: 8,
                                    background: 'var(--accent)', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                                    transition: 'opacity 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                + New Meeting
                            </button>
                        )}

                        {step.done && (
                            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>Done</span>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* How it works */}
            <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, textAlign: 'center' }}>
                    How it works
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                    {howItWorks.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.07 }}
                                style={{ textAlign: 'center', padding: '0 8px' }}
                            >
                                <div style={{ fontSize: 20, marginBottom: 4 }}>{h.icon}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h.label}</div>
                            </motion.div>
                            {i < howItWorks.length - 1 && (
                                <div style={{ color: 'var(--border)', fontSize: 14, fontWeight: 300, flexShrink: 0 }}>→</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && parseDate(c.deadline) < new Date()) return 'overdue';
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

export default function LayoutA({ data, onUpdate, onOpenModal }) {
    const { commitments, members, loading, overdue, pending, blocked, done, total, currentRole } = data;

    const [filter, setFilter] = useState('All');
    const [personFilter, setPersonFilter] = useState(null);
    const [view, setView] = useState(localStorage.getItem('commitmentsView') || 'grouped');

    // Sync view when sidebar toggle dispatches event
    useEffect(() => {
        function handleViewChange() {
            setView(localStorage.getItem('commitmentsView') || 'grouped');
        }
        window.addEventListener('viewChanged', handleViewChange);
        return () => window.removeEventListener('viewChanged', handleViewChange);
    }, []);

    const [activity, setActivity] = useState([]);
    const [expandedMeetings, setExpandedMeetings] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const leftRef = useRef(null);
    const centerRef = useRef(null);
    const rightRef = useRef(null);
    const progressRefs = useRef([]);
    const hiddenAtRef = useRef(null);
    const hasAnimatedRef = useRef(!!sessionStorage.getItem('layoutA_animated'));
    const [columnsReady, setColumnsReady] = useState(hasAnimatedRef.current);
    const isMobile = useIsMobile();
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef(null);
    const filterMenuRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (filterOpen && !filterRef.current?.contains(e.target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [filterOpen]);

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
        if (hasAnimatedRef.current) {
            setColumnsReady(true);
            return;
        }
        hasAnimatedRef.current = true;
        sessionStorage.setItem('layoutA_animated', '1');

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl
                .fromTo(leftRef.current, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.42 })
                .fromTo(centerRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.42 }, '-=0.22')
                .fromTo(rightRef.current, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.42 }, '-=0.22')
                .eventCallback('onComplete', () => setColumnsReady(true));

            progressRefs.current.filter(Boolean).forEach((bar, i) => {
                gsap.fromTo(bar, { width: '0%' }, { width: bar.dataset.width, duration: 0.9, ease: 'power2.out', delay: 0.7 + i * 0.08 });
            });
        });
        return () => ctx.revert();
    }, [loading]);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key !== 'Escape') return;
            if (deleteConfirm) setDeleteConfirm(null);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteConfirm]);

    useEffect(() => {
        if (!deleteConfirm) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [deleteConfirm]);

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
        return parseDate(c.deadline).toDateString() === new Date().toDateString();
    }).slice(0, 5);

    const filtered = commitments.filter(c => {
        if (personFilter === '__unassigned__') return !c.assigned_to && !c.owner && getStatus(c) !== 'done';
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
        <div className="layoutA-outer" style={{ height: isMobile ? 'auto' : '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: isMobile ? 'visible' : 'hidden' }}>
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
                }
                @media (max-width: 767px) {
                    .layoutA-outer {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .layoutA-grid {
                        overflow: visible !important;
                        height: auto !important;
                        padding: 12px 16px 20px !important;
                        gap: 12px !important;
                    }
                    .layoutA-col {
                        overflow: visible !important;
                    }
                }
            `}</style>

            <DeleteMeetingModal
                deleteConfirm={deleteConfirm}
                deleting={deleting}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={() => handleDeleteMeeting(deleteConfirm)}
            />

            <div className="layoutA-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 320px', gap: 16, padding: isMobile ? '12px 16px 20px' : '16px 24px 18px', overflow: isMobile ? 'visible' : 'hidden', minHeight: 0, height: isMobile ? 'auto' : undefined }}>
                <div ref={leftRef} className="layoutA-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: isMobile ? 'visible' : 'hidden', opacity: columnsReady ? 1 : 0, minHeight: 0 }}>
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
                        {/* Unassigned pill — only truly unassigned (no owner name and no linked user) */}
                        {(() => {
                            const unassignedCount = commitments.filter(c => !c.assigned_to && !c.owner && getStatus(c) !== 'done').length;
                            return unassignedCount > 0 ? (
                                <div
                                    onClick={() => setPersonFilter(personFilter === '__unassigned__' ? null : '__unassigned__')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 12, cursor: 'pointer', background: personFilter === '__unassigned__' ? 'var(--red-light)' : 'var(--bg)', border: '1px solid var(--border)', marginBottom: 8, transition: 'all 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0 }}>?</div>
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: personFilter === '__unassigned__' ? 'var(--red)' : 'var(--text-muted)', flex: 1 }}>Unassigned</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)' }}>{unassignedCount}</span>
                                </div>
                            ) : null;
                        })()}

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

                <div ref={centerRef} className="layoutA-col" style={{ ...card(), display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden', opacity: columnsReady ? 1 : 0, minHeight: 0 }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>Commitments</span>
                        <div ref={filterRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setFilterOpen(v => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '5px 12px', borderRadius: 8,
                                    border: '1px solid var(--border)', background: filter !== 'All' ? 'var(--accent-light)' : 'var(--bg)',
                                    color: filter !== 'All' ? 'var(--accent-text)' : 'var(--text-muted)',
                                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {filter}
                                <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
                            </button>

                            {filterOpen && (
                                <div
                                    ref={filterMenuRef}
                                    style={{
                                        position: 'absolute', top: '110%', right: 0, zIndex: 999,
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: 10, padding: 4, minWidth: 140,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    {[
                                        { key: 'All', count: commitments.length, color: null },
                                        { key: 'Overdue', count: overdue, color: 'var(--red)' },
                                        { key: 'Pending', count: pending, color: 'var(--amber)' },
                                        { key: 'Done', count: done, color: 'var(--accent-text)' },
                                    ].map(f => (
                                        <div key={f.key}
                                            onClick={() => { setFilter(f.key); setFilterOpen(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                                                background: filter === f.key ? 'var(--accent-light)' : 'transparent',
                                                fontSize: 12, color: 'var(--text-primary)', transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.background = 'var(--bg)'; }}
                                            onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span style={{ fontWeight: filter === f.key ? 700 : 500 }}>{f.key}</span>
                                            {f.count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: f.color || 'var(--text-muted)' }}>{f.count}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {personFilter && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-light)', borderRadius: 999, padding: '5px 10px' }}>
                                <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 700 }}>{personFilter}</span>
                                <button onClick={() => setPersonFilter(null)} style={{ fontSize: 14, color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: 0, lineHeight: 1 }}>×</button>
                            </div>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} tasks</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.01), transparent 80px)' }}>
                        {loading ? (
                            <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                Loading...
                            </div>
                        ) : filtered.length === 0 ? (
                            /* Show full onboarding guide when truly empty (no filter active),
                               otherwise show a simple "no results" message */
                            filter === 'All' && !personFilter && commitments.length === 0 ? (
                                <OnboardingEmptyState onOpenModal={onOpenModal} currentRole={currentRole} />
                            ) : (
                                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                    <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {personFilter ? `No tasks for ${personFilter}` : `No ${filter.toLowerCase()} tasks`}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {personFilter ? 'Try a different team member' : 'Try a different filter'}
                                    </div>
                                </div>
                            )
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

                    {/* New Meeting button — hidden during onboarding (it already has a CTA) */}
                    {currentRole !== 'member' && onOpenModal && commitments.length > 0 && (
                        <div style={{
                            flexShrink: 0,
                            padding: '10px 16px 14px',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>
                            <button
                                onClick={onOpenModal}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 22px',
                                    borderRadius: 10,
                                    border: '1px solid var(--accent)',
                                    background: 'var(--accent-light)',
                                    color: 'var(--accent-text)',
                                    fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'background 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,163,74,0.25)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-text)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                                New Meeting
                            </button>
                        </div>
                    )}
                </div>

                <div ref={rightRef} className="layoutA-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: isMobile ? 'visible' : 'hidden', opacity: columnsReady ? 1 : 0, minHeight: 0 }}>
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
