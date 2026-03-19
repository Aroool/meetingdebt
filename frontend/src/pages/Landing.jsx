import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

function AnimatedLogo() {
    return (
        <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
            <motion.div
                style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#16a34a', flexShrink: 0
                }}
                initial={{ y: -40, opacity: 0, scaleX: 1, scaleY: 1 }}
                animate={[
                    { y: -40, opacity: 0 },
                    { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.215, 0.61, 0.355, 1] } },
                    { scaleX: 1.4, scaleY: 0.6, transition: { duration: 0.12, ease: [0.755, 0.05, 0.855, 0.06] } },
                    { scaleX: 0.85, scaleY: 1.2, y: -4, transition: { duration: 0.18, ease: [0.215, 0.61, 0.355, 1] } },
                    { scaleX: 1.1, scaleY: 0.9, y: 1, transition: { duration: 0.12 } },
                    { scaleX: 1, scaleY: 1, y: 0, transition: { duration: 0.1 } },
                ]}
                transition={{ duration: 0.4, delay: 0.2 }}
            />
            <motion.div
                style={{ overflow: 'hidden' }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.span
                    style={{
                        fontSize: 17, fontWeight: 800, color: '#0f172a',
                        letterSpacing: -0.5, whiteSpace: 'nowrap',
                        fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif'
                    }}
                    initial={{ x: -12 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                >
                    Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                </motion.span>
            </motion.div>
        </motion.div>
    );
}

function FadeInSection({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', background: '#fff', color: '#0f172a' }}>

            {/* NAVBAR */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 48px', height: 60, borderBottom: '1px solid #f1f5f9',
                position: 'sticky', top: 0, background: '#fff', zIndex: 50
            }}>
                <AnimatedLogo />
                <div style={{ display: 'flex', gap: 24 }}>
                    {['How it works', 'Features', 'Pricing'].map(l => (
                        <span key={l} style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>{l}</span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/login')}
                        style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', color: '#0f172a', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
                    >
                        Sign in
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/signup')}
                        style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                        Get started free
                    </motion.button>
                </div>
            </nav>

            {/* HERO */}
            <div style={{ padding: '88px 48px 72px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 24, border: '1px solid #bbf7d0' }}
                >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                    The accountability layer for your meetings
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ fontSize: 56, fontWeight: 900, color: '#0f172a', letterSpacing: -2.5, lineHeight: 1.08, marginBottom: 20 }}
                >
                    Your team said they'd do it.<br />
                    <span style={{ color: '#16a34a' }}>Now make sure they do.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 36px' }}
                >
                    Paste any meeting transcript. MeetingDebt extracts every commitment, tracks deadlines, and automatically nudges people when they're overdue.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.03, background: '#15803d' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/signup')}
                        style={{ fontSize: 14, padding: '12px 28px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                    >
                        Get started free →
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{ fontSize: 14, padding: '12px 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                        See how it works
                    </motion.button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{ fontSize: 12, color: '#94a3b8' }}
                >
                    No credit card required · Free to get started
                </motion.div>
            </div>

            {/* DASHBOARD PREVIEW */}
            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ margin: '0 48px 80px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, overflow: 'hidden' }}
            >
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ borderBottom: '1px solid #f1f5f9', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>Meeting<span style={{ color: '#16a34a' }}>Debt</span></span>
                        <div style={{ display: 'flex', gap: 3 }}>
                            {['Dashboard', 'Commitments', 'Meetings'].map((l, i) => (
                                <span key={l} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: i === 0 ? '#f0fdf4' : 'transparent', color: i === 0 ? '#16a34a' : '#94a3b8', fontWeight: i === 0 ? 600 : 400 }}>{l}</span>
                            ))}
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>A ▼</span>
                    </div>
                    <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>☀️ Good morning</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Thursday, March 19 · 3 commitments need attention</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                            {[['OVERDUE', '3', '#ef4444'], ['PENDING', '5', '#f59e0b'], ['BLOCKED', '1', '#3b82f6'], ['COMPLETED', '8', '#16a34a']].map(([l, n, c]) => (
                                <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{n}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10 }}>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700 }}>Commitments</div>
                                {[['JO', '#dbeafe', '#1d4ed8', 'Send pricing proposal', '2d late', '#fef2f2', '#dc2626'],
                                ['MA', '#ede9fe', '#7c3aed', 'Finalize design mockups', '1d late', '#fef2f2', '#dc2626'],
                                ['SA', '#fef3c7', '#92400e', 'Confirm launch budget', 'due today', '#fffbeb', '#d97706'],
                                ['JO', '#dbeafe', '#1d4ed8', 'Ping marketing team', 'done', '#f0fdf4', '#16a34a']
                                ].map(([init, abg, ac, task, status, sbg, sc]) => (
                                    <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f8fafc' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: abg, color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800 }}>{init}</div>
                                        <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: '#1e293b' }}>{task}</div>
                                        <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: sbg, color: sc }}>{status}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 700 }}>Recent meetings</div>
                                    {[['Product Sync', '4 items', 'Tue Mar 18'], ['Design Review', '2 items', 'Mon Mar 17']].map(([t, c, d]) => (
                                        <div key={t} style={{ padding: '8px 12px', borderBottom: '1px solid #f8fafc' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>{t}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: 20 }}>{c}</span>
                                            </div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{d}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HOW IT WORKS */}
            <div style={{ padding: '72px 48px', background: '#f8fafc' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <FadeInSection>
                        <div style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20, marginBottom: 12, border: '1px solid #bbf7d0' }}>How it works</div>
                        <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', letterSpacing: -1, marginBottom: 8 }}>Three steps. Zero effort.</div>
                        <div style={{ fontSize: 15, color: '#64748b', marginBottom: 48 }}>From messy meeting to tracked commitments in under 30 seconds.</div>
                    </FadeInSection>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                        {[
                            ['1', 'Paste your transcript', 'After any meeting, paste the transcript. Works with Zoom, Google Meet, Teams — any platform that generates a transcript.'],
                            ['2', 'AI extracts commitments', 'Claude reads the conversation and extracts every action item, decision, and blocker — with the right owner and deadline assigned automatically.'],
                            ['3', 'Nudges fire automatically', 'When a deadline passes, MeetingDebt sends an automatic reminder to the person who made the commitment. No manual follow-up needed.'],
                        ].map(([num, title, body], i) => (
                            <FadeInSection key={num} delay={i * 0.1}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{num}</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{title}</div>
                                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{body}</div>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </div>

            {/* VIRAL LOOP */}
            <div style={{ padding: '72px 48px', maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
                <FadeInSection>
                    <div style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 20, marginBottom: 12, border: '1px solid #bbf7d0' }}>The viral loop</div>
                    <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', letterSpacing: -1, marginBottom: 8 }}>Every nudge acquires a new user</div>
                    <div style={{ fontSize: 15, color: '#64748b', marginBottom: 32, lineHeight: 1.7 }}>When someone receives a nudge about their overdue commitment, they click the link and sign up. Your team grows MeetingDebt for you.</div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>From: MeetingDebt · To: john@company.com</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>⚠️ A commitment from Monday's meeting is overdue</div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }}>Your manager wanted to remind you about a commitment from <strong>Product Sync.</strong></div>
                        <div style={{ background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Send pricing proposal to client</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Deadline: Thursday · Now 2 days overdue</div>
                        </div>
                        <div style={{ display: 'inline-block', background: '#16a34a', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>View dashboard →</div>
                    </div>
                </FadeInSection>
            </div>

            {/* CTA */}
            <div style={{ padding: '72px 48px', textAlign: 'center', background: '#0f172a' }}>
                <FadeInSection>
                    <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -1.5, marginBottom: 12, lineHeight: 1.15 }}>
                        Read.ai tells you what was said.<br />
                        <span style={{ color: '#4ade80' }}>MeetingDebt makes sure it happens.</span>
                    </div>
                    <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32 }}>Join teams who never miss a meeting commitment again.</div>
                    <motion.button
                        whileHover={{ scale: 1.03, background: '#15803d' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/signup')}
                        style={{ fontSize: 14, padding: '12px 28px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
                    >
                        Get started free →
                    </motion.button>
                </FadeInSection>
            </div>

            {/* FOOTER */}
            <div style={{ padding: '24px 48px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Meeting<span style={{ color: '#16a34a' }}>Debt</span></span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>© 2026 MeetingDebt. Making sure meeting commitments actually happen.</span>
            </div>

        </div>
    );
}