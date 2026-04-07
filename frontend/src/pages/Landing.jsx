import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../supabase';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
    {
        quote:
            'Replace this with a real user quote about how MeetingDebt helped the team follow through after meetings.',
        name: 'Pilot User',
        role: 'Product Manager',
    },
    {
        quote:
            'Replace this with a real user quote about clearer ownership, fewer dropped tasks, or better accountability.',
        name: 'Pilot User',
        role: 'Engineering Lead',
    },
    {
        quote:
            'Replace this with a real user quote about getting value from meeting transcripts instead of just summaries.',
        name: 'Pilot User',
        role: 'Operations Manager',
    },
];

export default function Landing() {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [dark, setDark] = useState(true);

    useEffect(() => {
        let ignore = false;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!ignore && session) navigate('/dashboard');
        });
        return () => {
            ignore = true;
        };
    }, [navigate]);

    function scrollTo(id) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.lp-fade-up', {
                opacity: 0,
                y: 28,
                duration: 0.75,
                stagger: 0.08,
                ease: 'power3.out',
            });

            gsap.utils.toArray('.lp-section-animate').forEach((section) => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 82%',
                    },
                    opacity: 0,
                    y: 32,
                    duration: 0.8,
                    ease: 'power3.out',
                });
            });

            gsap.to('.lp-orb-a', {
                y: -26,
                x: 18,
                duration: 8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            gsap.to('.lp-orb-b', {
                y: 20,
                x: -14,
                duration: 10,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 0.8,
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const theme = {
        bg: dark ? '#060806' : '#f7faf7',
        bgElevated: dark ? '#0b0f0b' : '#ffffff',
        bgSoft: dark ? '#0f1510' : '#f3f7f3',
        bgMuted: dark ? '#0d120d' : '#f8faf8',
        border: dark ? 'rgba(255,255,255,0.08)' : '#dfe7df',
        borderStrong: dark ? 'rgba(255,255,255,0.14)' : '#cfdccf',
        text: dark ? '#f5f7f5' : '#111827',
        textSoft: dark ? '#b2bbb2' : '#667085',
        textFaint: dark ? '#7d877d' : '#98a2b3',
        accent: '#16a34a',
        accentSoft: dark ? 'rgba(22,163,74,0.14)' : '#ecfdf3',
        accentBorder: dark ? 'rgba(22,163,74,0.32)' : 'rgba(22,163,74,0.18)',
        shadow: dark ? '0 24px 80px rgba(0,0,0,0.28)' : '0 24px 80px rgba(15,23,42,0.08)',
        divider: dark ? 'rgba(255,255,255,0.06)' : '#e4ebe4',
    };

    const S = {
        page: {
            background: theme.bg,
            color: theme.text,
            minHeight: '100vh',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
            transition: 'background 0.25s ease, color 0.25s ease',
            overflowX: 'hidden',
        },
        shell: {
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 24px',
        },
        nav: {
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backdropFilter: 'blur(14px)',
            background: dark ? 'rgba(6,8,6,0.82)' : 'rgba(247,250,247,0.86)',
            borderBottom: `1px solid ${theme.divider}`,
        },
        navInner: {
            maxWidth: 1180,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: -0.4,
            color: theme.text,
        },
        navLinks: {
            display: 'flex',
            gap: 22,
            alignItems: 'center',
        },
        navLink: {
            fontSize: 13,
            fontWeight: 600,
            color: theme.textSoft,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
        },
        navActions: {
            display: 'flex',
            alignItems: 'center',
            gap: 10,
        },
        ghostBtn: {
            padding: '10px 14px',
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.textSoft,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
        },
        primaryBtn: {
            padding: '12px 18px',
            borderRadius: 12,
            border: 'none',
            background: theme.accent,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 12px 28px rgba(22,163,74,0.22)',
        },
        hero: {
            position: 'relative',
            padding: '84px 0 56px',
            overflow: 'hidden',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 999,
            border: `1px solid ${theme.accentBorder}`,
            background: theme.accentSoft,
            color: dark ? '#73e29a' : '#15803d',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 24,
        },
        heroGrid: {
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.05fr) minmax(320px,0.95fr)',
            gap: 34,
            alignItems: 'center',
        },
        heroTitle: {
            fontSize: 66,
            lineHeight: 0.98,
            letterSpacing: -3,
            fontWeight: 900,
            marginBottom: 20,
            maxWidth: 660,
            color: theme.text,
        },
        heroSub: {
            fontSize: 17,
            lineHeight: 1.75,
            color: theme.textSoft,
            maxWidth: 590,
            marginBottom: 28,
        },
        heroActions: {
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 22,
        },
        proofLine: {
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            fontSize: 12.5,
            color: theme.textFaint,
        },
        heroCard: {
            background: `linear-gradient(180deg, ${dark ? 'rgba(12,16,12,0.92)' : '#ffffff'} 0%, ${theme.bgElevated} 100%)`,
            border: `1px solid ${theme.border}`,
            borderRadius: 24,
            boxShadow: theme.shadow,
            overflow: 'hidden',
        },
        section: {
            padding: '72px 0',
            borderTop: `1px solid ${theme.divider}`,
        },
        sectionHead: {
            marginBottom: 28,
            maxWidth: 700,
        },
        label: {
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: theme.accent,
            marginBottom: 12,
        },
        title: {
            fontSize: 42,
            lineHeight: 1.05,
            letterSpacing: -1.8,
            fontWeight: 900,
            color: theme.text,
            marginBottom: 12,
        },
        sub: {
            fontSize: 15,
            lineHeight: 1.75,
            color: theme.textSoft,
            maxWidth: 640,
        },
        card: {
            background: theme.bgElevated,
            border: `1px solid ${theme.border}`,
            borderRadius: 20,
            padding: 24,
            boxShadow: dark ? '0 18px 40px rgba(0,0,0,0.18)' : '0 18px 40px rgba(15,23,42,0.05)',
        },
    };

    return (
        <div ref={containerRef} style={S.page}>
            <style>{`
        .lp-grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .lp-grid-4 { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .lp-grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .lp-muted-hover:hover { color: ${theme.text}; }
        .lp-card-hover { transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease; }
        .lp-card-hover:hover { transform: translateY(-2px); border-color: ${theme.borderStrong}; }
        @media (max-width: 1100px) {
          .lp-hero-grid { grid-template-columns: 1fr !important; }
          .lp-grid-4 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 860px) {
          .lp-nav-links { display: none !important; }
          .lp-grid-3, .lp-grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .lp-shell { padding: 0 18px !important; }
          .lp-nav-inner { padding: 14px 18px !important; }
          .lp-title { font-size: 42px !important; letter-spacing: -1.8px !important; }
          .lp-section-title { font-size: 32px !important; letter-spacing: -1.1px !important; }
          .lp-hero-actions { flex-direction: column; align-items: stretch; }
          .lp-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

            <nav style={S.nav}>
                <div style={S.navInner} className="lp-nav-inner">
                    <div style={S.logo}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: theme.accent }} />
                        <span>Meeting</span>
                        <span style={{ color: theme.accent }}>Debt</span>
                    </div>

                    <div style={S.navLinks} className="lp-nav-links">
                        {[
                            ['Product', 'product'],
                            ['Proof', 'proof'],
                            ['Trust', 'trust'],
                            ['Testimonials', 'testimonials'],
                        ].map(([label, id]) => (
                            <div
                                key={id}
                                onClick={() => scrollTo(id)}
                                style={S.navLink}
                                className="lp-muted-hover"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div style={S.navActions}>
                        <button
                            onClick={() => setDark((v) => !v)}
                            style={{ ...S.ghostBtn, padding: '10px 12px', minWidth: 44 }}
                            aria-label="Toggle theme"
                        >
                            {dark ? '☀️' : '🌙'}
                        </button>
                        <button style={S.ghostBtn} onClick={() => navigate('/login')}>Sign in</button>
                        <button style={S.primaryBtn} onClick={() => navigate('/signup')}>Start free</button>
                    </div>
                </div>
            </nav>

            <section style={S.hero}>
                <div
                    className="lp-orb-a"
                    style={{ position: 'absolute', top: -130, left: -80, width: 420, height: 420, borderRadius: '50%', background: 'rgba(22,163,74,0.10)', filter: 'blur(70px)', pointerEvents: 'none' }}
                />
                <div
                    className="lp-orb-b"
                    style={{ position: 'absolute', right: -100, top: 40, width: 320, height: 320, borderRadius: '50%', background: 'rgba(59,130,246,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }}
                />

                <div style={S.shell} className="lp-shell">
                    <div style={S.heroGrid} className="lp-hero-grid">
                        <div>
                            <div style={S.badge} className="lp-fade-up">
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />
                                Built for teams that need follow-through after the meeting ends
                            </div>

                            <h1 style={S.heroTitle} className="lp-title lp-fade-up">
                                Turn meeting transcripts into owned, tracked, finished work.
                            </h1>

                            <p style={S.heroSub} className="lp-fade-up">
                                MeetingDebt extracts commitments from transcripts, assigns ownership, tracks status, and nudges the right people until work is done. It is not another meeting summary tool. It is the accountability layer after the meeting.
                            </p>

                            <div style={S.heroActions} className="lp-hero-actions lp-fade-up">
                                <button style={S.primaryBtn} onClick={() => navigate('/signup')}>
                                    Start for free →
                                </button>
                                <button style={S.ghostBtn} onClick={() => scrollTo('product')}>
                                    See product walkthrough
                                </button>
                            </div>

                            <div style={S.proofLine} className="lp-fade-up">
                                <span>Works with transcripts from Zoom, Meet, Teams, Otter, Read.ai, and more</span>
                                <span>•</span>
                                <span>No credit card required</span>
                                <span>•</span>
                                <span>Manager visibility built in</span>
                            </div>
                        </div>

                        <div style={S.heroCard} className="lp-fade-up">
                            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                                        <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
                                    ))}
                                </div>
                                <div style={{ fontSize: 11.5, color: theme.textFaint, marginLeft: 8 }}>MeetingDebt workflow preview</div>
                            </div>

                            <div style={{ padding: 20 }}>
                                <div style={{ ...S.card, padding: 18, marginBottom: 14, background: theme.bgSoft }}>
                                    <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Transcript input</div>
                                    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: theme.textSoft, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                                        <div>John: I&apos;ll finish the API docs by Wednesday.</div>
                                        <div>Sarah: I can review them by Thursday afternoon.</div>
                                        <div>Arul: Let&apos;s make sure client review happens Friday.</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 11, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, marginBottom: 10 }}>
                                    AI extracted commitments
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        ['John', 'Write API documentation', 'Wed'],
                                        ['Sarah', 'Review API documentation', 'Thu'],
                                        ['Arul', 'Prepare client review', 'Fri'],
                                    ].map(([owner, task, due], i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 52px', gap: 10, alignItems: 'center', padding: '11px 12px', borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.bgElevated }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{owner}</div>
                                            <div style={{ fontSize: 13, color: theme.text }}>{task}</div>
                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: dark ? 'rgba(245,158,11,0.12)' : '#fff7e8', borderRadius: 999, padding: '4px 8px', textAlign: 'center' }}>{due}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                                    {[
                                        ['Assigned', '3'],
                                        ['Overdue', '0'],
                                        ['Done', '0'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ padding: 12, borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.bgSoft }}>
                                            <div style={{ fontSize: 11, color: theme.textFaint }}>{label}</div>
                                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="proof" style={S.section} className="lp-section-animate">
                <div style={S.shell} className="lp-shell">
                    <div style={S.sectionHead}>
                        <div style={S.label}>Product proof</div>
                        <div style={S.title} className="lp-section-title">Built around the part other meeting tools leave behind.</div>
                        <div style={S.sub}>
                            Recording and summarizing a meeting is useful. But the real failure happens later: unclear ownership, forgotten deadlines, and no follow-up system. MeetingDebt exists to close that gap.
                        </div>
                    </div>

                    <div className="lp-grid-4">
                        {[
                            {
                                title: 'Commitment extraction',
                                body: 'Turn transcripts into explicit tasks, owners, and deadlines instead of leaving action items buried in notes.',
                            },
                            {
                                title: 'Manager visibility',
                                body: 'See pending, overdue, blocked, and completed work in one place without chasing people manually.',
                            },
                            {
                                title: 'Daily nudges',
                                body: 'The right people get reminded automatically, so follow-through does not depend on memory.',
                            },
                            {
                                title: 'Shared accountability',
                                body: 'Every commitment stays attached to a real owner and status, making team execution much easier to manage.',
                            },
                        ].map((item) => (
                            <div key={item.title} style={S.card} className="lp-card-hover">
                                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{item.title}</div>
                                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: theme.textSoft }}>{item.body}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="product" style={{ ...S.section, background: dark ? '#050705' : '#f4f8f4' }} className="lp-section-animate">
                <div style={S.shell} className="lp-shell">
                    <div style={S.sectionHead}>
                        <div style={S.label}>Product walkthrough</div>
                        <div style={S.title} className="lp-section-title">Simple workflow. Serious operational value.</div>
                        <div style={S.sub}>
                            The product is designed to move from transcript to accountability fast, while still giving managers control before anything is sent to the team.
                        </div>
                    </div>

                    <div className="lp-grid-2" style={{ alignItems: 'stretch' }}>
                        <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                {
                                    number: '01',
                                    title: 'Paste the transcript',
                                    body: 'Bring in the text from whatever meeting tool your team already uses.',
                                },
                                {
                                    number: '02',
                                    title: 'Review extracted commitments',
                                    body: 'Check owners, deadlines, and tasks before finalizing anything.',
                                },
                                {
                                    number: '03',
                                    title: 'Track and nudge automatically',
                                    body: 'Once commitments are confirmed, MeetingDebt keeps the execution loop alive.',
                                },
                            ].map((step) => (
                                <div key={step.number} style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 14, alignItems: 'start' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${theme.accentBorder}`, background: theme.accentSoft, color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>
                                        {step.number}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{step.title}</div>
                                        <div style={{ fontSize: 13.5, lineHeight: 1.75, color: theme.textSoft }}>{step.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800 }}>Manager dashboard</div>
                                    <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 4 }}>Pending commitments across meetings</div>
                                </div>
                                <div style={{ fontSize: 11, color: theme.accent, fontWeight: 700 }}>Live status view</div>
                            </div>

                            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    ['Weekly Product Sync', 'Deploy staging build', 'Aroool', 'Overdue'],
                                    ['Client Review', 'Finalize API notes', 'Sarah', 'Pending'],
                                    ['Sprint Planning', 'Prepare review deck', 'Arul', 'Done'],
                                ].map(([meeting, task, owner, status]) => (
                                    <div key={task} style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 14, background: theme.bgMuted }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textFaint }}>{meeting}</div>
                                            <div style={{ fontSize: 10, fontWeight: 800, borderRadius: 999, padding: '4px 8px', background: status === 'Overdue' ? (dark ? 'rgba(239,68,68,0.12)' : '#fff1f1') : status === 'Done' ? theme.accentSoft : (dark ? 'rgba(245,158,11,0.12)' : '#fff7e8'), color: status === 'Overdue' ? '#ef4444' : status === 'Done' ? theme.accent : '#f59e0b' }}>
                                                {status}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{task}</div>
                                        <div style={{ fontSize: 12.5, color: theme.textSoft }}>Owner: {owner}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="trust" style={S.section} className="lp-section-animate">
                <div style={S.shell} className="lp-shell">
                    <div style={S.sectionHead}>
                        <div style={S.label}>Privacy and trust</div>
                        <div style={S.title} className="lp-section-title">Built to earn trust before asking for adoption.</div>
                        <div style={S.sub}>
                            Teams will only use an accountability product if it feels safe, controlled, and easy to understand. The experience should feel operational, not experimental.
                        </div>
                    </div>

                    <div className="lp-grid-3">
                        {[
                            {
                                title: 'Human review before action',
                                body: 'Extracted commitments can be reviewed before they become team-facing reminders.',
                            },
                            {
                                title: 'Clear ownership model',
                                body: 'Managers can confirm, reassign, and monitor commitments instead of relying on hidden automation.',
                            },
                            {
                                title: 'Transcript in, execution out',
                                body: 'The product stays focused on the workflow after the meeting rather than becoming a noisy all-purpose workspace.',
                            },
                        ].map((item) => (
                            <div key={item.title} style={S.card} className="lp-card-hover">
                                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{item.title}</div>
                                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: theme.textSoft }}>{item.body}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="testimonials" style={{ ...S.section, background: dark ? '#050705' : '#f4f8f4' }} className="lp-section-animate">
                <div style={S.shell} className="lp-shell">
                    <div style={S.sectionHead}>
                        <div style={S.label}>Testimonials</div>
                        <div style={S.title} className="lp-section-title">What users say</div>
                        <div style={S.sub}>
                            Replace these placeholders with real user quotes before shipping. The layout is ready for production-style proof once you have them.
                        </div>
                    </div>

                    <div className="lp-grid-3">
                        {testimonials.map((item) => (
                            <div key={item.quote} style={S.card} className="lp-card-hover">
                                <div style={{ fontSize: 15, lineHeight: 1.8, color: theme.textSoft, marginBottom: 20 }}>
                                    “{item.quote}”
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.accentSoft, color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 }}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ fontSize: 12, color: theme.textFaint }}>{item.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={S.section} className="lp-section-animate">
                <div style={S.shell} className="lp-shell">
                    <div style={{ ...S.card, padding: 34, textAlign: 'center', background: dark ? 'linear-gradient(180deg, rgba(22,163,74,0.08), rgba(11,15,11,0.96))' : 'linear-gradient(180deg, #f2fff6, #ffffff)' }}>
                        <div style={{ ...S.label, marginBottom: 10 }}>Final call to action</div>
                        <div style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: -1.8, fontWeight: 900, marginBottom: 14 }} className="lp-section-title">
                            Stop losing execution after the meeting ends.
                        </div>
                        <div style={{ fontSize: 15, lineHeight: 1.75, color: theme.textSoft, maxWidth: 640, margin: '0 auto 24px' }}>
                            If your team already records meetings, you already have the raw material. MeetingDebt turns it into clear ownership, visible status, and actual follow-through.
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button style={S.primaryBtn} onClick={() => navigate('/signup')}>Start for free →</button>
                            <button style={S.ghostBtn} onClick={() => navigate('/login')}>Sign in</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
