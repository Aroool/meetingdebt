import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

function StarRating({ value, onChange }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
                <span key={n}
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    style={{ fontSize: 28, cursor: 'pointer', color: n <= (hovered || value) ? '#f59e0b' : 'var(--border)', transition: 'color 0.1s' }}>
                    ★
                </span>
            ))}
        </div>
    );
}

function ScaleRating({ value, onChange, min = 1, max = 5, minLabel, maxLabel }) {
    return (
        <div>
            <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
                    <button key={n} onClick={() => onChange(n)}
                        style={{ flex: 1, height: 36, borderRadius: 8, border: value >= n ? '1px solid #16a34a' : '1px solid var(--border)', background: value >= n ? 'var(--accent-light)' : 'var(--bg)', color: value >= n ? 'var(--accent-text)' : 'var(--text-muted)', fontSize: 13, fontWeight: value >= n ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {n}
                    </button>
                ))}
            </div>
            {(minLabel || maxLabel) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>{minLabel}</span><span>{maxLabel}</span>
                </div>
            )}
        </div>
    );
}

function ChoiceGroup({ options, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {options.map(o => (
                <button key={o} onClick={() => onChange(o)}
                    style={{ flex: 1, padding: '9px', borderRadius: 9, border: value === o ? '1px solid #16a34a' : '1px solid var(--border)', background: value === o ? 'var(--accent-light)' : 'var(--bg)', color: value === o ? 'var(--accent-text)' : 'var(--text-muted)', fontSize: 13, fontWeight: value === o ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', minWidth: 80 }}>
                    {o}
                </button>
            ))}
        </div>
    );
}

function FeedbackCarousel({ items }) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        if (items.length < 2) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrent(prev => (prev + 1) % items.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [items.length]);

    if (items.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 32, color: 'var(--border)' }}>★</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>No feedback yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Be the first to share!</div>
            </div>
        );
    }

    const prev = (current - 1 + items.length) % items.length;
    const next = (current + 1) % items.length;

    return (
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '20px 0' }}>

            {/* Counter */}
            <div style={{ position: 'absolute', top: 0, right: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {current + 1} / {items.length}
            </div>

            {/* Cards container */}
            <div style={{ position: 'relative', width: '100%', height: 320 }}>

                {/* Previous card — peeking from top */}
                {items.length > 1 && (
                    <div style={{ position: 'absolute', top: -60, left: 0, right: 0, opacity: 0.3, transform: 'scale(0.92)', transition: 'all 0.5s ease' }}>
                        <FeedbackCard item={items[prev]} />
                    </div>
                )}

                {/* Current card — centered */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: 80, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -80, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ position: 'absolute', top: 40, left: 0, right: 0 }}
                    >
                        <FeedbackCard item={items[current]} featured />
                    </motion.div>
                </AnimatePresence>

                {/* Next card — peeking from bottom */}
                {items.length > 1 && (
                    <div style={{ position: 'absolute', bottom: -40, left: 0, right: 0, opacity: 0.35, transform: 'scale(0.92)', transition: 'all 0.5s ease' }}>
                        <FeedbackCard item={items[next]} />
                    </div>
                )}
            </div>

            {/* Dots */}
            {items.length > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                    {items.map((_, i) => (
                        <div key={i}
                            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                            style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 999, background: i === current ? '#16a34a' : 'var(--border)', transition: 'all 0.3s', cursor: 'pointer' }} />
                    ))}
                </div>
            )}
        </div>
    );
}

function FeedbackCard({ item, featured }) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: featured ? '1px solid #16a34a30' : '1px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            boxShadow: featured ? '0 4px 24px rgba(22,163,74,0.08)' : 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {item.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || 'Anonymous'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        {item.role && <span>{item.role}</span>}
                        {item.role && <span>·</span>}
                        <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: '#f59e0b' }}>{'★'.repeat(item.ui_rating || 0)}<span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - (item.ui_rating || 0))}</span></div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>UI</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-text)', lineHeight: 1 }}>{item.ease_rating}/5</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>Ease</div>
                    </div>
                </div>
            </div>

            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, marginBottom: item.comments ? 12 : 0, background: item.pain_point === 'Yes, definitely' ? 'var(--accent-light)' : item.pain_point === 'Somewhat' ? 'var(--amber-light)' : 'var(--red-light)', color: item.pain_point === 'Yes, definitely' ? 'var(--accent-text)' : item.pain_point === 'Somewhat' ? 'var(--amber)' : 'var(--red)' }}>
                {item.pain_point}
            </span>

            {item.comments && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    "{item.comments}"
                </div>
            )}
        </div>
    );
}

export default function Feedback() {
    const [form, setForm] = useState({ uiRating: 0, easeRating: 0, painPoint: '', comments: '', role: '' });
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [allFeedback, setAllFeedback] = useState([]);

    useEffect(() => {
        api.get('/feedback').then(r => setAllFeedback(r.data)).catch(() => { });
    }, [submitted]);

    async function handleSubmit() {
        if (!form.uiRating || !form.easeRating || !form.painPoint) {
            setError('Please answer all required questions.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email || 'anonymous';
            const userName = session?.user?.user_metadata?.full_name || 'Anonymous';
            await api.post('/feedback', {
                uiRating: form.uiRating,
                easeRating: form.easeRating,
                painPoint: form.painPoint,
                comments: form.comments,
                name: userName,
                role: form.role,
                email: userEmail,
                workspaceId: localStorage.getItem('workspaceId'),
            });
            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', display: 'flex' }}>

            {/* ── LEFT — Form ── */}
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                {submitted ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, color: 'var(--accent-text)' }}>✓</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>Thank you!</div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 320 }}>Your feedback means a lot. It helps us build a product that actually solves real problems.</div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, margin: '0 auto' }}>
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 6 }}>Share your feedback</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Takes 60 seconds. Helps us build a better product.</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>How would you rate the UI design? *</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Clean, easy to navigate, visually appealing?</div>
                                <StarRating value={form.uiRating} onChange={v => setForm(f => ({ ...f, uiRating: v }))} />
                                {form.uiRating > 0 && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent-text)', fontWeight: 500 }}>{['', 'Needs improvement', 'Below average', 'Good', 'Very good', 'Outstanding!'][form.uiRating]}</div>}
                            </div>

                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>How easy was it to use MeetingDebt? *</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>From extracting a meeting to seeing commitments.</div>
                                <ScaleRating value={form.easeRating} onChange={v => setForm(f => ({ ...f, easeRating: v }))} minLabel="Very hard" maxLabel="Very easy" />
                            </div>

                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Did it solve a real pain point? *</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Have you had commitments fall through after meetings?</div>
                                <ChoiceGroup options={['Yes, definitely', 'Somewhat', 'Not really']} value={form.painPoint} onChange={v => setForm(f => ({ ...f, painPoint: v }))} />
                            </div>

                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>What's your role?</div>
                                <ChoiceGroup options={['Manager', 'Team member', 'Founder', 'Other']} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
                            </div>

                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Any suggestions?</div>
                                <textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                                    placeholder="What would make you use this every week?" rows={3}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                            </div>

                            {error && <div style={{ fontSize: 13, color: 'var(--red)', padding: '10px 14px', background: 'var(--red-light)', borderRadius: 9 }}>{error}</div>}

                            <button onClick={handleSubmit} disabled={saving}
                                style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#16a34a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Submitting...' : 'Submit feedback →'}
                            </button>

                            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                                Built by Arulprashath Rajarajan · Clark University · Demo day April 28, 2026
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── RIGHT — Carousel ── */}
            <div style={{ width: 400, padding: '32px 24px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                        {allFeedback.length} responses
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <FeedbackCarousel items={allFeedback} />
                </div>
            </div>
        </div>
    );
}