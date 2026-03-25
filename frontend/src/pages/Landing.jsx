import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

// Scroll reveal wrapper
function Reveal({ children, delay = 0, y = 24 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}

// Animated transcript demo
const TRANSCRIPT_LINES = [
    { speaker: 'Sarah', text: "We need the pricing proposal sent by Friday." },
    { speaker: 'John', text: "I'll handle that, no problem." },
    { speaker: 'Sarah', text: "Marcus, can you fix the checkout bug?" },
    { speaker: 'Marcus', text: "Yes, I'll get it done tonight." },
    { speaker: 'Sarah', text: "Great. I'll schedule the client demo for Monday." },
];

const EXTRACTED = [
    { owner: 'John', task: 'Send pricing proposal to client', deadline: 'Friday', color: '#3b82f6' },
    { owner: 'Marcus', task: 'Fix the checkout bug', deadline: 'Tonight', color: '#8b5cf6' },
    { owner: 'Sarah', task: 'Schedule client demo', deadline: 'Monday', color: '#16a34a' },
];

function TranscriptDemo() {
    const [phase, setPhase] = useState('idle'); // idle | typing | extracting | done
    const [visibleLines, setVisibleLines] = useState(0);
    const [visibleCards, setVisibleCards] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    useEffect(() => {
        if (!inView || phase !== 'idle') return;
        setPhase('typing');
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= TRANSCRIPT_LINES.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setPhase('extracting');
                    setTimeout(() => {
                        setPhase('done');
                        let j = 0;
                        const cardInterval = setInterval(() => {
                            j++;
                            setVisibleCards(j);
                            if (j >= EXTRACTED.length) clearInterval(cardInterval);
                        }, 300);
                    }, 1200);
                }, 600);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [inView]);

    return (
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 860, margin: '0 auto' }}>
            {/* Transcript */}
            <div style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 14, padding: 20, minHeight: 280,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 11, color: '#475569', marginLeft: 8, fontFamily: 'monospace' }}>meeting_transcript.txt</span>
                </div>
                {TRANSCRIPT_LINES.slice(0, visibleLines).map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ marginBottom: 10 }}
                    >
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>
                            {line.speaker}:
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6, fontFamily: 'monospace' }}>
                            {line.text}
                        </span>
                    </motion.div>
                ))}
                {phase === 'typing' && visibleLines < TRANSCRIPT_LINES.length && (
                    <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        style={{ display: 'inline-block', width: 8, height: 14, background: '#16a34a', borderRadius: 1 }}
                    />
                )}
            </div>

            {/* Extracted commitments */}
            <div style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 14, padding: 20, minHeight: 280,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <AnimatePresence mode="wait">
                        {phase === 'extracting' ? (
                            <motion.div
                                key="extracting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    style={{ width: 14, height: 14, border: '2px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%' }}
                                />
                                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Claude is extracting...</span>
                            </motion.div>
                        ) : (
                            <motion.span
                                key="done"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}
                            >
                                {phase === 'done' ? '✓ Commitments extracted' : 'Waiting for transcript...'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {EXTRACTED.slice(0, visibleCards).map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                        style={{
                            background: '#1e293b', borderRadius: 10,
                            padding: '10px 14px', marginBottom: 10,
                            borderLeft: `3px solid ${item.color}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: item.color + '33', color: item.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 800
                            }}>
                                {item.owner[0]}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.owner}</span>
                            <span style={{
                                marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                                padding: '1px 7px', borderRadius: 20,
                                background: '#16a34a22', color: '#16a34a'
                            }}>
                                {item.deadline}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{item.task}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// Stats counter
function Counter({ to, duration = 1.5 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = to / (duration * 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= to) { setCount(to); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [inView, to, duration]);

    return <span ref={ref}>{count}</span>;
}

export default function Landing() {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/dashboard');
            else setChecking(false);
        });
    }, [navigate]);

    useEffect(() => {
        const handler = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    if (checking) return null;

    return (
        <div style={{ background: '#ffffff', color: '#0f172a', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .cta-btn { transition: all 0.2s; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.3); }
        .feature-card:hover { transform: translateY(-4px); border-color: #16a34a; }
        .feature-card { transition: all 0.2s; }
      `}</style>

            {/* Navbar */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 48px', height: 64,
                position: 'sticky', top: 0, zIndex: 50,
                background: scrollY > 20 ? 'rgba(255,255,255,0.95)' : 'transparent',
                backdropFilter: scrollY > 20 ? 'blur(12px)' : 'none',
                borderBottom: scrollY > 20 ? '1px solid #f1f5f9' : 'none',
                transition: 'all 0.3s',
            }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
                        Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', gap: 8 }}
                >
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            fontSize: 13, padding: '8px 18px', borderRadius: 8,
                            border: '1px solid #e2e8f0', background: 'transparent',
                            color: '#0f172a', cursor: 'pointer', fontWeight: 600,
                            fontFamily: 'inherit',
                        }}
                    >
                        Sign in
                    </button>
                    <button
                        className="cta-btn"
                        onClick={() => navigate('/signup')}
                        style={{
                            fontSize: 13, padding: '8px 18px', borderRadius: 8,
                            border: 'none', background: '#16a34a',
                            color: '#fff', cursor: 'pointer', fontWeight: 700,
                            fontFamily: 'inherit',
                        }}
                    >
                        Get started free →
                    </button>
                </motion.div>
            </nav>

            {/* Hero */}
            <div style={{
                padding: '100px 48px 80px',
                background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background grid */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: 'linear-gradient(#16a34a0a 1px, transparent 1px), linear-gradient(90deg, #16a34a0a 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#f0fdf4', color: '#16a34a',
                            fontSize: 12, fontWeight: 700,
                            padding: '5px 14px', borderRadius: 20, marginBottom: 28,
                            border: '1px solid #bbf7d0',
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}
                        />
                        AI-powered meeting accountability
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: 72, fontWeight: 900, lineHeight: 1.05,
                            letterSpacing: -3, marginBottom: 24,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        Your team said they'd do it.
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Now make sure they do.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            fontSize: 18, color: '#64748b', lineHeight: 1.7,
                            maxWidth: 520, margin: '0 auto 40px',
                        }}
                    >
                        Paste any meeting transcript. MeetingDebt extracts every commitment,
                        assigns it to the right person, and nudges them automatically when overdue.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}
                    >
                        <button
                            className="cta-btn"
                            onClick={() => navigate('/signup')}
                            style={{
                                fontSize: 15, padding: '14px 32px', borderRadius: 10,
                                border: 'none', background: '#16a34a', color: '#fff',
                                cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit',
                            }}
                        >
                            Start for free →
                        </button>
                        <button
                            onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                fontSize: 15, padding: '14px 24px', borderRadius: 10,
                                border: '1.5px solid #e2e8f0', background: '#fff',
                                color: '#0f172a', cursor: 'pointer', fontWeight: 600,
                                fontFamily: 'inherit',
                            }}
                        >
                            See it in action ↓
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        style={{ fontSize: 12, color: '#94a3b8' }}
                    >
                        No credit card · Free to start · Takes 30 seconds
                    </motion.div>
                </div>
            </div>

            {/* Stats bar */}
            <div style={{
                background: '#0f172a', padding: '32px 48px',
                display: 'flex', justifyContent: 'center', gap: 80,
            }}>
                {[
                    { value: 30, suffix: 's', label: 'to extract commitments' },
                    { value: 100, suffix: '%', label: 'automatic nudges' },
                    { value: 3, suffix: 'x', label: 'more follow-through' },
                ].map((s, i) => (
                    <Reveal key={i} delay={i * 0.1}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 40, fontWeight: 900, color: '#4ade80', letterSpacing: -2, lineHeight: 1 }}>
                                <Counter to={s.value} />{s.suffix}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                        </div>
                    </Reveal>
                ))}
            </div>

            {/* Live demo section */}
            <div id="demo" style={{ padding: '96px 48px', background: '#f8fafc' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <div style={{
                            display: 'inline-block', background: '#0f172a', color: '#4ade80',
                            fontSize: 11, fontWeight: 700, padding: '4px 14px',
                            borderRadius: 20, marginBottom: 16, letterSpacing: '0.05em',
                        }}>
                            LIVE DEMO
                        </div>
                        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, marginBottom: 12 }}>
                            Watch it work in real time
                        </div>
                        <div style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
                            Scroll down to see a meeting transcript get transformed into tracked commitments automatically.
                        </div>
                    </div>
                </Reveal>
                <TranscriptDemo />
            </div>

            {/* How it works */}
            <div style={{ padding: '96px 48px', background: '#fff' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, marginBottom: 12 }}>
                            Three steps. Zero effort.
                        </div>
                        <div style={{ fontSize: 16, color: '#64748b' }}>
                            From messy meeting to tracked commitments in under 30 seconds.
                        </div>
                    </div>
                </Reveal>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
                    {[
                        {
                            num: '01', icon: '📋',
                            title: 'Paste your transcript',
                            body: 'After any meeting, paste the transcript. Works with Zoom, Google Meet, Teams — any platform.',
                            color: '#3b82f6',
                        },
                        {
                            num: '02', icon: '🤖',
                            title: 'AI extracts commitments',
                            body: 'Claude reads the conversation and assigns every action item to the right person automatically.',
                            color: '#8b5cf6',
                        },
                        {
                            num: '03', icon: '🔔',
                            title: 'Nudges fire automatically',
                            body: 'When a deadline passes, MeetingDebt emails the person who made the commitment. No manual follow-up.',
                            color: '#16a34a',
                        },
                    ].map((step, i) => (
                        <Reveal key={i} delay={i * 0.15}>
                            <div
                                className="feature-card"
                                style={{
                                    background: '#fff', border: '1.5px solid #e2e8f0',
                                    borderRadius: 16, padding: 28,
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: step.color + '15', color: step.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, marginBottom: 16,
                                }}>
                                    {step.icon}
                                </div>
                                <div style={{
                                    fontSize: 11, fontWeight: 800, color: step.color,
                                    letterSpacing: '0.1em', marginBottom: 8,
                                }}>
                                    STEP {step.num}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{step.title}</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{step.body}</div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Viral loop section */}
            <div style={{ padding: '96px 48px', background: '#0f172a' }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div style={{
                                display: 'inline-block', background: '#16a34a22', color: '#4ade80',
                                fontSize: 11, fontWeight: 700, padding: '4px 14px',
                                borderRadius: 20, marginBottom: 16, letterSpacing: '0.05em',
                            }}>
                                THE VIRAL LOOP
                            </div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -1.5, marginBottom: 12 }}>
                                Every nudge acquires a new user
                            </div>
                            <div style={{ fontSize: 16, color: '#64748b' }}>
                                When someone gets nudged about their overdue task, they click the link and sign up.
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div style={{
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 14, padding: 24,
                        }}>
                            <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, fontFamily: 'monospace' }}>
                                From: noreply@meetingdebt.com · To: john@company.com
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                                ⚠️ You have an overdue commitment from Monday's meeting
                            </div>
                            <div style={{
                                background: '#0f172a', borderLeft: '3px solid #ef4444',
                                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                                    Send pricing proposal to client
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                    Deadline: Friday · 2 days overdue
                                </div>
                            </div>
                            <div style={{
                                display: 'inline-block', background: '#16a34a',
                                color: '#fff', padding: '10px 20px',
                                borderRadius: 8, fontSize: 13, fontWeight: 700,
                            }}>
                                View dashboard →
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>

            {/* Comparison */}
            <div style={{ padding: '96px 48px', background: '#fff' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, marginBottom: 12 }}>
                            Read.ai tells you what was said.
                        </div>
                        <div style={{
                            fontSize: 40, fontWeight: 900, letterSpacing: -1.5,
                            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            MeetingDebt makes sure it happens.
                        </div>
                    </div>
                </Reveal>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700, margin: '0 auto' }}>
                    {[
                        { label: 'Other tools', items: ['Records what was said', 'Generates meeting notes', 'Product ends when meeting ends'], bad: true },
                        { label: 'MeetingDebt', items: ['Extracts every commitment', 'Assigns to the right person', 'Nudges until it\'s done'], bad: false },
                    ].map((col, i) => (
                        <Reveal key={i} delay={i * 0.15}>
                            <div style={{
                                background: col.bad ? '#f8fafc' : '#f0fdf4',
                                border: `1.5px solid ${col.bad ? '#e2e8f0' : '#16a34a'}`,
                                borderRadius: 14, padding: 24,
                            }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 700, marginBottom: 16,
                                    color: col.bad ? '#64748b' : '#16a34a',
                                }}>
                                    {col.label}
                                </div>
                                {col.items.map((item, j) => (
                                    <div key={j} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 0', borderBottom: j < col.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        fontSize: 13, color: col.bad ? '#94a3b8' : '#0f172a',
                                    }}>
                                        <span style={{ fontSize: 14 }}>{col.bad ? '✗' : '✓'}</span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div style={{
                padding: '96px 48px', textAlign: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a1e 100%)',
            }}>
                <Reveal>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1.1, marginBottom: 20 }}>
                        Stop letting meeting<br />commitments disappear.
                    </div>
                    <div style={{ fontSize: 16, color: '#64748b', marginBottom: 36 }}>
                        Join teams who never miss a meeting commitment again.
                    </div>
                    <button
                        className="cta-btn"
                        onClick={() => navigate('/signup')}
                        style={{
                            fontSize: 16, padding: '16px 40px', borderRadius: 12,
                            border: 'none', background: '#16a34a', color: '#fff',
                            cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit',
                        }}
                    >
                        Get started free →
                    </button>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 16 }}>
                        No credit card required
                    </div>
                </Reveal>
            </div>

            {/* Footer */}
            <div style={{
                padding: '24px 48px', background: '#0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderTop: '1px solid #1e293b',
            }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
                    Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                </span>
                <span style={{ fontSize: 12, color: '#475569' }}>
                    © 2026 MeetingDebt. Making sure meeting commitments actually happen.
                </span>
            </div>
        </div>
    );
}