import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useIsMobile from '../hooks/useIsMobile';

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

function useScrollFade() {
    const [visible, setVisible] = useState({});
    useEffect(() => {
        const els = document.querySelectorAll('[data-fade]');
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => {
                if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.fade]: true }));
            }),
            { threshold: 0.15 }
        );
        els.forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, []);
    return visible;
}

export default function About() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isTablet = useIsMobile(1024);
    const visible = useScrollFade();

    const [dark] = useState(() => document.body.classList.contains('dark'));

    const bg = dark ? '#080808' : '#f8fafc';
    const bg2 = dark ? '#0f0f0f' : '#ffffff';
    const text = dark ? '#f1f5f9' : '#0f172a';
    const muted = dark ? '#94a3b8' : '#64748b';
    const border = dark ? '#ffffff12' : '#e2e8f0';
    const green = '#16a34a';
    const greenLight = dark ? '#16a34a18' : '#f0fdf4';
    const greenBorder = dark ? '#16a34a40' : '#bbf7d0';

    const fadeStyle = (key) => ({
        opacity: visible[key] ? 1 : 0,
        transform: visible[key] ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
    });

    return (
        <div style={{ background: bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: text }}>

            {/* ── NAV ── */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '16px 20px' : '20px 60px',
                borderBottom: `0.5px solid ${border}`,
                background: dark ? '#080808dd' : '#f8fafc',
                position: 'sticky', top: 0, zIndex: 100,
                backdropFilter: 'blur(12px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: green }} />
                    <span style={{ fontSize: 17, fontWeight: 800, color: text, letterSpacing: '-0.02em' }}>
                        Meeting<span style={{ color: green }}>Debt</span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/login')} style={{ padding: '8px 18px', borderRadius: 8, background: 'transparent', color: muted, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}>
                        Log in
                    </button>
                    <button onClick={() => navigate('/signup')} style={{ padding: '8px 18px', borderRadius: 8, background: green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                        Get started
                    </button>
                </div>
            </nav>

            {/* ── HERO ── */}
            <motion.section
                initial="hidden" animate="show" variants={stagger}
                style={{ padding: isMobile ? '72px 20px 56px' : '100px 60px 80px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}
            >
                <motion.div variants={fadeUp} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: greenLight, border: `1px solid ${greenBorder}`,
                    borderRadius: 999, padding: '5px 14px', marginBottom: 28,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: green }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        How it works
                    </span>
                </motion.div>

                <motion.h1 variants={fadeUp} style={{
                    fontSize: isMobile ? 36 : 64, fontWeight: 900,
                    lineHeight: 1.05, letterSpacing: isMobile ? -1 : -2.5,
                    color: text, margin: '0 0 20px',
                }}>
                    Your meetings make<br />
                    <span style={{ color: green }}>promises.</span> We make sure<br />
                    they're <span style={{ color: green }}>kept.</span>
                </motion.h1>

                <motion.p variants={fadeUp} style={{ fontSize: isMobile ? 16 : 19, color: muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
                    MeetingDebt is the tool that turns the commitments made in your meetings into tracked, assigned, followed-up tasks — automatically.
                </motion.p>

                <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/signup')} style={{
                        padding: '14px 32px', borderRadius: 10, background: green,
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                        boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
                    }}>
                        Start for free →
                    </button>
                    <button onClick={() => navigate('/')} style={{
                        padding: '14px 32px', borderRadius: 10, background: 'transparent',
                        color: muted, border: `1px solid ${border}`, cursor: 'pointer',
                        fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
                    }}>
                        See demo
                    </button>
                </motion.div>
            </motion.section>

            {/* ── THE PROBLEM ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '80px 60px', background: bg2, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div data-fade="problem" style={fadeStyle('problem')}>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>The problem</span>
                            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0 16px', letterSpacing: -1 }}>
                                Every team has this problem.
                            </h2>
                            <p style={{ fontSize: isMobile ? 15 : 17, color: muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                                You finish a meeting. Everyone leaves with good intentions. A week later — nothing happened.
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: 20,
                        }}>
                            {[
                                { icon: '😵', title: 'Action items get lost', desc: 'They live in someone\'s notes app or worse — nowhere at all. Out of sight, out of mind.' },
                                { icon: '🔁', title: 'You repeat meetings', desc: 'Next week\'s meeting starts with "so what happened with that thing we discussed?" Sound familiar?' },
                                { icon: '📉', title: 'Trust erodes slowly', desc: 'When commitments aren\'t kept, teams stop believing in each other. The real cost is culture.' },
                            ].map((card, i) => (
                                <div key={i} style={{
                                    padding: '24px', borderRadius: 14,
                                    background: dark ? '#1a1a1a' : '#fef2f2',
                                    border: `1px solid ${dark ? '#ef444420' : '#fecaca'}`,
                                }}>
                                    <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 8 }}>{card.title}</div>
                                    <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{card.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHAT IS IT ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '100px 60px', background: bg }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div data-fade="what" style={fadeStyle('what')}>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>What is MeetingDebt?</span>
                            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0 16px', letterSpacing: -1 }}>
                                Your team's commitment tracker.
                            </h2>
                            <p style={{ fontSize: isMobile ? 15 : 17, color: muted, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
                                Like financial debt, <strong style={{ color: text }}>meeting debt</strong> accumulates every time you leave a meeting without following through. MeetingDebt helps your team pay it off — one commitment at a time.
                            </p>
                        </div>

                        {/* Big stat row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: 16, marginBottom: 48,
                        }}>
                            {[
                                { stat: '23+', label: 'Teams using it' },
                                { stat: 'AI', label: 'Powered extraction' },
                                { stat: '< 30s', label: 'To extract all tasks' },
                                { stat: '0', label: 'Tasks forgotten' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    padding: '20px 16px', borderRadius: 14, textAlign: 'center',
                                    background: greenLight, border: `1px solid ${greenBorder}`,
                                }}>
                                    <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: green, letterSpacing: -1 }}>{s.stat}</div>
                                    <div style={{ fontSize: 12, color: muted, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '100px 60px', background: bg2, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div data-fade="how" style={fadeStyle('how')}>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>How it works</span>
                            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0', letterSpacing: -1 }}>
                                4 steps. That's it.
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                {
                                    step: '01', icon: '📋',
                                    title: 'Paste your meeting transcript',
                                    desc: 'After your meeting, copy the transcript from Zoom, Google Meet, Teams — wherever you meet. Paste it into MeetingDebt.',
                                    color: '#6366f1',
                                    colorLight: dark ? '#6366f110' : '#eef2ff',
                                },
                                {
                                    step: '02', icon: '✦',
                                    title: 'AI extracts every commitment',
                                    desc: 'Our AI reads through the conversation and pulls out every action item, deadline, and who said they\'d do what. In seconds.',
                                    color: green,
                                    colorLight: greenLight,
                                },
                                {
                                    step: '03', icon: '👥',
                                    title: 'Assign & track with your team',
                                    desc: 'Tasks are assigned to team members. Everyone sees their own tasks, managers see the full picture. Status updates in real time.',
                                    color: '#f59e0b',
                                    colorLight: dark ? '#f59e0b10' : '#fffbeb',
                                },
                                {
                                    step: '04', icon: '🔔',
                                    title: 'Get nudged before it\'s too late',
                                    desc: 'Automated email reminders go out daily. Overdue tasks get flagged. Nothing slips through the cracks.',
                                    color: '#ef4444',
                                    colorLight: dark ? '#ef444410' : '#fef2f2',
                                },
                            ].map((item, i, arr) => (
                                <div key={i} style={{ display: 'flex', gap: isMobile ? 16 : 32, alignItems: 'flex-start', position: 'relative', paddingBottom: i < arr.length - 1 ? 40 : 0 }}>
                                    {/* Connector line */}
                                    {i < arr.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            left: isMobile ? 23 : 31,
                                            top: isMobile ? 52 : 60,
                                            width: 2, height: isMobile ? 'calc(100% - 52px)' : 'calc(100% - 60px)',
                                            background: `linear-gradient(to bottom, ${item.color}60, transparent)`,
                                        }} />
                                    )}
                                    {/* Icon circle */}
                                    <div style={{
                                        width: isMobile ? 48 : 64, height: isMobile ? 48 : 64,
                                        borderRadius: '50%', flexShrink: 0,
                                        background: item.colorLight,
                                        border: `2px solid ${item.color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: isMobile ? 20 : 24, zIndex: 1,
                                    }}>
                                        {item.icon}
                                    </div>
                                    {/* Content */}
                                    <div style={{ paddingTop: isMobile ? 8 : 14 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                                            Step {item.step}
                                        </div>
                                        <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: text, marginBottom: 8 }}>{item.title}</div>
                                        <div style={{ fontSize: isMobile ? 14 : 15, color: muted, lineHeight: 1.7, maxWidth: 520 }}>{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WHO IT'S FOR ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '100px 60px', background: bg }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div data-fade="who" style={fadeStyle('who')}>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Who it's for</span>
                            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0', letterSpacing: -1 }}>
                                Built for every team, every size.
                            </h2>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: 20,
                        }}>
                            {[
                                {
                                    icon: '🏢', role: 'Managers & Team Leads',
                                    color: '#6366f1',
                                    points: [
                                        'See every commitment across the whole team',
                                        'Know instantly who\'s overdue',
                                        'Stop chasing people for updates',
                                        'Build accountability without micromanaging',
                                    ],
                                },
                                {
                                    icon: '👩‍💻', role: 'Team Members',
                                    color: green,
                                    points: [
                                        'Always know what you promised',
                                        'Get reminded before deadlines',
                                        'Update your status in one click',
                                        'No more "I forgot you asked me that"',
                                    ],
                                },
                                {
                                    icon: '🧘', role: 'Solo Workers',
                                    color: '#f59e0b',
                                    points: [
                                        'Track personal commitments too',
                                        'Daily digest of your open tasks',
                                        'Custom deadlines and priorities',
                                        'Your own space, separate from team',
                                    ],
                                },
                            ].map((card, i) => (
                                <div key={i} style={{
                                    padding: 28, borderRadius: 16,
                                    background: bg2,
                                    border: `1px solid ${border}`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${card.color}20`; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ fontSize: 32, marginBottom: 14 }}>{card.icon}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 16 }}>{card.role}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {card.points.map((p, j) => (
                                            <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: card.color, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                                                </div>
                                                <span style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>{p}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '100px 60px', background: bg2, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div data-fade="features" style={fadeStyle('features')}>
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Features</span>
                            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0', letterSpacing: -1 }}>
                                Everything your team needs.
                            </h2>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                            gap: 16,
                        }}>
                            {[
                                { icon: '✦', title: 'AI Task Extraction', desc: 'Paste any transcript — Claude AI pulls out every commitment, owner, and deadline automatically.' },
                                { icon: '📊', title: 'Team Dashboard', desc: 'Real-time view of all open, overdue, and completed commitments across your entire workspace.' },
                                { icon: '📬', title: 'Smart Email Nudges', desc: 'Daily digest emails for each team member. Overdue alerts to managers. All personalised.' },
                                { icon: '💬', title: 'AI Chat Assistant', desc: 'Ask "who\'s overdue?" or "summarise last week\'s tasks" in plain English. Get instant answers.' },
                                { icon: '🗂', title: 'Personal Task Tracker', desc: 'Track personal commitments separately from team tasks. Your private space.' },
                                { icon: '🔒', title: 'Role-Based Access', desc: 'Managers see everything. Members see their tasks. Everyone sees what they need to.' },
                            ].map((f, i) => (
                                <div key={i} style={{
                                    padding: '22px 20px', borderRadius: 14,
                                    background: bg,
                                    border: `1px solid ${border}`,
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: greenLight, border: `1px solid ${greenBorder}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, marginBottom: 14, color: green, fontWeight: 700,
                                    }}>
                                        {f.icon}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>{f.title}</div>
                                    <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── THE PITCH ── */}
            <section style={{ padding: isMobile ? '56px 20px' : '100px 60px', background: bg }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <div data-fade="pitch" style={fadeStyle('pitch')}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The bigger picture</span>
                        <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: text, margin: '10px 0 20px', letterSpacing: -1, lineHeight: 1.15 }}>
                            Meetings cost companies<br />
                            <span style={{ color: green }}>$37 billion</span> a year.
                        </h2>
                        <p style={{ fontSize: isMobile ? 15 : 17, color: muted, lineHeight: 1.8, marginBottom: 20, maxWidth: 600, margin: '0 auto 20px' }}>
                            Most of that waste isn't the meeting itself — it's the follow-through that never happens. Commitments made in rooms that evaporate the moment everyone closes their laptops.
                        </p>
                        <p style={{ fontSize: isMobile ? 15 : 17, color: muted, lineHeight: 1.8, maxWidth: 600, margin: '0 auto 48px' }}>
                            MeetingDebt is the missing layer between your meetings and your results. We don't replace your tools — we make sure the promises made in them actually get done.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: 16, marginBottom: 56,
                        }}>
                            {[
                                { num: '71%', label: 'of meetings are considered unproductive by employees', src: 'Harvard Business Review' },
                                { num: '55%', label: 'of action items from meetings are never completed', src: 'MIT Sloan' },
                                { num: '4h', label: 'average time managers spend in meetings per day', src: 'Atlassian' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    padding: '24px 20px', borderRadius: 14,
                                    background: bg2, border: `1px solid ${border}`,
                                }}>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: green, letterSpacing: -1, marginBottom: 8 }}>{s.num}</div>
                                    <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 8 }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8', fontStyle: 'italic' }}>— {s.src}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{
                padding: isMobile ? '56px 20px' : '100px 60px',
                background: dark ? '#0a1a0a' : '#f0fdf4',
                borderTop: `1px solid ${greenBorder}`,
                textAlign: 'center',
            }}>
                <div data-fade="cta" style={{ ...fadeStyle('cta'), maxWidth: 600, margin: '0 auto' }}>
                    <div style={{ fontSize: 40, marginBottom: 20 }}>✦</div>
                    <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 900, color: text, margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.1 }}>
                        Stop losing track.<br />Start keeping promises.
                    </h2>
                    <p style={{ fontSize: isMobile ? 15 : 17, color: muted, lineHeight: 1.7, marginBottom: 36 }}>
                        Free to start. No credit card. Works with any meeting tool.
                    </p>
                    <button onClick={() => navigate('/signup')} style={{
                        padding: '16px 40px', borderRadius: 12, background: green,
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                        boxShadow: '0 6px 30px rgba(22,163,74,0.4)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(22,163,74,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(22,163,74,0.4)'; }}
                    >
                        Get started — it's free →
                    </button>
                    <p style={{ fontSize: 12, color: dark ? '#475569' : '#94a3b8', marginTop: 16 }}>
                        Join 23+ teams already using MeetingDebt
                    </p>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
                padding: isMobile ? '24px 20px' : '28px 60px',
                borderTop: `1px solid ${border}`,
                background: bg2,
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: green }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Meeting<span style={{ color: green }}>Debt</span></span>
                    <span style={{ fontSize: 13, color: muted, marginLeft: 8 }}>— Built with ☕ by Arul</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, color: muted }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/feedback')}>Feedback</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
                </div>
            </footer>
        </div>
    );
}
