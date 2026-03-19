import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import axios from 'axios';
import API from '../config';

export default function EnterInvite() {
    const [tab, setTab] = useState('code'); // 'code' or 'link'
    const [code, setCode] = useState('');
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleCodeJoin(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data } = await axios.post(`${API}/workspaces/join-by-code`, {
                code: code.trim().toUpperCase(),
                userId: session?.user?.id,
                userEmail: session?.user?.email
            });

            localStorage.setItem('workspaceId', data.workspace.id);
            localStorage.setItem('workspaceName', data.workspace.name);
            localStorage.setItem('userRole', 'member');
            localStorage.removeItem('soloMode');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid code. Check with your manager.');
            setLoading(false);
        }
    }

    function handleLinkJoin(e) {
        e.preventDefault();
        setError('');
        try {
            let token = link.trim();
            if (token.includes('/invite/')) {
                token = token.split('/invite/')[1];
            }
            if (!token) {
                setError('Invalid invite link.');
                return;
            }
            navigate(`/invite/${token}`);
        } catch {
            setError('Invalid invite link.');
        }
    }

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="auth-logo">
                    <div className="logo-dot" />
                    Meeting<span className="logo-debt">Debt</span>
                </div>

                <div className="auth-title">Join a workspace</div>
                <div className="auth-sub">Use a team code or invite link from your manager.</div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 8, padding: 4, marginBottom: 20 }}>
                    {[['code', '🔑 Team code'], ['link', '✉️ Invite link']].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => { setTab(key); setError(''); }}
                            style={{
                                flex: 1, padding: '7px 12px', borderRadius: 6, border: 'none',
                                background: tab === key ? 'var(--bg-card)' : 'transparent',
                                color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: tab === key ? 600 : 400,
                                cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                                boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'code' ? (
                    <form onSubmit={handleCodeJoin}>
                        <label className="field-label">Team code</label>
                        <input
                            className="field-input"
                            placeholder="e.g. MTG4X9"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            required
                            style={{ letterSpacing: 4, fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                        />
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, textAlign: 'center' }}>
                            Ask your manager for the 6-character team code
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button className="btn-extract" type="submit" disabled={loading || code.length < 6}>
                            {loading ? 'Joining...' : 'Join workspace →'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLinkJoin}>
                        <label className="field-label">Invite link</label>
                        <input
                            className="field-input"
                            placeholder="https://meetingdebt.vercel.app/invite/..."
                            value={link}
                            onChange={e => setLink(e.target.value)}
                            required
                        />

                        {error && <div className="auth-error">{error}</div>}

                        <button className="btn-extract" type="submit" style={{ marginTop: 8 }}>
                            Join workspace →
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Want to create your own team?{' '}
                    <span className="auth-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/create-workspace')}>
                        Create workspace
                    </span>
                </div>
            </motion.div>
        </div>
    );
}