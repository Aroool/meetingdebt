import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import api from '../api';

function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

function isToday(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isTomorrow(dateStr) {
    if (!dateStr) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(dateStr).toDateString() === tomorrow.toDateString();
}

function formatDeadline(dateStr) {
    if (!dateStr) return null;
    if (isToday(dateStr)) return 'Today';
    if (isTomorrow(dateStr)) return 'Tomorrow';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ task: '', deadline: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState('All');
    const headerRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(headerRef.current,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
            gsap.fromTo(listRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.15 }
            );
        });
        return () => ctx.revert();
    }, [loading]);

    async function fetchTasks() {
        try {
            const res = await api.get('/personal-tasks');
            setTasks(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleAdd(e) {
        e.preventDefault();
        if (!form.task.trim()) return;
        setSaving(true);
        try {
            const workspaceId = localStorage.getItem('workspaceId');
            await api.post('/personal-tasks', {
                task: form.task.trim(),
                deadline: form.deadline || null,
                notes: form.notes.trim() || null,
                workspaceId,
            });
            setForm({ task: '', deadline: '', notes: '' });
            setShowAdd(false);
            await fetchTasks();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    async function toggleDone(task) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            await api.patch(`/commitments/${task.id}`, { status: newStatus });
            await fetchTasks();
        } catch (err) { console.error(err); }
    }

    async function deleteTask(id) {
        try {
            await api.delete(`/personal-tasks/${id}`);
            await fetchTasks();
        } catch (err) { console.error(err); }
    }

    const filtered = tasks.filter(t => {
        if (filter === 'All') return true;
        const s = getStatus(t);
        if (filter === 'Today') return isToday(t.deadline) && s !== 'done';
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Done') return s === 'done';
        return true;
    });

    const overdue = tasks.filter(t => getStatus(t) === 'overdue').length;
    const todayCount = tasks.filter(t => isToday(t.deadline) && getStatus(t) !== 'done').length;
    const done = tasks.filter(t => getStatus(t) === 'done').length;

    const card = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', padding: '24px 32px' }}>

            {/* Header */}
            <div ref={headerRef} style={{ opacity: 0, marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
                        My Tasks
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Personal tasks — private to you only
                    </div>
                </div>
                <button
                    onClick={() => setShowAdd(v => !v)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 9,
                        background: 'var(--accent)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    + New Task
                </button>
            </div>

            {/* Add task form */}
            {showAdd && (
                <div style={{ ...card, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                        New personal task
                    </div>
                    <form onSubmit={handleAdd}>
                        <div style={{ marginBottom: 12 }}>
                            <input
                                autoFocus
                                placeholder="What do you need to do?"
                                value={form.task}
                                onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 8,
                                    border: '1px solid var(--border)', background: 'var(--bg)',
                                    fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Deadline
                                </div>
                                <input
                                    type="datetime-local"
                                    value={form.deadline}
                                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                    style={{
                                        width: '100%', padding: '9px 12px', borderRadius: 8,
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Notes
                                </div>
                                <input
                                    placeholder="Optional notes..."
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    style={{
                                        width: '100%', padding: '9px 12px', borderRadius: 8,
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="submit" disabled={saving || !form.task.trim()}
                                style={{
                                    padding: '8px 20px', borderRadius: 8,
                                    background: form.task.trim() ? 'var(--accent)' : 'var(--border)',
                                    color: form.task.trim() ? '#fff' : 'var(--text-muted)',
                                    border: 'none', cursor: form.task.trim() ? 'pointer' : 'default',
                                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}>
                                {saving ? 'Saving...' : 'Add Task'}
                            </button>
                            <button type="button" onClick={() => { setShowAdd(false); setForm({ task: '', deadline: '', notes: '' }); }}
                                style={{
                                    padding: '8px 16px', borderRadius: 8,
                                    background: 'transparent', color: 'var(--text-muted)',
                                    border: '1px solid var(--border)', cursor: 'pointer',
                                    fontSize: 13, fontFamily: 'inherit',
                                }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div ref={listRef} style={{ opacity: 0, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

                {/* Main task list */}
                <div>
                    {/* Filter bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        {[
                            { key: 'All', label: `All ${tasks.length}` },
                            { key: 'Today', label: `Today ${todayCount}` },
                            { key: 'Overdue', label: `Overdue ${overdue}` },
                            { key: 'Done', label: `Done ${done}` },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                style={{
                                    padding: '5px 14px', borderRadius: 999, border: 'none',
                                    background: filter === f.key ? 'var(--accent-light)' : 'transparent',
                                    color: filter === f.key ? 'var(--accent-text)' : 'var(--text-muted)',
                                    fontWeight: filter === f.key ? 700 : 400,
                                    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                                    transition: 'all 0.15s',
                                }}>{f.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '64px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                                {filter === 'All' ? 'No personal tasks yet' : `No ${filter.toLowerCase()} tasks`}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {filter === 'All' ? 'Click + New Task to add one' : 'You are all caught up'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...card, overflow: 'hidden' }}>
                            {filtered.map((t, i) => {
                                const s = getStatus(t);
                                const isDone = s === 'done';
                                const isOver = s === 'overdue';
                                const isExpanded = expandedId === t.id;

                                const pillStyle = {
                                    done: { bg: 'var(--accent-light)', color: 'var(--accent-text)' },
                                    overdue: { bg: 'var(--red-light)', color: 'var(--red)' },
                                    pending: { bg: 'var(--amber-light)', color: 'var(--amber)' },
                                };
                                const pill = pillStyle[s] || pillStyle.pending;

                                return (
                                    <div key={t.id} style={{
                                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                                        background: isOver && !isDone ? 'var(--red-light)' : 'transparent',
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '13px 16px', transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => { if (!isOver) e.currentTarget.style.background = 'var(--bg)'; }}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                onClick={() => toggleDone(t)}
                                                style={{
                                                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                                    border: isDone ? 'none' : '1.5px solid var(--border)',
                                                    background: isDone ? 'var(--accent)' : 'transparent',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {isDone && (
                                                    <svg width="10" height="10" viewBox="0 0 10 10">
                                                        <polyline points="2,5 4,7 8,3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Task info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 13, fontWeight: 500,
                                                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                                    textDecoration: isDone ? 'line-through' : 'none',
                                                    marginBottom: 2,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {t.task}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                                                    {t.deadline && (
                                                        <span style={{ color: isOver && !isDone ? 'var(--red)' : 'var(--text-muted)', fontWeight: isOver && !isDone ? 600 : 400 }}>
                                                            {formatDeadline(t.deadline)}
                                                            {t.deadline.includes('T') && (
                                                                <span style={{ marginLeft: 4 }}>
                                                                    {new Date(t.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {t.notes && (
                                                        <span
                                                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                                            style={{ cursor: 'pointer', color: 'var(--accent-text)', fontSize: 11 }}
                                                        >
                                                            {isExpanded ? 'Hide notes' : 'Show notes'}
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpanded && t.notes && (
                                                    <div style={{
                                                        marginTop: 8, padding: '8px 12px', borderRadius: 7,
                                                        background: 'var(--bg)', border: '1px solid var(--border)',
                                                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                                                    }}>
                                                        {t.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status pill */}
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                                                background: pill.bg, color: pill.color, flexShrink: 0,
                                            }}>
                                                {isDone ? 'Done' : isOver ? 'Overdue' : isToday(t.deadline) ? 'Today' : 'Pending'}
                                            </span>

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteTask(t.id)}
                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-muted)', fontSize: 16, lineHeight: 1,
                                                    padding: '2px 4px', flexShrink: 0, transition: 'color 0.15s',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...card, padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                            Summary
                        </div>
                        {[
                            { label: 'Total', value: tasks.length, color: 'var(--text-primary)' },
                            { label: 'Due today', value: todayCount, color: 'var(--amber)' },
                            { label: 'Overdue', value: overdue, color: 'var(--red)' },
                            { label: 'Completed', value: done, color: 'var(--accent-text)' },
                        ].map(s => (
                            <div key={s.label} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '9px 0', borderBottom: '1px solid var(--border)',
                            }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: s.value > 0 ? s.color : 'var(--text-muted)' }}>{s.value}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: 14 }}>
                            <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{
                                    height: '100%', background: 'var(--accent)', borderRadius: 999,
                                    width: tasks.length > 0 ? `${Math.round(done / tasks.length * 100)}%` : '0%',
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0}% completion rate
                            </div>
                        </div>
                    </div>

                    <div style={{ ...card, padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6' }} />
                            About My Tasks
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            Personal tasks are private to you only. They won't appear in team dashboards or be visible to your manager.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}