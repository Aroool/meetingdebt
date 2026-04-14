import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

export default function AcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        async function accept() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    localStorage.setItem('pendingInvite', token);
                    navigate('/signup');
                    return;
                }

                const { data } = await api.post(`/invites/${token}/accept`);

                // Fetch workspace name
                const wsRes = await api.get(`/workspaces/${data.workspaceId}`);

                // Only switch if no active workspace already
                const existingWsId = localStorage.getItem('workspaceId');
                if (!existingWsId) {
                    localStorage.setItem('workspaceId', data.workspaceId);
                    localStorage.setItem('workspaceName', wsRes.data.name);
                    localStorage.setItem('userRole', 'member');
                    localStorage.removeItem('soloMode');
                }

                setStatus('success');
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (err) {
                setError('Invalid or expired invite link.');
                setStatus('error');
            }
        }
        accept();
    }, [token, navigate]);

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
            >
                <div className="auth-logo" style={{ justifyContent: 'center' }}>
                    <div className="logo-dot" />
                    Meeting<span className="logo-debt">Debt</span>
                </div>

                {status === 'loading' && (
                    <>
                        <div className="auth-title">Accepting invite...</div>
                        <div className="auth-sub">Just a moment</div>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                        <div className="auth-title">You're in!</div>
                        <div className="auth-sub">Taking you to your dashboard...</div>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                        <div className="auth-title">Invite not found</div>
                        <div className="auth-error" style={{ textAlign: 'left' }}>{error}</div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary"
                            style={{ marginTop: 16 }}
                        >
                            Go to dashboard
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}