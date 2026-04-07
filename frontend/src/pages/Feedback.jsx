import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        <div style={{ display: 'flex', gap: 8 }}>
            {options.map(o => (
                <button key={o} onClick={() => onChange(o)}
                    style={{ flex: 1, padding: '9px', borderRadius: 9, border: value === o ? '1px solid #16a34a' : '1px solid var(--border)', background: value === o ? 'var(--accent-light)' : 'var(--bg)', color: value === o ? 'var(--accent-text)' : 'var(--text-muted)', fontSize: 13, fontWeight: value === o ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {o}
                </button>
            ))}
        </div>
    );
}

export default function Feedback() {
    const [form, setForm] = useState({
        uiRating: 0, easeRating: 0, painPoint: '', comments: '', role: '',
    });
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

    if (submitted) {
        return (
            <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, color: 'var(--accent-text)' }}>✓</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: -0.5 }}>Thank you!</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                        Your feedback means a lot. It helps us build a product that actually solves real problems for real teams.
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        Built at Clark University · Demo day April 28
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)', padding: '32px' }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, margin: '0 auto' }}>

                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 6 }}>Share your feedback</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>Takes 60 seconds. Helps us build a better product for real teams.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>How would you rate the UI design? *</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Is it clean, easy to navigate, visually appealing?</div>
                        <StarRating value={form.uiRating} onChange={v => setForm(f => ({ ...f, uiRating: v }))} />
                        {form.uiRating > 0 && (
                            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-text)', fontWeight: 500 }}>
                                {['', 'Needs improvement', 'Below average', 'Good', 'Very good', 'Outstanding!'][form.uiRating]}
                            </div>
                        )}
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>How easy was it to use MeetingDebt? *</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>From extracting a meeting to seeing commitments on the dashboard.</div>
                        <ScaleRating value={form.easeRating} onChange={v => setForm(f => ({ ...f, easeRating: v }))} minLabel="Very hard" maxLabel="Very easy" />
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Did MeetingDebt solve a real pain point for you? *</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Have you ever had a commitment fall through after a meeting?</div>
                        <ChoiceGroup options={['Yes, definitely', 'Somewhat', 'Not really']} value={form.painPoint} onChange={v => setForm(f => ({ ...f, painPoint: v }))} />
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>What's your role?</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Helps us understand who finds this most useful.</div>
                        <ChoiceGroup options={['Manager', 'Team member', 'Founder', 'Other']} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Any suggestions or comments?</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>What would make you use this every week?</div>
                        <textarea value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
                            placeholder="e.g. I'd love a Slack integration, mobile app, or..." rows={3}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 }}
                            onFocus={e => e.target.style.borderColor = '#16a34a'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>

                    {error && (
                        <div style={{ fontSize: 13, color: 'var(--red)', padding: '10px 14px', background: 'var(--red-light)', borderRadius: 9 }}>{error}</div>
                    )}

                    <button onClick={handleSubmit} disabled={saving}
                        style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#16a34a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s', opacity: saving ? 0.7 : 1 }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={e => e.currentTarget.style.opacity = saving ? '0.7' : '1'}>
                        {saving ? 'Submitting...' : 'Submit feedback →'}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                        Built by Arulprashath Rajarajan · Clark University · Demo day April 28, 2026
                    </div>

                    {/* All feedback responses */}
                    {allFeedback.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                                {allFeedback.length} responses
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {allFeedback.map((f, i) => (
                                    <motion.div key={f.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                {f.name?.charAt(0)?.toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.name || 'Anonymous'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {f.role && <span>{f.role}</span>}
                                                    {f.role && <span>·</span>}
                                                    <span>{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 14, color: '#f59e0b' }}>
                                                        {'★'.repeat(f.ui_rating)}<span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - (f.ui_rating || 0))}</span>
                                                    </div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>UI</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-text)', lineHeight: 1 }}>{f.ease_rating}/5</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Ease</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: f.comments ? 10 : 0, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: f.pain_point === 'Yes, definitely' ? 'var(--accent-light)' : f.pain_point === 'Somewhat' ? 'var(--amber-light)' : 'var(--red-light)', color: f.pain_point === 'Yes, definitely' ? 'var(--accent-text)' : f.pain_point === 'Somewhat' ? 'var(--amber)' : 'var(--red)' }}>
                                                {f.pain_point}
                                            </span>
                                        </div>
                                        {f.comments && (
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                                                "{f.comments}"
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}