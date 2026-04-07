import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

const ui = {
    card: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
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
        lineHeight: 1.6,
    },
    buttonBase: {
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
    },
};

function SectionCard({ children, style }) {
    return <div style={{ ...ui.card, padding: 18, ...style }}>{children}</div>;
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
                                height: 40,
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

function FeedbackCard({ item }) {
    const initial = item.name?.charAt(0)?.toUpperCase() || 'A';

    const painTone =
        item.pain_point === 'Yes, definitely'
            ? { background: 'var(--accent-light)', color: 'var(--accent-text)' }
            : item.pain_point === 'Somewhat'
                ? { background: 'var(--amber-light)', color: 'var(--amber)' }
                : { background: 'var(--red-light)', color: 'var(--red)' };

    return (
        <div
            style={{
                ...ui.card,
                padding: 18,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'var(--accent-light)',
                        color: 'var(--accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
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
                            marginTop: 4,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            alignItems: 'center',
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

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div
                    style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                    }}
                >
                    UI {item.ui_rating || 0}/5
                </div>
                <div
                    style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                    }}
                >
                    Ease {item.ease_rating || 0}/5
                </div>
                <div
                    style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        ...painTone,
                    }}
                >
                    {item.pain_point || 'No response'}
                </div>
            </div>

            <div
                style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 88,
                }}
            >
                {item.comments ? `“${item.comments}”` : 'No written comment provided.'}
            </div>
        </div>
    );
}

function EmptyFeedbackState() {
    return (
        <SectionCard style={{ padding: 28, textAlign: 'center' }}>
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    color: 'var(--accent-text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                    marginBottom: 14,
                }}
            >
                ★
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                No feedback yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
                Once responses start coming in, they’ll show up here as clean, readable cards.
            </div>
        </SectionCard>
    );
}

function ThankYouState({ onReset }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                ...ui.card,
                padding: 32,
                textAlign: 'center',
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
                    margin: '0 auto 18px',
                    fontSize: 30,
                    color: 'var(--accent-text)',
                    fontWeight: 800,
                }}
            >
                ✓
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 10 }}>
                Thanks for the feedback
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 420, margin: '0 auto' }}>
                Your response helps improve how MeetingDebt captures commitments and makes follow-through clearer after meetings.
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

    const completedCount = [form.uiRating > 0, form.easeRating > 0, !!form.painPoint].filter(Boolean).length;
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
        if (submitted) fetchFeedback();
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
        <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)' }}>
            <style>{`
        @media (max-width: 960px) {
          .feedback-top-grid {
            grid-template-columns: 1fr !important;
          }
          .feedback-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 961px) and (max-width: 1180px) {
          .feedback-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 20px 56px' }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
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
                            marginBottom: 16,
                        }}
                    >
                        <span>●</span>
                        <span>Product feedback</span>
                    </div>

                    <div style={{ maxWidth: 680 }}>
                        <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.9, marginBottom: 10 }}>
                            Help improve MeetingDebt
                        </div>
                        <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                            A simple feedback flow designed the way most professional product sites do it: clear form first, social proof second, no distractions.
                        </div>
                    </div>
                </motion.div>

                <div
                    className="feedback-top-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.8fr)',
                        gap: 20,
                        marginTop: 28,
                        alignItems: 'start',
                    }}
                >
                    <div>
                        {submitted ? (
                            <ThankYouState onReset={resetForm} />
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <SectionCard style={{ padding: 22 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 22 }}>
                                        <div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Share your thoughts</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }}>
                                                Takes about a minute. The first three questions are required.
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                padding: '9px 12px',
                                                borderRadius: 999,
                                                background: 'var(--bg)',
                                                border: '1px solid var(--border)',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: completedCount === 3 ? 'var(--accent-text)' : 'var(--text-muted)',
                                            }}
                                        >
                                            {completedCount}/3 completed
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div>
                                            <div style={ui.sectionTitle}>How would you rate the UI design? *</div>
                                            <div style={ui.sectionSubtext}>Was it clean, easy to follow, and visually polished?</div>
                                            <StarRating value={form.uiRating} onChange={(v) => setForm((f) => ({ ...f, uiRating: v }))} />
                                        </div>

                                        <div>
                                            <div style={ui.sectionTitle}>How easy was it to use MeetingDebt? *</div>
                                            <div style={ui.sectionSubtext}>From extracting a meeting to understanding commitments.</div>
                                            <ScaleRating
                                                value={form.easeRating}
                                                onChange={(v) => setForm((f) => ({ ...f, easeRating: v }))}
                                                minLabel="Very hard"
                                                maxLabel="Very easy"
                                            />
                                        </div>

                                        <div>
                                            <div style={ui.sectionTitle}>Did it solve a real pain point? *</div>
                                            <div style={ui.sectionSubtext}>Does this actually help with commitments slipping after meetings?</div>
                                            <ChoiceGroup
                                                options={['Yes, definitely', 'Somewhat', 'Not really']}
                                                value={form.painPoint}
                                                onChange={(v) => setForm((f) => ({ ...f, painPoint: v }))}
                                            />
                                        </div>

                                        <div>
                                            <div style={ui.sectionTitle}>What’s your role?</div>
                                            <div style={ui.sectionSubtext}>Optional, but useful for understanding feedback context.</div>
                                            <ChoiceGroup
                                                options={['Manager', 'Team member', 'Founder', 'Other']}
                                                value={form.role}
                                                onChange={(v) => setForm((f) => ({ ...f, role: v }))}
                                            />
                                        </div>

                                        <div>
                                            <div style={ui.sectionTitle}>Anything else we should improve?</div>
                                            <div style={ui.sectionSubtext}>Optional notes, suggestions, or missing features.</div>
                                            <textarea
                                                value={form.comments}
                                                onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                                                placeholder="Tell us what felt useful, confusing, or missing..."
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
                                                    lineHeight: 1.65,
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
                                        </div>

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
                                                boxShadow: canSubmit ? '0 12px 24px rgba(22,163,74,0.20)' : 'none',
                                                cursor: canSubmit ? 'pointer' : 'not-allowed',
                                            }}
                                        >
                                            {saving ? 'Submitting...' : 'Submit feedback →'}
                                        </button>
                                    </div>
                                </SectionCard>
                            </motion.div>
                        )}
                    </div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <SectionCard style={{ padding: 22, position: 'sticky', top: 24 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                                What happens with your feedback
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 18 }}>
                                This page is intentionally simple. The goal is to help people respond quickly and confidently without distracting motion or clutter.
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    'Used to improve product clarity and flow',
                                    'Optional comments help identify missing features',
                                    'Recent responses are shown below as proof and context',
                                ].map((text) => (
                                    <div
                                        key={text}
                                        style={{
                                            display: 'flex',
                                            gap: 10,
                                            alignItems: 'flex-start',
                                            padding: '12px 0',
                                            borderTop: '1px solid var(--border)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                background: 'var(--accent-light)',
                                                color: 'var(--accent-text)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                flexShrink: 0,
                                            }}
                                        >
                                            ✓
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{text}</div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </motion.div>
                </div>

                <div style={{ marginTop: 34 }}>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                            What others said
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            Recent responses shown in a clean static layout, the way most polished product pages handle social proof.
                        </div>
                    </div>

                    {loadingFeedback ? (
                        <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    style={{
                                        ...ui.card,
                                        height: 240,
                                        background: 'linear-gradient(90deg, var(--bg-card) 0%, rgba(255,255,255,0.45) 50%, var(--bg-card) 100%)',
                                    }}
                                />
                            ))}
                        </div>
                    ) : allFeedback.length === 0 ? (
                        <EmptyFeedbackState />
                    ) : (
                        <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                            {allFeedback.slice(0, 6).map((item, index) => (
                                <motion.div
                                    key={`${item.email || 'anon'}-${item.created_at || index}`}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <FeedbackCard item={item} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 26 }}>
                    Built by Arulprashath Rajarajan · Clark University · Demo day April 28, 2026
                </div>
            </div>
        </div>
    );
}
