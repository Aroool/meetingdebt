import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

const ui = {
    card: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 18,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 4,
    },
    sectionSubtext: {
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 12,
    },
    buttonBase: {
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
    },
};

function SectionCard({ children }) {
    return <div style={ui.card}>{children}</div>;
}

function ProgressPill({ active, done, index }) {
    const background = done
        ? 'var(--accent-light)'
        : active
            ? 'rgba(22,163,74,0.10)'
            : 'var(--bg)';

    const border = done || active
        ? '1px solid rgba(22,163,74,0.28)'
        : '1px solid var(--border)';

    const color = done || active ? 'var(--accent-text)' : 'var(--text-muted)';

    return (
        <div
            style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background,
                border,
                color,
                fontSize: 12,
                fontWeight: 700,
                transition: 'all 0.2s ease',
            }}
        >
            {done ? '✓' : index}
        </div>
    );
}

function StarRating({ value, onChange }) {
    const [hovered, setHovered] = useState(0);

    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= (hovered || value);
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                        style={{
                            ...ui.buttonBase,
                            fontSize: 30,
                            lineHeight: 1,
                            border: 'none',
                            background: 'transparent',
                            color: active ? '#f59e0b' : 'var(--border)',
                            padding: 0,
                        }}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

function ScaleRating({ value, onChange, min = 1, max = 5, minLabel, maxLabel }) {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
                {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => {
                    const active = value >= n;
                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onChange(n)}
                            style={{
                                ...ui.buttonBase,
                                height: 38,
                                borderRadius: 10,
                                border: active ? '1px solid #16a34a' : '1px solid var(--border)',
                                background: active ? 'var(--accent-light)' : 'var(--bg)',
                                color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                                fontSize: 13,
                                fontWeight: active ? 700 : 500,
                            }}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
            {(minLabel || maxLabel) && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        fontSize: 10,
                        color: 'var(--text-muted)',
                    }}
                >
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                </div>
            )}
        </div>
    );
}

function ChoiceGroup({ options, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {options.map((option) => {
                const active = value === option;
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        style={{
                            ...ui.buttonBase,
                            flex: 1,
                            minWidth: 110,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: active ? '1px solid #16a34a' : '1px solid var(--border)',
                            background: active ? 'var(--accent-light)' : 'var(--bg)',
                            color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                            fontSize: 13,
                            fontWeight: active ? 700 : 500,
                        }}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

function ScoreBadge({ label, value, accent = 'var(--accent-text)' }) {
    return (
        <div
            style={{
                minWidth: 62,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                textAlign: 'center',
            }}
        >
            <div style={{ fontSize: 15, fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
        </div>
    );
}

function FeedbackCard({ item, featured = false }) {
    const initial = item.name?.charAt(0)?.toUpperCase() || 'A';
    const painTone =
        item.pain_point === 'Yes, definitely'
            ? {
                background: 'var(--accent-light)',
                color: 'var(--accent-text)',
            }
            : item.pain_point === 'Somewhat'
                ? {
                    background: 'var(--amber-light)',
                    color: 'var(--amber)',
                }
                : {
                    background: 'var(--red-light)',
                    color: 'var(--red)',
                };

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: featured ? '1px solid rgba(22,163,74,0.22)' : '1px solid var(--border)',
                borderRadius: 18,
                padding: 20,
                boxShadow: featured ? '0 12px 40px rgba(22,163,74,0.10)' : '0 2px 10px rgba(0,0,0,0.03)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--accent-light)',
                        color: 'var(--accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0,
                    }}
                >
                    {initial}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {item.name || 'Anonymous'}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 4,
                        }}
                    >
                        {item.role && <span>{item.role}</span>}
                        {item.role && <span>·</span>}
                        <span>
                            {item.created_at
                                ? new Date(item.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                })
                                : 'Recent'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <ScoreBadge
                    label="UI"
                    value={`${item.ui_rating || 0}/5`}
                    accent="#f59e0b"
                />
                <ScoreBadge
                    label="Ease"
                    value={`${item.ease_rating || 0}/5`}
                />
            </div>

            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: 999,
                    marginBottom: item.comments ? 12 : 0,
                    ...painTone,
                }}
            >
                <span>●</span>
                <span>{item.pain_point || 'No response'}</span>
            </div>

            {item.comments && (
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.65,
                        borderTop: '1px solid var(--border)',
                        marginTop: 12,
                        paddingTop: 12,
                    }}
                >
                    “{item.comments}”
                </div>
            )}
        </div>
    );
}

function FeedbackCarousel({ items, loading }) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrent((prev) => (prev + 1) % items.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [items.length]);

    useEffect(() => {
        if (current >= items.length && items.length > 0) {
            setCurrent(0);
        }
    }, [items.length, current]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    justifyContent: 'center',
                    height: '100%',
                    padding: '20px 0',
                }}
            >
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        style={{
                            borderRadius: 18,
                            height: n === 2 ? 210 : 120,
                            background: 'linear-gradient(90deg, var(--bg-card) 0%, rgba(255,255,255,0.45) 50%, var(--bg-card) 100%)',
                            border: '1px solid var(--border)',
                            opacity: n === 2 ? 1 : 0.5,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    height: '100%',
                    gap: 12,
                    padding: 20,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-text)',
                        fontSize: 28,
                        fontWeight: 700,
                    }}
                >
                    ★
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No feedback yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240 }}>
                    Once people submit their thoughts, they’ll appear here in a moving vertical stack.
                </div>
            </div>
        );
    }

    const prev = (current - 1 + items.length) % items.length;
    const next = (current + 1) % items.length;

    return (
        <div
            style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '18px 0 10px',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                }}
            >
                {current + 1} / {items.length}
            </div>

            <div style={{ position: 'relative', width: '100%', height: 380 }}>
                {items.length > 1 && (
                    <motion.div
                        key={`prev-${current}`}
                        initial={{ opacity: 0.18, y: -20, scale: 0.94 }}
                        animate={{ opacity: 0.32, y: -38, scale: 0.94 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            position: 'absolute',
                            top: -22,
                            left: 0,
                            right: 0,
                            filter: 'blur(2.5px)',
                            transformOrigin: 'center top',
                            pointerEvents: 'none',
                        }}
                    >
                        <FeedbackCard item={items[prev]} />
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: direction > 0 ? 90 : -90, opacity: 0, scale: 0.97 }}
                        animate={{ y: 42, opacity: 1, scale: 1 }}
                        exit={{ y: direction > 0 ? -90 : 90, opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 2,
                        }}
                    >
                        <FeedbackCard item={items[current]} featured />
                    </motion.div>
                </AnimatePresence>

                {items.length > 1 && (
                    <motion.div
                        key={`next-${current}`}
                        initial={{ opacity: 0.2, y: 22, scale: 0.94 }}
                        animate={{ opacity: 0.34, y: 130, scale: 0.94 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            filter: 'blur(2.5px)',
                            transformOrigin: 'center bottom',
                            pointerEvents: 'none',
                        }}
                    >
                        <FeedbackCard item={items[next]} />
                    </motion.div>
                )}
            </div>

            {items.length > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    {items.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                setDirection(i > current ? 1 : -1);
                                setCurrent(i);
                            }}
                            aria-label={`Go to response ${i + 1}`}
                            style={{
                                ...ui.buttonBase,
                                width: i === current ? 22 : 7,
                                height: 7,
                                borderRadius: 999,
                                border: 'none',
                                background: i === current ? '#16a34a' : 'var(--border)',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ThankYouState({ onReset }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                padding: 20,
            }}
        >
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    border: '2px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    fontSize: 30,
                    color: 'var(--accent-text)',
                    fontWeight: 800,
                }}
            >
                ✓
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Thank you!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 360 }}>
                Your feedback helps shape MeetingDebt into something people actually want to use every week.
            </div>
            <button
                type="button"
                onClick={onReset}
                style={{
                    ...ui.buttonBase,
                    marginTop: 18,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                }}
            >
                Submit another response
            </button>
        </motion.div>
    );
}

export default function Feedback() {
    const [form, setForm] = useState({
        uiRating: 0,
        easeRating: 0,
        painPoint: '',
        comments: '',
        role: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [allFeedback, setAllFeedback] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(true);

    const requiredDone = [form.uiRating > 0, form.easeRating > 0, !!form.painPoint];
    const completedCount = requiredDone.filter(Boolean).length;
    const canSubmit = completedCount === 3 && !saving;

    const fetchFeedback = async () => {
        setLoadingFeedback(true);
        try {
            const response = await api.get('/feedback');
            setAllFeedback(Array.isArray(response.data) ? response.data : []);
        } catch {
            setAllFeedback([]);
        } finally {
            setLoadingFeedback(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    useEffect(() => {
        if (submitted) {
            fetchFeedback();
        }
    }, [submitted]);

    async function handleSubmit() {
        if (!form.uiRating || !form.easeRating || !form.painPoint) {
            setError('Please answer all required questions.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            const userEmail = session?.user?.email || 'anonymous';
            const userName = session?.user?.user_metadata?.full_name || 'Anonymous';

            await api.post('/feedback', {
                uiRating: form.uiRating,
                easeRating: form.easeRating,
                painPoint: form.painPoint,
                comments: form.comments.trim(),
                name: userName,
                role: form.role,
                email: userEmail,
                workspaceId: localStorage.getItem('workspaceId'),
            });

            setSubmitted(true);
        } catch {
            setError('Failed to submit. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    function resetForm() {
        setForm({
            uiRating: 0,
            easeRating: 0,
            painPoint: '',
            comments: '',
            role: '',
        });
        setSubmitted(false);
        setError('');
    }

    return (
        <div
            style={{
                minHeight: 'calc(100vh - 56px)',
                background: 'var(--bg)',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 420px',
            }}
        >
            <style>{`
        @media (max-width: 980px) {
          .feedback-shell {
            grid-template-columns: 1fr !important;
          }
          .feedback-right {
            width: 100% !important;
            border-top: 1px solid var(--border);
          }
          .feedback-left {
            border-right: none !important;
          }
        }
      `}</style>

            <div
                className="feedback-shell"
                style={{
                    display: 'grid',
                    gridColumn: '1 / -1',
                    gridTemplateColumns: 'minmax(0, 1fr) 420px',
                    minHeight: 'calc(100vh - 56px)',
                }}
            >
                <div
                    className="feedback-left"
                    style={{
                        padding: '32px',
                        overflowY: 'auto',
                        borderRight: '1px solid var(--border)',
                    }}
                >
                    {submitted ? (
                        <ThankYouState onReset={resetForm} />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ maxWidth: 560, margin: '0 auto' }}
                        >
                            <div style={{ marginBottom: 28 }}>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        background: 'var(--accent-light)',
                                        color: 'var(--accent-text)',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        marginBottom: 14,
                                    }}
                                >
                                    <span>●</span>
                                    <span>Product feedback</span>
                                </div>

                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: -0.7 }}>
                                    Share your feedback
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 420 }}>
                                    Same simple flow, but now a cleaner experience. Takes about 60 seconds.
                                </div>
                            </div>

                            <SectionCard>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            Required progress
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                            {completedCount} of 3 required steps completed
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <ProgressPill index={1} active={!requiredDone[0]} done={requiredDone[0]} />
                                        <ProgressPill index={2} active={requiredDone[0] && !requiredDone[1]} done={requiredDone[1]} />
                                        <ProgressPill index={3} active={requiredDone[0] && requiredDone[1] && !requiredDone[2]} done={requiredDone[2]} />
                                    </div>
                                </div>
                            </SectionCard>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                                <SectionCard>
                                    <div style={ui.sectionTitle}>How would you rate the UI design? *</div>
                                    <div style={ui.sectionSubtext}>Clean, easy to navigate, and visually polished?</div>
                                    <StarRating value={form.uiRating} onChange={(v) => setForm((f) => ({ ...f, uiRating: v }))} />
                                    {form.uiRating > 0 && (
                                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-text)', fontWeight: 600 }}>
                                            {['', 'Needs improvement', 'Below average', 'Good', 'Very good', 'Outstanding'][form.uiRating]}
                                        </div>
                                    )}
                                </SectionCard>

                                <SectionCard>
                                    <div style={ui.sectionTitle}>How easy was it to use MeetingDebt? *</div>
                                    <div style={ui.sectionSubtext}>From extracting a meeting to actually seeing commitments.</div>
                                    <ScaleRating
                                        value={form.easeRating}
                                        onChange={(v) => setForm((f) => ({ ...f, easeRating: v }))}
                                        minLabel="Very hard"
                                        maxLabel="Very easy"
                                    />
                                </SectionCard>

                                <SectionCard>
                                    <div style={ui.sectionTitle}>Did it solve a real pain point? *</div>
                                    <div style={ui.sectionSubtext}>Have commitments from meetings ever slipped through the cracks for you?</div>
                                    <ChoiceGroup
                                        options={['Yes, definitely', 'Somewhat', 'Not really']}
                                        value={form.painPoint}
                                        onChange={(v) => setForm((f) => ({ ...f, painPoint: v }))}
                                    />
                                </SectionCard>

                                <SectionCard>
                                    <div style={ui.sectionTitle}>What’s your role?</div>
                                    <div style={ui.sectionSubtext}>This helps you understand whose feedback you’re getting.</div>
                                    <ChoiceGroup
                                        options={['Manager', 'Team member', 'Founder', 'Other']}
                                        value={form.role}
                                        onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                                    />
                                </SectionCard>

                                <SectionCard>
                                    <div style={ui.sectionTitle}>Any suggestions?</div>
                                    <div style={ui.sectionSubtext}>What would make you use this every week?</div>
                                    <textarea
                                        value={form.comments}
                                        onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                                        placeholder="Tell us what felt useful, missing, or confusing..."
                                        rows={4}
                                        maxLength={300}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg)',
                                            fontSize: 13,
                                            color: 'var(--text-primary)',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            resize: 'vertical',
                                            lineHeight: 1.6,
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#16a34a';
                                            e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                                        {form.comments.length}/300
                                    </div>
                                </SectionCard>

                                {error && (
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: 'var(--red)',
                                            padding: '12px 14px',
                                            background: 'var(--red-light)',
                                            borderRadius: 12,
                                            border: '1px solid rgba(239,68,68,0.14)',
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    style={{
                                        ...ui.buttonBase,
                                        width: '100%',
                                        padding: '15px',
                                        borderRadius: 14,
                                        background: canSubmit ? '#16a34a' : 'rgba(22,163,74,0.45)',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: 15,
                                        fontWeight: 800,
                                        opacity: saving ? 0.85 : 1,
                                        boxShadow: canSubmit ? '0 10px 24px rgba(22,163,74,0.22)' : 'none',
                                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {saving ? 'Submitting...' : 'Submit feedback →'}
                                </button>

                                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                                    Built by Arulprashath Rajarajan · Clark University · Demo day April 28, 2026
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <aside
                    className="feedback-right"
                    style={{
                        width: 420,
                        padding: '32px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ marginBottom: 20 }}>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                            Feedback wall
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <FeedbackCarousel items={allFeedback} loading={loadingFeedback} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
