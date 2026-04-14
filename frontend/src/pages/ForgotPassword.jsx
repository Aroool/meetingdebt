import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email.trim()) { setError('Please enter your email'); return; }
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        setSent(true);
        setLoading(false);
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

                {sent ? (
                    <>
                        <div className="auth-title">Check your email</div>
                        <div className="auth-sub" style={{ marginBottom: 24 }}>
                            We sent a password reset link to <strong>{email}</strong>.
                            Click the link in the email to set a new password.
                        </div>
                        <div style={{
                            padding: '14px 18px', borderRadius: 10,
                            background: 'var(--accent-light)', border: '1px solid var(--accent)',
                            fontSize: 13, color: 'var(--accent-text)', marginBottom: 20,
                        }}>
                            Didn't get it? Check your spam folder, or make sure you entered the right email.
                        </div>
                        <button
                            onClick={() => { setSent(false); setEmail(''); }}
                            className="btn-primary"
                            style={{ marginBottom: 0 }}
                        >
                            Try again
                        </button>
                    </>
                ) : (
                    <>
                        <div className="auth-title">Reset your password</div>
                        <div className="auth-sub">
                            Enter your email and we'll send you a reset link
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label className="field-label">Email address</label>
                            <input
                                className="field-input"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                required
                                autoFocus
                            />
                            {error && <div className="auth-error">{error}</div>}
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    </>
                )}

                <div className="auth-footer">
                    Remember your password?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </motion.div>
        </div>
    );
}
