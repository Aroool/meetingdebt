import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { supabase } from '../supabase';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

export default function Landing() {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/dashboard');
        });
    }, [navigate]);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // ── HERO TIMELINE ──
            const heroTl = gsap.timeline({ delay: 0.2 });

            heroTl
                .from('.hero-badge', {
                    opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'
                })
                .from('.hero-h1 .line1', {
                    opacity: 0, y: 60, duration: 0.8, ease: 'power4.out'
                }, '-=0.2')
                .from('.hero-h1 .line2', {
                    opacity: 0, y: 60, duration: 0.8, ease: 'power4.out'
                }, '-=0.5')
                .from('.hero-h1 .line3', {
                    opacity: 0, y: 60, duration: 0.8, ease: 'power4.out'
                }, '-=0.5')
                .from('.hero-sub', {
                    opacity: 0, y: 30, duration: 0.7, ease: 'power3.out'
                }, '-=0.4')
                .from('.hero-btns', {
                    opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'
                }, '-=0.3')
                .from('.hero-proof', {
                    opacity: 0, duration: 0.5
                }, '-=0.2');

            // ── ORB FLOATING ANIMATION ──
            gsap.to('.orb1', {
                y: -30, x: 20, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut'
            });
            gsap.to('.orb2', {
                y: 20, x: -15, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
            });
            gsap.to('.orb3', {
                y: -15, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2
            });

            // ── PARALLAX ORBS ON SCROLL ──
            gsap.to('.orb1', {
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
                y: -120, ease: 'none'
            });
            gsap.to('.orb2', {
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
                y: -80, ease: 'none'
            });

            // ── KILLER LINE ──
            gsap.from('.killer-q1', {
                scrollTrigger: { trigger: '.killer-section', start: 'top 80%' },
                opacity: 0, x: -40, duration: 0.8, ease: 'power3.out'
            });
            gsap.from('.killer-q2', {
                scrollTrigger: { trigger: '.killer-section', start: 'top 80%' },
                opacity: 0, x: 40, duration: 0.8, ease: 'power3.out', delay: 0.2
            });

            // ── HOW IT WORKS — staggered steps ──
            gsap.from('.section-header-howitworks', {
                scrollTrigger: { trigger: '.how-section', start: 'top 75%' },
                opacity: 0, y: 40, duration: 0.7, ease: 'power3.out'
            });
            gsap.from('.step-card', {
                scrollTrigger: { trigger: '.steps-grid', start: 'top 80%' },
                opacity: 0, y: 60, stagger: 0.15, duration: 0.7, ease: 'back.out(1.5)'
            });

            // ── TRANSCRIPT TYPING EFFECT ──
            ScrollTrigger.create({
                trigger: '.demo-section',
                start: 'top 70%',
                onEnter: () => {
                    const tl = gsap.timeline();
                    tl.from('.demo-left-content', {
                        opacity: 0, x: -50, duration: 0.8, ease: 'power3.out'
                    })
                        .from('.terminal', {
                            opacity: 0, x: 50, duration: 0.8, ease: 'power3.out'
                        }, '-=0.5')
                        .from('.t-line', {
                            opacity: 0, y: 10, stagger: 0.15, duration: 0.4, ease: 'power2.out'
                        }, '-=0.2')
                        .from('.t-extracted', {
                            opacity: 0, y: 20, duration: 0.6, ease: 'power3.out'
                        }, '-=0.1')
                        .from('.t-task', {
                            opacity: 0, x: -20, stagger: 0.1, duration: 0.4, ease: 'back.out(1.2)'
                        }, '-=0.3');
                },
                once: true
            });

            // ── FEATURES — staggered grid ──
            gsap.from('.feat-card', {
                scrollTrigger: { trigger: '.features-section', start: 'top 75%' },
                opacity: 0, y: 50, scale: 0.95, stagger: 0.1, duration: 0.6, ease: 'back.out(1.4)'
            });

            // ── VS SECTION ──
            gsap.from('.vs-them', {
                scrollTrigger: { trigger: '.vs-section', start: 'top 75%' },
                opacity: 0, x: -40, duration: 0.8, ease: 'power3.out'
            });
            gsap.from('.vs-us', {
                scrollTrigger: { trigger: '.vs-section', start: 'top 75%' },
                opacity: 0, x: 40, duration: 0.8, ease: 'power3.out', delay: 0.15
            });

            // ── NUDGE EMAIL ──
            gsap.from('.nudge-left', {
                scrollTrigger: { trigger: '.nudge-section', start: 'top 75%' },
                opacity: 0, x: -50, duration: 0.8, ease: 'power3.out'
            });
            gsap.from('.email-mock', {
                scrollTrigger: { trigger: '.nudge-section', start: 'top 75%' },
                opacity: 0, y: 40, rotation: 2, duration: 0.8, ease: 'back.out(1.2)', delay: 0.2
            });
            gsap.from('.em-task', {
                scrollTrigger: { trigger: '.nudge-section', start: 'top 70%' },
                opacity: 0, x: 20, stagger: 0.12, duration: 0.5, ease: 'power2.out', delay: 0.4
            });

            // ── CTA SECTION ──
            gsap.from('.cta-h2', {
                scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
                opacity: 0, y: 50, duration: 0.9, ease: 'power4.out'
            });
            gsap.from('.cta-sub', {
                scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
                opacity: 0, y: 30, duration: 0.7, ease: 'power3.out', delay: 0.2
            });
            gsap.from('.cta-btns', {
                scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
                opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', delay: 0.4
            });
            gsap.to('.cta-orb', {
                scrollTrigger: { trigger: '.cta-section', start: 'top bottom', end: 'bottom top', scrub: true },
                scale: 1.4, ease: 'none'
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const S = {
        page: {
            background: '#080808', color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            overflowX: 'hidden',
        },
        nav: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 60px', borderBottom: '0.5px solid #ffffff12',
            background: '#080808dd', position: 'sticky', top: 0, zIndex: 100,
            backdropFilter: 'blur(12px)',
        },
        logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff' },
        logoDot: { width: 8, height: 8, borderRadius: '50%', background: '#16a34a' },
        navLinks: { display: 'flex', gap: 28 },
        navLink: { fontSize: 13, color: '#555', cursor: 'pointer' },
        navCta: {
            fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 8,
            background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
        },
        hero: {
            minHeight: '90vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            padding: '80px 60px', position: 'relative', overflow: 'hidden',
        },
        heroBg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
        orb: (w, h, top, left, right, bottom, color) => ({
            position: 'absolute', width: w, height: h, borderRadius: '50%',
            background: color, top, left, right, bottom,
        }),
        heroH1: {
            fontSize: 64, fontWeight: 900, lineHeight: 1.02,
            letterSpacing: -2.5, color: '#fff', marginBottom: 20, maxWidth: 800,
        },
        btnP: {
            padding: '14px 32px', borderRadius: 10, background: '#16a34a',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15,
            fontWeight: 700, fontFamily: 'inherit',
        },
        btnS: {
            padding: '14px 32px', borderRadius: 10, background: 'transparent',
            color: '#888', border: '0.5px solid #ffffff20', cursor: 'pointer',
            fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
        },
        section: (bg) => ({ padding: '100px 60px', background: bg || '#080808', position: 'relative' }),
        sLabel: { fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 },
        sTitle: { fontSize: 42, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.05, marginBottom: 16 },
        sSub: { fontSize: 15, color: '#555', maxWidth: 480, lineHeight: 1.7 },
        card: {
            background: '#0f0f0f', border: '0.5px solid #ffffff0d',
            borderRadius: 18, padding: 32,
        },
        divider: { height: '0.5px', background: '#ffffff08', margin: '0 60px' },
    };

    return (
        <div ref={containerRef} style={S.page}>

            {/* NAV */}
            <nav style={S.nav}>
                <div style={S.logo}>
                    <div style={S.logoDot} />
                    Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                </div>
                <div style={S.navLinks}>
                    {['How it works', 'Features', 'Pricing'].map(l => (
                        <div key={l} style={S.navLink}>{l}</div>
                    ))}
                </div>
                <button style={S.navCta} onClick={() => navigate('/signup')}>
                    Get started free
                </button>
            </nav>

            {/* HERO */}
            <section className="hero" style={S.hero}>
                <div style={S.heroBg}>
                    <div className="orb1" style={S.orb(700, 700, -250, -150, null, null, '#16a34a06')} />
                    <div className="orb2" style={S.orb(450, 450, null, null, -80, -80, '#16a34a04')} />
                    <div className="orb3" style={{ ...S.orb(350, 350, '50%', '50%', null, null, '#3b82f605'), transform: 'translate(-50%, -50%)' }} />
                </div>

                <div className="hero-badge" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20,
                    border: '0.5px solid #16a34a40', background: '#16a34a10',
                    fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 32,
                    position: 'relative', zIndex: 1,
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
                    Built for teams that actually follow through
                </div>

                <h1 className="hero-h1" style={{ ...S.heroH1, position: 'relative', zIndex: 1 }}>
                    <div className="line1">Your meetings make promises.</div>
                    <div className="line2"><span style={{ color: '#16a34a' }}>We make sure</span></div>
                    <div className="line3" style={{ color: '#333' }}>they're kept.</div>
                </h1>

                <p className="hero-sub" style={{
                    fontSize: 17, color: '#555', lineHeight: 1.7,
                    maxWidth: 520, margin: '0 auto 40px', position: 'relative', zIndex: 1,
                }}>
                    Paste any meeting transcript. AI extracts every commitment, assigns it, tracks it, and nudges your team until it's done.
                </p>

                <div className="hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <button style={S.btnP} onClick={() => navigate('/signup')}>Start for free →</button>
                    <button style={S.btnS} onClick={() => navigate('/login')}>Sign in</button>
                </div>

                <div className="hero-proof" style={{ marginTop: 24, fontSize: 12, color: '#333', position: 'relative', zIndex: 1 }}>
                    No credit card required · Free for teams up to 5
                </div>
            </section>

            <div style={S.divider} />

            {/* KILLER LINE */}
            <section className="killer-section" style={{ padding: '80px 60px', textAlign: 'center' }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <div className="killer-q1" style={{ fontSize: 30, fontWeight: 500, color: '#333', marginBottom: 8 }}>
                        "Read.ai tells you what was said."
                    </div>
                    <div className="killer-q2" style={{ fontSize: 30, fontWeight: 500, color: '#fff' }}>
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>MeetingDebt</span> makes sure it actually happens.
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* HOW IT WORKS */}
            <section className="how-section" style={S.section()}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div className="section-header-howitworks">
                        <div style={S.sLabel}>How it works</div>
                        <div style={S.sTitle}>Three steps.<br />Zero dropped balls.</div>
                        <div style={S.sSub}>From messy transcript to tracked commitments in under 60 seconds.</div>
                    </div>

                    <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 56 }}>
                        {[
                            { n: '01', icon: '📋', title: 'Paste your transcript', desc: 'Copy from Zoom, Meet, Teams, Otter, Read.ai — anywhere. Paste it in. Takes 10 seconds.' },
                            { n: '02', icon: '⚡', title: 'AI extracts commitments', desc: 'Claude reads every line and pulls out tasks, owners, and deadlines. You review and confirm.' },
                            { n: '03', icon: '🔔', title: 'Team gets nudged daily', desc: 'Everyone gets emailed their tasks. Overdue? They get nudged. Done? Dashboard updates.' },
                        ].map(s => (
                            <div key={s.n} className="step-card" style={{
                                ...S.card, transition: 'border-color 0.3s, transform 0.3s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a30'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ffffff0d'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {s.n} <div style={{ flex: 1, height: '0.5px', background: '#16a34a20' }} />
                                </div>
                                <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{s.title}</div>
                                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{s.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* TRANSCRIPT DEMO */}
            <section className="demo-section" style={S.section('#050505')}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
                        <div className="demo-left-content">
                            <div style={S.sLabel}>See it in action</div>
                            <div style={{ ...S.sTitle, fontSize: 36 }}>From messy transcript<br />to clear ownership.</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
                                {[
                                    { title: 'Smart assignment', desc: 'Automatically matches tasks to the right person based on context.' },
                                    { title: 'Deadline detection', desc: 'Picks up "by Friday", "end of day", "next sprint" automatically.' },
                                    { title: 'You confirm everything', desc: "Nothing gets assigned without your approval first." },
                                ].map(p => (
                                    <div key={p.title} style={{ display: 'flex', gap: 14 }}>
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#16a34a15', border: '0.5px solid #16a34a30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                                        </div>
                                        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                                            <strong style={{ color: '#ccc', fontWeight: 600, display: 'block', marginBottom: 2 }}>{p.title}</strong>
                                            {p.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="terminal" style={{ background: '#0d0d0d', border: '0.5px solid #ffffff0f', borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', background: '#111', borderBottom: '0.5px solid #ffffff08', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                                        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                    ))}
                                </div>
                                <div style={{ fontSize: 11, color: '#444', marginLeft: 8, fontFamily: 'monospace' }}>Weekly Sprint Sync — transcript</div>
                            </div>
                            <div style={{ padding: 20 }}>
                                {[
                                    { speaker: 'John: ', text: '"I\'ll get the API docs done by Wednesday."', highlight: false },
                                    { speaker: 'Sarah: ', text: '"I can review them by end of Thursday."', highlight: false },
                                    { speaker: 'Arul: ', text: '"Everything ready for client review Friday."', highlight: true },
                                    { speaker: 'John: ', text: '"I\'ll deploy to staging tomorrow evening."', highlight: false },
                                ].map((l, i) => (
                                    <div key={i} className="t-line" style={{ fontSize: 11, fontFamily: 'monospace', lineHeight: 2 }}>
                                        <span style={{ color: '#555' }}>{l.speaker}</span>
                                        <span style={{ color: l.highlight ? '#16a34a' : '#777' }}>{l.text}</span>
                                    </div>
                                ))}

                                <div className="t-extracted" style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #ffffff08' }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                                        AI extracted
                                    </div>
                                    {[
                                        { av: 'J', bg: '#dbeafe', color: '#1d4ed8', task: 'Write API documentation', due: 'Wed' },
                                        { av: 'S', bg: '#ede9fe', color: '#7c3aed', task: "Review John's API docs", due: 'Thu' },
                                        { av: 'A', bg: '#16a34a20', color: '#16a34a', task: 'Everything ready for client review', due: 'Fri' },
                                        { av: 'J', bg: '#dbeafe', color: '#1d4ed8', task: 'Deploy build to staging', due: 'Tmrw' },
                                    ].map((t, i) => (
                                        <div key={i} className="t-task" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#161616', borderRadius: 8, marginBottom: 6, border: '0.5px solid #ffffff06' }}>
                                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, flexShrink: 0 }}>
                                                {t.av}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#bbb', flex: 1 }}>{t.task}</div>
                                            <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FAEEDA15', color: '#f59e0b', border: '0.5px solid #f59e0b30' }}>{t.due}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* FEATURES */}
            <section className="features-section" style={S.section()}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={S.sLabel}>Features</div>
                    <div style={{ ...S.sTitle, marginBottom: 48 }}>Everything your team needs.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        {[
                            { icon: '🤖', title: 'AI extraction', desc: "Claude reads your transcript and pulls every commitment, deadline, and owner — no manual work." },
                            { icon: '📊', title: 'Live dashboard', desc: "See your whole team's commitments in one place. Filter by person, meeting, or status." },
                            { icon: '📧', title: 'Daily nudges', desc: 'Automated daily emails keep everyone on track. Nobody "forgets" what they said they\'d do.' },
                            { icon: '👥', title: 'Team workspaces', desc: 'Invite your team, assign roles, manage multiple workspaces. Role-based access built in.' },
                            { icon: '🔁', title: 'Reassign tasks', desc: 'Plans change. Managers can reassign any commitment to another team member in one click.' },
                            { icon: '📈', title: 'Accountability', desc: "See who's consistently delivering and who needs a nudge. Data-driven team accountability." },
                        ].map(f => (
                            <div key={f.title} className="feat-card" style={{ ...S.card, transition: 'border-color 0.3s, transform 0.3s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16a34a25'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#ffffff0d'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ fontSize: 24, marginBottom: 14 }}>{f.icon}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</div>
                                <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7 }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* VS */}
            <section className="vs-section" style={S.section('#050505')}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={S.sLabel}>Why not just use...</div>
                    <div style={{ ...S.sTitle, fontSize: 36, marginBottom: 48 }}>Other tools stop when<br />the meeting ends.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="vs-them" style={{ ...S.card, opacity: 0.7 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#333', marginBottom: 18 }}>
                                Read.ai / Otter / Fireflies
                            </div>
                            {[
                                { good: true, text: 'Records and transcribes meetings' },
                                { good: true, text: 'Generates meeting summaries' },
                                { good: false, text: "Doesn't track who committed to what" },
                                { good: false, text: "Doesn't send reminders to your team" },
                                { good: false, text: "Can't tell you if things got done" },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
                                    <span style={{ color: r.good ? '#16a34a' : '#333', fontWeight: 700 }}>{r.good ? '✓' : '✗'}</span>
                                    <span style={{ color: r.good ? '#666' : '#333' }}>{r.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="vs-us" style={{ ...S.card, borderColor: '#16a34a25' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#16a34a', marginBottom: 18 }}>
                                MeetingDebt
                            </div>
                            {[
                                'Works with any transcript source',
                                'Extracts and assigns every commitment',
                                'Tracks status in real time',
                                'Daily nudge emails to every team member',
                                'Manager dashboard with full accountability',
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
                                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                                    <span style={{ color: '#888' }}>{r}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* NUDGE EMAIL */}
            <section className="nudge-section" style={S.section()}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
                    <div className="nudge-left">
                        <div style={S.sLabel}>Automated nudges</div>
                        <div style={{ ...S.sTitle, fontSize: 36 }}>Your team gets reminded.<br />Every. Single. Day.</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                            {[
                                { title: 'Daily at 9am', desc: "Each person gets only their tasks. No noise." },
                                { title: 'Overdue flagged in red', desc: "Accountability without awkward Slack messages." },
                                { title: 'Manager sees everything', desc: "Dashboard shows who's on track and who isn't." },
                            ].map(p => (
                                <div key={p.title} style={{ display: 'flex', gap: 14 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#16a34a15', border: '0.5px solid #16a34a30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                                    </div>
                                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                                        <strong style={{ color: '#ccc', fontWeight: 600, display: 'block', marginBottom: 2 }}>{p.title}</strong>
                                        {p.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="email-mock" style={{ background: '#fff', borderRadius: 16, padding: 24, color: '#111' }}>
                        <div style={{ borderBottom: '0.5px solid #eee', paddingBottom: 14, marginBottom: 14 }}>
                            <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>From: MeetingDebt &lt;nudge@meetingdebt.com&gt;</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Your tasks for today, John 👋</div>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 14 }}>
                            You have 3 open commitments from your recent meetings. Here's what needs your attention today:
                        </div>
                        {[
                            { name: 'Write API documentation', due: 'Overdue · Was Wed', urgent: true },
                            { name: 'Deploy latest build to staging', due: 'Due today', urgent: false },
                            { name: 'Code review for login bug', due: 'Due Friday', urgent: false },
                        ].map((t, i) => (
                            <div key={i} className="em-task" style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '0.5px solid #eee' }}>
                                <div style={{ fontSize: 12, color: '#111', fontWeight: 500 }}>{t.name}</div>
                                <div style={{ fontSize: 10, color: t.urgent ? '#ef4444' : '#888', fontWeight: 600 }}>{t.due}</div>
                            </div>
                        ))}
                        <div style={{ background: '#16a34a', color: '#fff', borderRadius: 8, padding: 11, textAlign: 'center', fontSize: 12, fontWeight: 700, marginTop: 14, cursor: 'pointer' }}>
                            Mark tasks as done →
                        </div>
                    </div>
                </div>
            </section>

            <div style={S.divider} />

            {/* CTA */}
            <section className="cta-section" style={{ padding: '120px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div className="cta-orb" style={{ width: 600, height: 600, borderRadius: '50%', background: '#16a34a06' }} />
                </div>
                <div className="cta-h2" style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: -2, marginBottom: 16, lineHeight: 1.05, position: 'relative' }}>
                    Stop letting commitments<br />fall through the cracks.
                </div>
                <div className="cta-sub" style={{ fontSize: 16, color: '#444', marginBottom: 40, position: 'relative' }}>
                    Join teams that actually follow through on what they say in meetings.
                </div>
                <div className="cta-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', position: 'relative' }}>
                    <button style={S.btnP} onClick={() => navigate('/signup')}>Get started free →</button>
                    <button style={S.btnS} onClick={() => navigate('/login')}>Sign in</button>
                </div>
            </section>

            {/* FOOTER */}
            <div style={{ padding: '28px 60px', borderTop: '0.5px solid #ffffff08', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={S.logoDot} />
                    Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                </div>
                <div style={{ fontSize: 11, color: '#222' }}>© 2026 MeetingDebt · Built at Clark University</div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
        </div>
    );
}