import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import api from '../api';
import useIsMobile from '../hooks/useIsMobile';

// ─── Scroll Wheel Column ──────────────────────────────────────────────────────
const ITEM_H = 38;

function ScrollWheel({ items, selected, onSelect, fmt }) {
    const ref = useRef(null);
    const timer = useRef(null);
    const didMount = useRef(false);

    const scrollToIdx = useCallback((idx, behavior = 'auto') => {
        if (ref.current) ref.current.scrollTop = idx * ITEM_H;
    }, []);

    useEffect(() => {
        const idx = items.indexOf(selected);
        if (idx >= 0) scrollToIdx(idx);
        didMount.current = true;
    }, []);

    function onScroll() {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            const idx = Math.round(ref.current.scrollTop / ITEM_H);
            const clamped = Math.max(0, Math.min(items.length - 1, idx));
            ref.current.scrollTop = clamped * ITEM_H;
            if (items[clamped] !== selected) onSelect(items[clamped]);
        }, 120);
    }

    return (
        <div style={{ position: 'relative', width: 56, height: ITEM_H * 3 }}>
            {/* Selection highlight */}
            <div style={{
                position: 'absolute', top: ITEM_H, left: 2, right: 2, height: ITEM_H,
                background: 'var(--accent-light)', borderRadius: 8,
                pointerEvents: 'none', zIndex: 1,
            }} />
            {/* Fade top */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H,
                background: 'linear-gradient(to bottom, var(--bg-card) 30%, transparent)',
                pointerEvents: 'none', zIndex: 2,
            }} />
            {/* Fade bottom */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H,
                background: 'linear-gradient(to top, var(--bg-card) 30%, transparent)',
                pointerEvents: 'none', zIndex: 2,
            }} />
            <div
                ref={ref}
                onScroll={onScroll}
                style={{
                    height: '100%', overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Top spacer */}
                <div style={{ height: ITEM_H, scrollSnapAlign: 'none', flexShrink: 0 }} />
                {items.map(item => (
                    <div
                        key={item}
                        onClick={() => { onSelect(item); scrollToIdx(items.indexOf(item)); }}
                        style={{
                            height: ITEM_H, scrollSnapAlign: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 17, fontWeight: item === selected ? 700 : 400,
                            color: item === selected ? 'var(--accent-text)' : 'var(--text-muted)',
                            cursor: 'pointer', userSelect: 'none',
                            transition: 'color 0.1s',
                            position: 'relative', zIndex: 0,
                        }}
                    >
                        {fmt ? fmt(item) : item}
                    </div>
                ))}
                {/* Bottom spacer */}
                <div style={{ height: ITEM_H, scrollSnapAlign: 'none', flexShrink: 0 }} />
            </div>
            <style>{`.scroll-wheel::-webkit-scrollbar{display:none}`}</style>
        </div>
    );
}

// ─── Date Time Picker ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const HOURS  = Array.from({ length: 12 }, (_, i) => i + 1);   // 1–12
const MINS   = [0,5,10,15,20,25,30,35,40,45,50,55];

function dStr(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayStr() {
    const t = new Date();
    return dStr(t.getFullYear(), t.getMonth(), t.getDate());
}

function DateTimePicker({ value, onChange, placeholder = 'Set deadline' }) {
    // --- parse incoming value ---
    function parse(v) {
        if (!v) return { date: null, h12: 9, min: 0, ampm: 'AM', hasTime: false };
        const hasT = v.includes('T');
        const date = v.slice(0, 10);
        if (!hasT) return { date, h12: 9, min: 0, ampm: 'AM', hasTime: false };
        const [hh, mm] = v.slice(11, 16).split(':').map(Number);
        const ampm = hh < 12 ? 'AM' : 'PM';
        const h12 = hh % 12 || 12;
        const nearestMin = MINS.reduce((a, b) => Math.abs(b - mm) < Math.abs(a - mm) ? b : a);
        return { date, h12, min: nearestMin, ampm, hasTime: true };
    }

    const init = parse(value);
    const [open, setOpen]       = useState(false);
    const [selDate, setSelDate] = useState(init.date);
    const [h12, setH12]         = useState(init.h12);
    const [min, setMin]         = useState(init.min);
    const [ampm, setAmpm]       = useState(init.ampm);
    const [hasTime, setHasTime] = useState(init.hasTime);
    const [viewYear, setViewYear]   = useState(() => { const d = init.date ? new Date(init.date+'T00:00') : new Date(); return d.getFullYear(); });
    const [viewMonth, setViewMonth] = useState(() => { const d = init.date ? new Date(init.date+'T00:00') : new Date(); return d.getMonth(); });
    const popRef = useRef(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        function handler(e) {
            if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function emit(date, hour12, minute, ap, ht) {
        if (!date) { onChange(''); return; }
        if (ht) {
            let hh = hour12 % 12;
            if (ap === 'PM') hh += 12;
            onChange(`${date}T${String(hh).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
        } else {
            onChange(date);
        }
    }

    function pickDate(ds) {
        setSelDate(ds);
        emit(ds, h12, min, ampm, hasTime);
    }

    function quick(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const ds = dStr(d.getFullYear(), d.getMonth(), d.getDate());
        setSelDate(ds);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        emit(ds, h12, min, ampm, hasTime);
    }

    function toggleTime() {
        const next = !hasTime;
        setHasTime(next);
        emit(selDate, h12, min, ampm, next);
    }

    // Calendar grid
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const td          = todayStr();

    // Display label
    function label() {
        if (!selDate) return null;
        const d = new Date(selDate + 'T00:00');
        const ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
        if (!hasTime) return ds;
        return `${ds} · ${h12}:${String(min).padStart(2,'0')} ${ampm}`;
    }

    return (
        <div ref={popRef} style={{ position: 'relative' }}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
                    background: 'var(--bg)',
                    color: selDate ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 13, fontFamily: 'inherit', fontWeight: selDate ? 500 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                }}
            >
                <span style={{ opacity: 0.7 }}>📅</span>
                <span style={{ flex: 1 }}>{label() || placeholder}</span>
                {selDate && (
                    <span
                        onClick={e => { e.stopPropagation(); setSelDate(null); setHasTime(false); onChange(''); }}
                        style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}
                    >×</span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
            </button>

            {/* Popover */}
            {open && (
                <div style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    ...(isMobile ? { bottom: 0, left: 0, right: 0, top: 'auto', borderRadius: '20px 20px 0 0' } : { top: 'calc(100% + 6px)', left: 0, borderRadius: 14, width: 290 }),
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
                    padding: 16,
                    zIndex: 9999,
                    userSelect: 'none',
                }}>
                    {/* Mobile handle */}
                    {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />}

                    {/* Quick chips */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                        {[['Today',0],['Tomorrow',1],['+3 days',3],['Next week',7]].map(([lbl, days]) => {
                            const qd = new Date(); qd.setDate(qd.getDate() + days);
                            const isActive = selDate === dStr(qd.getFullYear(), qd.getMonth(), qd.getDate());
                            return (
                                <button key={lbl} type="button" onClick={() => quick(days)} style={{
                                    fontSize: 11, padding: '4px 10px', borderRadius: 20,
                                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                    background: isActive ? 'var(--accent-light)' : 'transparent',
                                    color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.12s',
                                }}>
                                    {lbl}
                                </button>
                            );
                        })}
                    </div>

                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <button type="button" onClick={() => { const d = new Date(viewYear, viewMonth-1,1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, padding:'4px 8px', borderRadius:6 }}>‹</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={() => { const d = new Date(viewYear, viewMonth+1,1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, padding:'4px 8px', borderRadius:6 }}>›</button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
                        {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--text-muted)', padding:'2px 0', textTransform:'uppercase' }}>{d}</div>)}
                    </div>

                    {/* Calendar grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 12 }}>
                        {Array.from({ length: firstDay }).map((_,i) => <div key={`sp-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_,i) => {
                            const day = i + 1;
                            const ds  = dStr(viewYear, viewMonth, day);
                            const isSel   = ds === selDate;
                            const isToday = ds === td;
                            return (
                                <button key={day} type="button" onClick={() => pickDate(ds)} style={{
                                    width:'100%', aspectRatio:'1', borderRadius:7, border:'none',
                                    background: isSel ? 'var(--accent)' : 'transparent',
                                    color: isSel ? '#fff' : isToday ? 'var(--accent-text)' : 'var(--text-primary)',
                                    fontWeight: isSel || isToday ? 700 : 400,
                                    fontSize: 13, cursor:'pointer', fontFamily:'inherit',
                                    position:'relative', transition:'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--accent-light)'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {day}
                                    {isToday && !isSel && (
                                        <div style={{
                                            position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)',
                                            width:3, height:3, borderRadius:'50%', background:'var(--accent)',
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time section */}
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: hasTime ? 12 : 0 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:5 }}>
                                <span>🕐</span> Time
                            </span>
                            <button type="button" onClick={toggleTime} style={{
                                fontSize:11, padding:'4px 12px', borderRadius:20,
                                border:`1px solid ${hasTime ? 'var(--accent)' : 'var(--border)'}`,
                                background: hasTime ? 'var(--accent-light)' : 'transparent',
                                color: hasTime ? 'var(--accent-text)' : 'var(--text-muted)',
                                cursor:'pointer', fontFamily:'inherit', fontWeight:600, transition:'all 0.15s',
                            }}>
                                {hasTime ? '✓ On' : 'Add time'}
                            </button>
                        </div>

                        {hasTime && (
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                                <ScrollWheel items={HOURS} selected={h12} onSelect={v => { setH12(v); emit(selDate, v, min, ampm, true); }} fmt={v => String(v).padStart(2,'0')} />
                                <span style={{ fontSize:22, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>:</span>
                                <ScrollWheel items={MINS} selected={min} onSelect={v => { setMin(v); emit(selDate, h12, v, ampm, true); }} fmt={v => String(v).padStart(2,'0')} />
                                {/* AM/PM */}
                                <div style={{ display:'flex', flexDirection:'column', gap:4, marginLeft:6 }}>
                                    {['AM','PM'].map(ap => (
                                        <button key={ap} type="button" onClick={() => { setAmpm(ap); emit(selDate, h12, min, ap, true); }} style={{
                                            padding:'6px 12px', borderRadius:7, border:'none',
                                            background: ampm === ap ? 'var(--accent)' : 'var(--bg)',
                                            color: ampm === ap ? '#fff' : 'var(--text-muted)',
                                            fontWeight: 700, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                                            transition:'all 0.15s',
                                        }}>
                                            {ap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Done */}
                    {selDate && (
                        <button type="button" onClick={() => setOpen(false)} style={{
                            width:'100%', marginTop:14, padding:'10px', borderRadius:9,
                            background:'var(--accent)', color:'#fff', border:'none',
                            cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit',
                        }}>
                            Done ✓
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function parseDate(s) { if (!s) return null; const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); }
function getStatus(c) {
    if (c.status === 'completed') return 'done';
    if (c.deadline && parseDate(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

function isToday(dateStr) {
    if (!dateStr) return false;
    return parseDate(dateStr).toDateString() === new Date().toDateString();
}

function isTomorrow(dateStr) {
    if (!dateStr) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parseDate(dateStr).toDateString() === tomorrow.toDateString();
}

function formatDeadline(dateStr) {
    if (!dateStr) return null;
    if (isToday(dateStr)) return 'Today';
    if (isTomorrow(dateStr)) return 'Tomorrow';
    return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    const isMobile = useIsMobile();
    const overdue = tasks.filter(t => getStatus(t) === 'overdue').length;
    const todayCount = tasks.filter(t => isToday(t.deadline) && getStatus(t) !== 'done').length;
    const done = tasks.filter(t => getStatus(t) === 'done').length;

    const card = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 52px)', background: 'var(--bg)', padding: isMobile ? '16px' : '24px 32px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

            {/* Header */}
            <div ref={headerRef} style={{ opacity: 0, marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
                        My Tasks
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Personal tasks — private to you only
                    </div>
                </div>
                <button onClick={() => setShowAdd(v => !v)} className="btn-accent-sm">
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
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Deadline
                                </div>
                                <DateTimePicker
                                    value={form.deadline}
                                    onChange={v => setForm(f => ({ ...f, deadline: v }))}
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

            <div ref={listRef} style={{ opacity: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 16, alignItems: 'start', minWidth: 0, width: '100%' }}>

                {/* Main task list */}
                <div style={{ minWidth: 0 }}>
                    {/* Filter bar */}
                    <div className="filter-tabs" style={{ marginBottom: 14 }}>
                        {[
                            { key: 'All', label: `All ${tasks.length}` },
                            { key: 'Today', label: `Today ${todayCount}` },
                            { key: 'Overdue', label: `Overdue ${overdue}` },
                            { key: 'Done', label: `Done ${done}` },
                        ].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                className={`ftab${filter === f.key ? ' active' : ''}`}>
                                {f.label}
                            </button>
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
                <div style={{ display: isMobile ? 'none' : 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
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