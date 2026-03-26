import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

export default function ThemePicker() {
    const navigate = useNavigate();

    async function pickTheme(theme) {
        document.body.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
        try {
            await supabase.auth.updateUser({ data: { theme } });
        } catch (err) { }
        navigate('/dashboard');
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#080808',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 32, fontFamily: '-apple-system, sans-serif',
        }}>
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: 48 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                        Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                    </span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 10 }}>
                    How do you like your workspace?
                </div>
                <div style={{ fontSize: 15, color: '#555' }}>
                    Pick a theme. You can change it anytime.
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', maxWidth: 720 }}>

                {/* Light */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => pickTheme('light')}
                    style={{
                        cursor: 'pointer', borderRadius: 20,
                        border: '1px solid #ffffff15', overflow: 'hidden',
                        transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#16a34a60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#ffffff15'}
                >
                    {/* Light preview */}
                    <div style={{ background: '#f8fafc', padding: 20, height: 200 }}>
                        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Arul's workspace</div>
                            </div>
                            {[
                                { color: '#ef4444', bg: '#fef2f2', label: 'Overdue', w: '30%' },
                                { color: '#f59e0b', bg: '#fffbeb', label: 'Pending', w: '60%' },
                                { color: '#16a34a', bg: '#f0fdf4', label: 'Done', w: '80%' },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: s.color, width: 42 }}>{s.label}</div>
                                    <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ width: s.w, height: '100%', background: s.color, borderRadius: 10 }} />
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: 4, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 10px' }}>
                                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, width: '70%', marginBottom: 5 }} />
                                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, width: '40%' }} />
                            </div>
                            <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 10px' }}>
                                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, width: '85%', marginBottom: 5 }} />
                                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, width: '50%' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ background: '#111', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Light</div>
                            <div style={{ fontSize: 11, color: '#555' }}>Clean and minimal</div>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            ☀️
                        </div>
                    </div>
                </motion.div>

                {/* Dark */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => pickTheme('dark')}
                    style={{
                        cursor: 'pointer', borderRadius: 20,
                        border: '1px solid #ffffff15', overflow: 'hidden',
                        transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#16a34a60'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#ffffff15'}
                >
                    {/* Dark preview */}
                    <div style={{ background: '#080808', padding: 20, height: 200 }}>
                        <div style={{ background: '#0d0d0d', borderRadius: 10, border: '0.5px solid #ffffff0d', padding: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#ececec' }}>Arul's workspace</div>
                            </div>
                            {[
                                { color: '#f87171', bg: '#ef444410', label: 'Overdue', w: '30%' },
                                { color: '#fbbf24', bg: '#f59e0b10', label: 'Pending', w: '60%' },
                                { color: '#4ade80', bg: '#16a34a10', label: 'Done', w: '80%' },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: s.color, width: 42 }}>{s.label}</div>
                                    <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ width: s.w, height: '100%', background: s.color, borderRadius: 10 }} />
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: 4, background: '#111', borderRadius: 8, border: '0.5px solid #ffffff08', padding: '8px 10px' }}>
                                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 4, width: '70%', marginBottom: 5 }} />
                                <div style={{ height: 4, background: '#161616', borderRadius: 4, width: '40%' }} />
                            </div>
                            <div style={{ background: '#111', borderRadius: 8, border: '0.5px solid #ffffff08', padding: '8px 10px' }}>
                                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 4, width: '85%', marginBottom: 5 }} />
                                <div style={{ height: 4, background: '#161616', borderRadius: 4, width: '50%' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ background: '#111', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #ffffff08' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Dark</div>
                            <div style={{ fontSize: 11, color: '#555' }}>Premium and focused</div>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0d0d0d', border: '1px solid #ffffff15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            🌙
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginTop: 24, fontSize: 12, color: '#333' }}
            >
                You can always change this later in your profile settings
            </motion.div>
        </div>
    );
}