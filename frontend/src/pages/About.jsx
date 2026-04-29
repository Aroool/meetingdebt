import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCounter(target, duration = 1800, start = false) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const isNum = typeof target === 'number';
        const num = isNum ? target : parseFloat(target);
        function step(ts) {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(eased * num));
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }, [start, target, duration]);
    return val;
}

// ── Intersection observer fade ────────────────────────────────────────────────
function useFade(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

function FadeSection({ children, delay = 0, style = {} }) {
    const [ref, visible] = useFade();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(36px)',
            transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
            ...style,
        }}>
            {children}
        </div>
    );
}

// ── Stat card with animated counter ──────────────────────────────────────────
function StatCard({ stat, suffix = '', label, color, bg, border }) {
    const [ref, visible] = useFade();
    const num = parseFloat(stat);
    const counted = useCounter(num, 1600, visible);
    const isDecimal = String(stat).includes('.');
    const display = isDecimal ? counted.toFixed(1) : String(counted);
    return (
        <div ref={ref} style={{ padding: '28px 20px', borderRadius: 16, textAlign: 'center', background: bg, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 42, fontWeight: 900, color, letterSpacing: -2, lineHeight: 1 }}>
                {visible ? display : '0'}{suffix}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>{label}</div>
        </div>
    );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FAQ({ q, a, border, bg, text, muted }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: `1px solid ${border}`, overflow: 'hidden' }}>
            <button onClick={() => setOpen(o => !o)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
            }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: text }}>{q}</span>
                <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
                    style={{ fontSize: 22, color: '#16a34a', flexShrink: 0, marginLeft: 16, lineHeight: 1 }}>+</motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p style={{ fontSize: 14, color: muted, lineHeight: 1.8, paddingBottom: 20, margin: 0 }}>{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function About() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isTablet = useIsMobile(1024);
    const [dark] = useState(() => document.body.classList.contains('dark'));
    const [demoStep, setDemoStep] = useState(0);

    const bg     = dark ? '#080808' : '#f8fafc';
    const bg2    = dark ? '#0f0f0f' : '#ffffff';
    const bg3    = dark ? '#141414' : '#f1f5f9';
    const text   = dark ? '#f1f5f9' : '#0f172a';
    const muted  = dark ? '#94a3b8' : '#64748b';
    const border = dark ? '#ffffff12' : '#e2e8f0';
    const green  = '#16a34a';
    const gLight = dark ? '#16a34a18' : '#f0fdf4';
    const gBorder= dark ? '#16a34a40' : '#bbf7d0';

    // AI demo — transcript lines with tasks highlighted one by one
    const transcript = [
        { text: '"Alright, so Arjun will handle the client deck by Friday."', task: true,  extracted: 'Arjun → Client deck · Due Fri' },
        { text: '"Priya, can you follow up with the design team on the mockups?"', task: true,  extracted: 'Priya → Follow up with design · ASAP' },
        { text: '"We should probably revisit the pricing too."', task: false, extracted: null },
        { text: '"I\'ll take care of the budget review by end of month."', task: true,  extracted: 'You → Budget review · End of month' },
        { text: '"Great, let\'s sync again Thursday at 3."', task: false, extracted: null },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setDemoStep(s => (s + 1) % (transcript.length + 1));
        }, 1400);
        return () => clearInterval(timer);
    }, []);

    const S = {
        section: (bg_) => ({
            padding: isMobile ? '64px 20px' : '100px 60px',
            background: bg_ || bg,
        }),
        label: (color = green) => ({
            fontSize: 11, fontWeight: 700, color,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 12, display: 'block',
        }),
        h2: {
            fontSize: isMobile ? 30 : 46, fontWeight: 900,
            color: text, margin: '0 0 16px', letterSpacing: -1.5, lineHeight: 1.05,
        },
        sub: {
            fontSize: isMobile ? 15 : 17, color: muted,
            lineHeight: 1.75, maxWidth: 580, margin: '0 auto',
        },
    };

    return (
        <div style={{ background: bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: text, overflowX: 'hidden' }}>

            {/* ── NAV ── */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '16px 20px' : '18px 60px',
                borderBottom: `1px solid ${border}`,
                background: dark ? 'rgba(8,8,8,0.85)' : 'rgba(248,250,252,0.85)',
                position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: green }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: text, letterSpacing: '-0.02em' }}>
                        Meeting<span style={{ color: green }}>Debt</span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: muted, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>Log in</button>
                    <button onClick={() => navigate('/signup')} style={{ padding: '8px 18px', borderRadius: 8, background: green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(22,163,74,0.35)' }}>Get started</button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{
                ...S.section(bg),
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingBottom: isMobile ? 56 : 80,
            }}>
                {/* Background glow */}
                <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(22,163,74,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: gLight, border: `1px solid ${gBorder}`, borderRadius: 999, padding: '5px 16px', marginBottom: 28 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: green, animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live product · 23+ teams using it</span>
                    </div>

                    <h1 style={{ fontSize: isMobile ? 38 : 72, fontWeight: 900, lineHeight: 1.02, letterSpacing: isMobile ? -1.5 : -3, color: text, margin: '0 0 24px' }}>
                        Your meetings make<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>promises.</span><br />
                        We make sure they're kept.
                    </h1>

                    <p style={{ fontSize: isMobile ? 16 : 20, color: muted, lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
                        MeetingDebt turns every commitment made in your meetings into tracked, assigned, followed-up tasks — powered by AI.
                    </p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/signup')}
                            style={{ padding: '15px 36px', borderRadius: 12, background: green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 6px 28px rgba(22,163,74,0.4)' }}>
                            Start for free →
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/')}
                            style={{ padding: '15px 32px', borderRadius: 12, background: 'transparent', color: muted, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 15, fontWeight: 500, fontFamily: 'inherit' }}>
                            See demo
                        </motion.button>
                    </div>
                </motion.div>

                {/* App mockup card */}
                <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
                    style={{ maxWidth: 760, margin: isMobile ? '48px auto 0' : '64px auto 0', position: 'relative' }}>
                    <div style={{
                        borderRadius: 20, overflow: 'hidden',
                        border: `1px solid ${border}`,
                        boxShadow: dark ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' : '0 32px 80px rgba(0,0,0,0.12)',
                        background: bg2,
                    }}>
                        {/* Fake browser chrome */}
                        <div style={{ background: bg3, padding: '12px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
                            </div>
                            <div style={{ flex: 1, background: dark ? '#1e1e1e' : '#e2e8f0', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: muted, textAlign: 'center' }}>
                                meetingdebt.com/dashboard
                            </div>
                        </div>
                        {/* Dashboard mockup */}
                        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'Open', count: 12, color: '#f59e0b', bg: dark ? '#f59e0b10' : '#fffbeb', border_: dark ? '#f59e0b30' : '#fde68a' },
                                { label: 'Overdue', count: 4, color: '#ef4444', bg: dark ? '#ef444410' : '#fef2f2', border_: dark ? '#ef444430' : '#fecaca' },
                                { label: 'Done this week', count: 8, color: green, bg: gLight, border_: gBorder },
                            ].map((c, i) => (
                                <div key={i} style={{ padding: '16px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border_}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</div>
                                    <div style={{ fontSize: 32, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.count}</div>
                                    <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>tasks</div>
                                </div>
                            ))}
                        </div>
                        {/* Task rows */}
                        <div style={{ padding: '0 20px 20px' }}>
                            {[
                                { task: 'Send proposal to client', owner: 'Arjun', due: 'Tomorrow', status: 'pending', color: '#f59e0b' },
                                { task: 'Review Q2 budget', owner: 'Priya', due: 'Overdue', status: 'overdue', color: '#ef4444' },
                                { task: 'Update onboarding docs', owner: 'You', due: 'Next week', status: 'done', color: green },
                            ].map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: bg3, marginBottom: 8, border: `1px solid ${border}` }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: text, marginBottom: 2 }}>{t.task}</div>
                                        <div style={{ fontSize: 11, color: muted }}>👤 {t.owner} · 📅 {t.due}</div>
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: t.status === 'done' ? gLight : t.status === 'overdue' ? (dark ? '#ef444415' : '#fef2f2') : (dark ? '#f59e0b15' : '#fffbeb'), color: t.color, border: `1px solid ${t.color}30`, whiteSpace: 'nowrap', marginLeft: 12 }}>
                                        {t.status === 'done' ? '✓ Done' : t.status === 'overdue' ? '⚠ Overdue' : '● Pending'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Floating badge */}
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: -16, right: isMobile ? 8 : -20, background: green, color: '#fff', borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 700, boxShadow: '0 8px 24px rgba(22,163,74,0.4)' }}>
                        ✦ 3 tasks extracted
                    </motion.div>
                </motion.div>
            </section>

            {/* ── THE PROBLEM ── */}
            <section style={{ ...S.section(bg2), borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 940, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
                            <span style={S.label('#ef4444')}>The problem</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Sound familiar?</h2>
                            <p style={{ ...S.sub, textAlign: 'center' }}>Every team goes through this. Every single week.</p>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
                        {[
                            { icon: '😵‍💫', title: '"Wait, who was doing that?"', desc: 'Action items live in someone\'s notebook, someone\'s head, or nowhere at all. By next week they\'re gone.', color: '#ef4444', bg_: dark ? '#ef444410' : '#fef2f2', border_: dark ? '#ef444430' : '#fecaca' },
                            { icon: '🔁', title: '"Let\'s circle back on this."', desc: 'The next meeting starts with the same items. Nothing moved. You\'re paying for the same hour twice.', color: '#f59e0b', bg_: dark ? '#f59e0b10' : '#fffbeb', border_: dark ? '#f59e0b30' : '#fde68a' },
                            { icon: '📉', title: '"We talked about this already."', desc: 'When promises aren\'t kept, trust erodes. Quietly at first, then very loudly. The real cost is culture.', color: '#8b5cf6', bg_: dark ? '#8b5cf610' : '#f5f3ff', border_: dark ? '#8b5cf630' : '#ddd6fe' },
                        ].map((c, i) => (
                            <FadeSection key={i} delay={i * 0.1}>
                                <motion.div whileHover={{ y: -4 }} style={{ padding: 28, borderRadius: 16, background: c.bg_, border: `1px solid ${c.border_}`, height: '100%' }}>
                                    <div style={{ fontSize: 36, marginBottom: 14 }}>{c.icon}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginBottom: 10 }}>{c.title}</div>
                                    <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.7 }}>{c.desc}</div>
                                </motion.div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AI DEMO ── */}
            <section style={{ ...S.section(bg), position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${dark ? 'rgba(22,163,74,0.07)' : 'rgba(22,163,74,0.05)'} 0%, transparent 65%)`, pointerEvents: 'none' }} />
                <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={S.label()}>AI in action</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Paste a transcript.<br />Get instant tasks.</h2>
                            <p style={{ ...S.sub, textAlign: 'center' }}>Watch how MeetingDebt reads your meeting and pulls out every commitment automatically.</p>
                        </div>
                    </FadeSection>

                    <FadeSection delay={0.15}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                            {/* Transcript panel */}
                            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}`, background: bg2 }}>
                                <div style={{ padding: '12px 16px', background: bg3, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: muted }}>meeting_transcript.txt</span>
                                </div>
                                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {transcript.map((line, i) => (
                                        <motion.div key={i}
                                            animate={{ background: i < demoStep && line.task ? (dark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)') : 'transparent' }}
                                            transition={{ duration: 0.4 }}
                                            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${i < demoStep && line.task ? gBorder : 'transparent'}` }}>
                                            <p style={{ fontSize: 12, color: i < demoStep ? text : muted, margin: 0, lineHeight: 1.6, fontStyle: 'italic', transition: 'color 0.4s' }}>
                                                {line.text}
                                            </p>
                                            {i < demoStep && line.task && (
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: green, color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
                                                    ✦ Task detected
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Extracted tasks panel */}
                            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${gBorder}`, background: gLight }}>
                                <div style={{ padding: '12px 16px', background: dark ? '#16a34a20' : '#dcfce7', borderBottom: `1px solid ${gBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: green, animation: 'pulse 2s infinite' }} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: green }}>✦ AI extracting tasks…</span>
                                </div>
                                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                                    {transcript.map((line, i) => (
                                        line.task && i < demoStep ? (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4 }}
                                                style={{ padding: '12px 14px', borderRadius: 10, background: bg2, border: `1px solid ${border}` }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{line.extracted}</div>
                                            </motion.div>
                                        ) : null
                                    ))}
                                    {demoStep === 0 && (
                                        <div style={{ fontSize: 13, color: muted, textAlign: 'center', marginTop: 40 }}>
                                            Tasks will appear here…
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </FadeSection>
                </div>
            </section>

            {/* ── BEFORE / AFTER ── */}
            <section style={{ ...S.section(bg2), borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={S.label()}>Before vs after</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>The difference is night and day.</h2>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
                        {/* Before */}
                        <FadeSection>
                            <div style={{ padding: 28, borderRadius: 16, background: dark ? '#1a0a0a' : '#fef2f2', border: `1px solid ${dark ? '#ef444430' : '#fecaca'}` }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>😩 Before MeetingDebt</div>
                                {[
                                    'Action items buried in chat',
                                    'No one knows who owns what',
                                    '"Remind me" messages on Slack',
                                    'Manager chases everyone manually',
                                    'Tasks forgotten by next week',
                                    'Same meeting repeated again',
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: dark ? '#ef444420' : '#fee2e2', border: '1px solid #ef444450', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: 9, color: '#ef4444' }}>✕</span>
                                        </div>
                                        <span style={{ fontSize: 13.5, color: muted }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeSection>
                        {/* After */}
                        <FadeSection delay={0.1}>
                            <div style={{ padding: 28, borderRadius: 16, background: gLight, border: `1px solid ${gBorder}` }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>✦ After MeetingDebt</div>
                                {[
                                    'Every task captured automatically',
                                    'Assigned to the right person',
                                    'Email nudges sent automatically',
                                    'Dashboard gives full visibility',
                                    'Deadlines tracked, nothing missed',
                                    'Meetings actually move things forward',
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: dark ? '#16a34a20' : '#dcfce7', border: `1px solid ${gBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: 9, color: green }}>✓</span>
                                        </div>
                                        <span style={{ fontSize: 13.5, color: muted }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeSection>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ ...S.section(bg) }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
                            <span style={S.label()}>How it works</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>From meeting to done<br />in 4 steps.</h2>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {[
                            { step: '01', icon: '📋', title: 'Paste your transcript', desc: 'Copy from Zoom, Google Meet, Teams, or any tool. Paste it in. That\'s step one done.', color: '#6366f1', colorLight: dark ? '#6366f115' : '#eef2ff', colorBorder: dark ? '#6366f135' : '#c7d2fe' },
                            { step: '02', icon: '✦',  title: 'AI extracts every commitment', desc: 'Claude AI scans the conversation and pulls out every action item, who said it, and when it\'s due. In seconds.', color: green, colorLight: gLight, colorBorder: gBorder },
                            { step: '03', icon: '👥', title: 'Assign & track together', desc: 'Each task is assigned to a team member. Everyone has their own view. Managers see everything. Members see theirs.', color: '#f59e0b', colorLight: dark ? '#f59e0b12' : '#fffbeb', colorBorder: dark ? '#f59e0b35' : '#fde68a' },
                            { step: '04', icon: '🔔', title: 'Automated nudges keep it alive', desc: 'Daily email digests. Overdue alerts to managers. Nothing slips, no one has to chase.', color: '#ef4444', colorLight: dark ? '#ef444412' : '#fef2f2', colorBorder: dark ? '#ef444435' : '#fecaca' },
                        ].map((item, i, arr) => (
                            <FadeSection key={i} delay={i * 0.08}>
                                <div style={{ display: 'flex', gap: isMobile ? 16 : 28, alignItems: 'flex-start', position: 'relative', paddingBottom: i < arr.length - 1 ? 44 : 0 }}>
                                    {i < arr.length - 1 && (
                                        <div style={{ position: 'absolute', left: isMobile ? 27 : 35, top: isMobile ? 58 : 68, width: 2, height: isMobile ? 'calc(100% - 52px)' : 'calc(100% - 62px)', background: `linear-gradient(to bottom, ${item.color}50, transparent)` }} />
                                    )}
                                    <div style={{ width: isMobile ? 56 : 72, height: isMobile ? 56 : 72, borderRadius: '50%', flexShrink: 0, background: item.colorLight, border: `2px solid ${item.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 22 : 28, zIndex: 1, boxShadow: `0 4px 20px ${item.color}20` }}>
                                        {item.icon}
                                    </div>
                                    <div style={{ paddingTop: isMobile ? 10 : 18 }}>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: item.color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Step {item.step}</div>
                                        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: text, marginBottom: 8, letterSpacing: -0.5 }}>{item.title}</div>
                                        <div style={{ fontSize: isMobile ? 14 : 15, color: muted, lineHeight: 1.75, maxWidth: 500 }}>{item.desc}</div>
                                    </div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section style={{ ...S.section(bg2), borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={S.label()}>By the numbers</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Real product. Real users.</h2>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16 }}>
                        <StatCard stat={23} suffix="+" label="Teams & users signed up" color={green} bg={gLight} border={gBorder} />
                        <StatCard stat={37} suffix="B" label="$37B lost yearly to unproductive meetings" color="#ef4444" bg={dark ? '#ef444410' : '#fef2f2'} border={dark ? '#ef444430' : '#fecaca'} />
                        <StatCard stat={55} suffix="%" label="of meeting action items never get done" color="#f59e0b" bg={dark ? '#f59e0b10' : '#fffbeb'} border={dark ? '#f59e0b30' : '#fde68a'} />
                        <StatCard stat={30} suffix="s" label="to extract all tasks from a transcript" color="#6366f1" bg={dark ? '#6366f110' : '#eef2ff'} border={dark ? '#6366f130' : '#c7d2fe'} />
                    </div>
                </div>
            </section>

            {/* ── WHO IT'S FOR ── */}
            <section style={{ ...S.section(bg) }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={S.label()}>Who it's for</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Built for every role,<br />every team size.</h2>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 20 }}>
                        {[
                            { icon: '🏢', role: 'Managers & Team Leads', color: '#6366f1', points: ['Full team visibility in one dashboard', 'Know who\'s overdue without asking', 'Stop chasing — let nudges do it', 'Build accountability, not anxiety'] },
                            { icon: '👩‍💻', role: 'Team Members', color: green, points: ['Always know what you committed to', 'Daily reminders before deadlines', 'Update status in one click', 'No more "I forgot you asked me"'] },
                            { icon: '🧘', role: 'Solo Workers', color: '#f59e0b', points: ['Track personal commitments too', 'Private tasks separate from team', 'Custom deadlines and priorities', 'Your own AI-powered assistant'] },
                        ].map((c, i) => (
                            <FadeSection key={i} delay={i * 0.1}>
                                <motion.div whileHover={{ y: -6, boxShadow: `0 20px 48px ${c.color}18` }}
                                    style={{ padding: 28, borderRadius: 18, background: bg2, border: `1px solid ${border}`, transition: 'box-shadow 0.3s', height: '100%' }}>
                                    <div style={{ fontSize: 36, marginBottom: 14 }}>{c.icon}</div>
                                    <div style={{ fontSize: 17, fontWeight: 800, color: text, marginBottom: 18 }}>{c.role}</div>
                                    {c.points.map((p, j) => (
                                        <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 11 }}>
                                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: c.color, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                                            </div>
                                            <span style={{ fontSize: 13.5, color: muted, lineHeight: 1.5 }}>{p}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MARKET OPPORTUNITY ── */}
            <section style={{ ...S.section(bg2), borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
                    <FadeSection>
                        <span style={S.label()}>The bigger picture</span>
                        <h2 style={{ ...S.h2, textAlign: 'center' }}>A $37 billion problem<br />with no real solution. <span style={{ color: green }}>Until now.</span></h2>
                        <p style={{ ...S.sub, textAlign: 'center', marginBottom: 48 }}>Businesses run on meetings. Meetings run on promises. And promises — without a system — are just wishful thinking.</p>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16 }}>
                        {[
                            { stat: '71%', label: 'of meetings are considered unproductive', src: 'Harvard Business Review' },
                            { stat: '55%', label: 'of action items from meetings never get done', src: 'MIT Sloan' },
                            { stat: '4hrs', label: 'average daily time managers spend in meetings', src: 'Atlassian Research' },
                        ].map((s, i) => (
                            <FadeSection key={i} delay={i * 0.1}>
                                <div style={{ padding: '28px 20px', borderRadius: 16, background: bg, border: `1px solid ${border}` }}>
                                    <div style={{ fontSize: 40, fontWeight: 900, color: green, letterSpacing: -2, marginBottom: 10 }}>{s.stat}</div>
                                    <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.6, marginBottom: 10 }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: dark ? '#374151' : '#94a3b8', fontStyle: 'italic' }}>— {s.src}</div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section style={{ ...S.section(bg) }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={S.label()}>Features</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Everything your team needs.<br />Nothing they don't.</h2>
                        </div>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 16 }}>
                        {[
                            { icon: '✦', title: 'AI Task Extraction', desc: 'Claude AI reads your transcript and pulls out every commitment, owner and deadline in seconds.' },
                            { icon: '📊', title: 'Team Dashboard', desc: 'Real-time view of all open, overdue and completed tasks across your workspace.' },
                            { icon: '📬', title: 'Smart Email Nudges', desc: 'Personalised daily digests per person. Overdue alerts go directly to managers.' },
                            { icon: '💬', title: 'AI Chat Assistant', desc: 'Ask "who\'s overdue?" or "summarise last week" in plain English. Instant answers.' },
                            { icon: '🗂', title: 'Personal Task Tracker', desc: 'Keep personal commitments private, separate from team tasks. Your own space.' },
                            { icon: '🔒', title: 'Role-Based Access', desc: 'Managers see all. Members see theirs. Everyone gets exactly what they need.' },
                        ].map((f, i) => (
                            <FadeSection key={i} delay={(i % 3) * 0.08}>
                                <motion.div whileHover={{ y: -4 }} style={{ padding: '22px 20px', borderRadius: 14, background: bg2, border: `1px solid ${border}` }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: gLight, border: `1px solid ${gBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, marginBottom: 14, color: green, fontWeight: 700 }}>{f.icon}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>{f.title}</div>
                                    <div style={{ fontSize: 13, color: muted, lineHeight: 1.65 }}>{f.desc}</div>
                                </motion.div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section style={{ ...S.section(bg2), borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 52 }}>
                            <span style={S.label()}>FAQ</span>
                            <h2 style={{ ...S.h2, textAlign: 'center' }}>Questions you probably have.</h2>
                        </div>
                    </FadeSection>
                    <FadeSection delay={0.1}>
                        {[
                            { q: 'Do I need to change how we run meetings?', a: 'Not at all. You keep meeting however you want. After the meeting, just paste the transcript and MeetingDebt handles everything else. No new habits needed.' },
                            { q: 'Which meeting tools does it work with?', a: 'Any tool that gives you a transcript — Zoom, Google Meet, Microsoft Teams, Otter.ai, Fireflies, even a manually typed summary. If it\'s text, MeetingDebt can read it.' },
                            { q: 'How accurate is the AI extraction?', a: 'Very. The AI is built on Claude (by Anthropic) and is specifically prompted to identify commitments, owners, and deadlines. You can always edit tasks after extraction.' },
                            { q: 'Is my data private?', a: 'Yes. Your transcripts and tasks are stored securely and never shared. Each workspace is fully isolated. We don\'t train AI models on your data.' },
                            { q: 'Is it really free?', a: 'Yes, free to get started. No credit card required. We\'re in early access — early users get full features at no cost while we build out the product.' },
                            { q: 'What if I\'m the only user on my team?', a: 'Solo mode is built in. Track personal commitments, set your own deadlines, and get daily email reminders. MeetingDebt works for a team of one just as well.' },
                        ].map((faq, i) => (
                            <FAQ key={i} q={faq.q} a={faq.a} border={border} bg={bg} text={text} muted={muted} />
                        ))}
                    </FadeSection>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ ...S.section(dark ? '#0a160a' : '#f0fdf4'), borderTop: `1px solid ${gBorder}`, textAlign: 'center' }}>
                <div style={{ maxWidth: 620, margin: '0 auto' }}>
                    <FadeSection>
                        <motion.div animate={{ rotate: [0, 10, -10, 10, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                            style={{ fontSize: 52, marginBottom: 24, display: 'inline-block' }}>✦</motion.div>
                        <h2 style={{ fontSize: isMobile ? 32 : 52, fontWeight: 900, color: text, margin: '0 0 20px', letterSpacing: -2, lineHeight: 1.05 }}>
                            Stop losing track.<br />
                            <span style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Start keeping promises.
                            </span>
                        </h2>
                        <p style={{ fontSize: isMobile ? 15 : 17, color: muted, lineHeight: 1.75, marginBottom: 40 }}>
                            Free to start. No credit card. Works with any meeting tool.<br />Set up in under 2 minutes.
                        </p>
                        <motion.button whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/signup')}
                            style={{ padding: '17px 44px', borderRadius: 14, background: green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 17, fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 8px 36px rgba(22,163,74,0.45)', letterSpacing: -0.3 }}>
                            Get started — it's free →
                        </motion.button>
                        <p style={{ fontSize: 12, color: dark ? '#374151' : '#94a3b8', marginTop: 16 }}>
                            Join 23+ teams already using MeetingDebt · Built by one person with ☕
                        </p>
                    </FadeSection>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ padding: isMobile ? '24px 20px' : '28px 60px', borderTop: `1px solid ${border}`, background: bg2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: green }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: text }}>Meeting<span style={{ color: green }}>Debt</span></span>
                    <span style={{ fontSize: 12, color: muted, marginLeft: 8 }}>— Made with ☕ by Arul</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: muted }}>
                    {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Feedback', '/feedback'], ['Home', '/']].map(([l, to]) => (
                        <span key={l} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = green}
                            onMouseLeave={e => e.currentTarget.style.color = muted}
                            onClick={() => navigate(to)}>{l}</span>
                    ))}
                </div>
            </footer>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.85); }
                }
            `}</style>
        </div>
    );
}
