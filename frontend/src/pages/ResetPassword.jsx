import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

function getStrength(password) {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
    return { score: 4, label: 'Strong', color: '#16a34a' };
}

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase automatically picks up the recovery token from the URL hash
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });
        // Also check if we already have a session (user clicked link and got redirected)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true);
        });
    }, []);

    function validate() {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Must include at least one uppercase letter';
        if (!/[0-9]/.test(password)) return 'Must include at least one number';
        if (!/[^A-Za-z0-9]/.test(password)) return 'Must include at least one special character (!@#$...)';
        if (password !== confirmPassword) return 'Passwords do not match';
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        setError('');

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
        setTimeout(() => navigate('/dashboard'), 3000);
    }

    const strength = getStrength(password);

    if (success) {
        return (
            <div className="auth-page">
                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="auth-logo">
                        <div className="logo-dot" />
                        Meeting<span className="logo-debt">Debt</span>
                    </div>
                    <div className="auth-title">Password updated</div>
                    <div className="auth-sub" style={{ marginBottom: 24 }}>
                        Your password has been reset successfully. Redirecting to dashboard...
                    </div>
                    <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                        Go to dashboard
                    </Link>
                </motion.div>
            </div>
        );
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
                <div className="auth-title">Set new password</div>
                <div className="auth-sub">Choose a strong password for your account</div>

                {!sessionReady ? (
                    <div style={{
                        padding: '14px 18px', borderRadius: 10,
                        background: 'var(--amber-light)', border: '1px solid var(--amber)',
                        fontSize: 13, color: 'var(--amber)', marginBottom: 20, marginTop: 16,
                    }}>
                        Verifying your reset link... If this takes too long,{' '}
                        <Link to="/forgot-password" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                            request a new one
                        </Link>.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label className="field-label">New password</label>
                        <input
                            className="field-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(''); }}
                            autoFocus
                        />

                        {/* Strength meter */}
                        {password && (
                            <div style={{ marginTop: -6, marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{
                                            height: 3, flex: 1, borderRadius: 99,
                                            background: i <= strength.score ? strength.color : 'var(--border)',
                                            transition: 'all 0.2s',
                                        }} />
                                    ))}
                                </div>
                                <div style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>
                                    {strength.label}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                    Requires: 8+ characters, uppercase, number, special character
                                </div>
                            </div>
                        )}

                        <label className="field-label">Confirm new password</label>
                        <input
                            className="field-input"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                        />
                        {confirmPassword && password === confirmPassword && (
                            <div style={{ fontSize: 11, color: '#16a34a', marginTop: -6, marginBottom: 10 }}>
                                Passwords match
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Updating...' : 'Update password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">Back to sign in</Link>
                </div>
            </motion.div>
        </div>
    );
}
