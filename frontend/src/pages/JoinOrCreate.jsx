import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { supabase } from '../supabase';
import API from '../config';

export default function JoinOrCreate() {
    const navigate = useNavigate();

    async function handleSolo() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const userEmail = session?.user?.email;
            const name = session?.user?.user_metadata?.full_name || userEmail?.split('@')[0] || 'My';

            await axios.post(`${API}/workspaces`, {
                name: `${name}'s Workspace`,
                userId,
                userEmail
            });

            localStorage.setItem('userRole', 'solo');
            localStorage.setItem('soloMode', 'true');
            localStorage.removeItem('workspaceId');
            localStorage.removeItem('workspaceName');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ maxWidth: 480 }}
            >
                <div className="auth-logo">
                    <div className="logo-dot" />
                    Meeting<span className="logo-debt">Debt</span>
                </div>

                <div className="auth-title">How are you using MeetingDebt?</div>
                <div className="auth-sub" style={{ marginBottom: 24 }}>
                    Pick what fits you best — you can always change this later.
                </div>

                {/* Solo option */}
                <motion.div
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSolo}
                    style={{
                        background: 'var(--bg)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        marginBottom: 10,
                    }}
                >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>🙋</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Just me — personal use
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                        I want to track my own meeting commitments. No team needed.
                    </div>
                </motion.div>

                {/* Manager option */}
                <motion.div
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/create-workspace')}
                    style={{
                        background: 'var(--bg)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        marginBottom: 10,
                    }}
                >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>🏢</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Set up a team workspace
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                        I'm a manager and want to track my whole team's commitments. I'll invite them after.
                    </div>
                </motion.div>

                {/* Member option */}
                <motion.div
                    whileHover={{ scale: 1.02, borderColor: 'var(--accent)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/enter-invite')}
                    style={{
                        background: 'var(--bg)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        marginBottom: 20,
                    }}
                >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>✉️</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Join with an invite link
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                        My manager invited me to their workspace. I have an invite link in my email.
                    </div>
                </motion.div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Not sure? Start solo — you can create a team later.
                </div>
            </motion.div>
        </div>
    );
}