import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';
import LogoTransition from '../components/LogoTransition';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTransition, setShowTransition] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        // Check if existing user has workspaces
        try {
            const res = await api.get(`/workspaces?userId=${data.user.id}`);
            if (res.data && res.data.length > 0) {
                const lastWsId = localStorage.getItem('workspaceId');
                const ws = res.data.find(w => w.id === lastWsId) || res.data[0];
                localStorage.setItem('workspaceId', ws.id);
                localStorage.setItem('workspaceName', ws.name);
                localStorage.setItem('userRole', ws.role);
                localStorage.removeItem('soloMode');
            }
        } catch (err) { }
        const savedTheme = data.user?.user_metadata?.theme || localStorage.getItem('theme');
        if (savedTheme) {
            localStorage.setItem('theme', savedTheme);
            document.body.classList.toggle('dark', savedTheme === 'dark');
        }
        // If user came from an invite link, accept it now
        const pendingInvite = localStorage.getItem('pendingInvite');
        if (pendingInvite) {
            localStorage.removeItem('pendingInvite');
            navigate(`/invite/${pendingInvite}`);
            return;
        }

        const lastTransition = localStorage.getItem('lastTransition');
        const now = Date.now();
        const twoMins = 2 * 60 * 1000;

        if (!lastTransition || now - parseInt(lastTransition) > twoMins) {
            localStorage.setItem('lastTransition', now.toString());
            setShowTransition(true);
        } else {
            navigate('/dashboard');
        }
    }

    async function handleGoogle() {
        sessionStorage.setItem('showTransition', 'true');
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/dashboard' }
        });
    }

    if (showTransition) {
        return <LogoTransition onComplete={() => navigate('/dashboard')} />;
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
                <div className="auth-title">Welcome back</div>
                <div className="auth-sub">Sign in to your account</div>

                <button className="google-btn" onClick={handleGoogle}>
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
                        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider"><span>or</span></div>

                <form onSubmit={handleLogin}>
                    <label className="field-label">Email</label>
                    <input className="field-input" type="email" placeholder="you@company.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                        <Link to="/forgot-password" style={{
                            fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                            fontWeight: 500,
                        }}>
                            Forgot password?
                        </Link>
                    </div>
                    <input className="field-input" type="password" placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                    {error && <div className="auth-error">{error}</div>}
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Signing in...' : 'Sign in →'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup" className="auth-link">Sign up</Link>
                </div>
            </motion.div>
        </div>
    );
}