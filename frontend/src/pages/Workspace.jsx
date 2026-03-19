import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import axios from 'axios';
import API from '../config';
import { useNavigate } from 'react-router-dom';

export default function Workspace() {
    const [workspace, setWorkspace] = useState(null);
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [error, setError] = useState('');
    const [role, setRole] = useState('member');
    const navigate = useNavigate();

    const workspaceId = localStorage.getItem('workspaceId');
    const workspaceName = localStorage.getItem('workspaceName');

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const [membersRes, roleRes, workspaceRes] = await Promise.all([
                axios.get(`${API}/workspaces/${workspaceId}/members`),
                axios.get(`${API}/workspaces/${workspaceId}/role?userId=${userId}`),
                axios.get(`${API}/workspaces/${workspaceId}`)
            ]);

            setMembers(membersRes.data);
            setRole(roleRes.data.role);
            setWorkspace(workspaceRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function handleInvite(e) {
        e.preventDefault();
        setInviting(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await axios.post(`${API}/workspaces/${workspaceId}/invite`, {
                email: inviteEmail,
                invitedBy: session?.user?.id,
                workspaceName
            });
            setInviteEmail('');
            setInviteSuccess(true);
            setTimeout(() => setInviteSuccess(false), 3000);
        } catch (err) {
            setError('Failed to send invite. Try again.');
        } finally {
            setInviting(false);
        }
    }

    const avatarColors = ['av-blue', 'av-purple', 'av-amber', 'av-rose', 'av-teal'];
    function getAvatarColor(email) {
        return avatarColors[(email?.charCodeAt(0) || 0) % avatarColors.length];
    }

    return (
        <div className="main">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="page-title">{workspaceName || 'Workspace'}</div>
                <div className="page-sub">{members.length} members · {role === 'manager' ? 'You are the manager' : 'You are a member'}</div>
            </motion.div>

            {localStorage.getItem('soloMode') === 'true' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--accent-light)',
                        border: '1px solid var(--accent)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-text)', marginBottom: 3 }}>
                            You're using MeetingDebt solo
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--accent-text)', opacity: 0.8 }}>
                            Want to track your team's commitments? Create or join a workspace.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                            onClick={() => {
                                localStorage.removeItem('soloMode');
                                navigate('/create-workspace');
                            }}
                            style={{
                                fontSize: 12, padding: '7px 14px', borderRadius: 8,
                                border: 'none', background: '#16a34a', color: '#fff',
                                cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit'
                            }}
                        >
                            Create team →
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('soloMode');
                                navigate('/enter-invite');
                            }}
                            style={{
                                fontSize: 12, padding: '7px 14px', borderRadius: 8,
                                border: '1px solid var(--accent)', background: 'transparent',
                                color: 'var(--accent-text)', cursor: 'pointer', fontWeight: 600,
                                fontFamily: 'inherit'
                            }}
                        >
                            Join team
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="two-col" style={{ gridTemplateColumns: '1fr 320px' }}>
                {/* Members list */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Team members</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{members.length} total</div>
                    </div>
                    {loading ? (
                        <div className="empty-state"><div className="empty-title">Loading...</div></div>
                    ) : members.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-title">No members yet</div>
                            <div className="empty-sub">Invite your team using the form</div>
                        </div>
                    ) : (
                        members.map((m, i) => (
                            <motion.div
                                key={m.id}
                                className="commitment-row"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className={`avatar ${getAvatarColor(m.email)}`}>
                                    {m.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="commit-info">
                                    <div className="commit-task">{m.email}</div>
                                    <div className="commit-meta">Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                                </div>
                                <span className={`pill ${m.role === 'manager' ? 'pill-green' : 'pill-blue'}`}>
                                    {m.role}
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Invite form — only for managers */}
                <div className="sidebar">
                    {role === 'manager' && (
                        <div className="sidebar-card">
                            <div className="sidebar-head">Invite team member</div>
                            <div style={{ padding: '14px 16px' }}>
                                <form onSubmit={handleInvite}>
                                    <label className="field-label">Email address</label>
                                    <input
                                        className="field-input"
                                        type="email"
                                        placeholder="teammate@company.com"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        required
                                        style={{ marginBottom: 10 }}
                                    />
                                    {error && <div className="auth-error" style={{ marginBottom: 10 }}>{error}</div>}
                                    {inviteSuccess && (
                                        <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>
                                            ✓ Invite sent!
                                        </div>
                                    )}
                                    <button className="btn-extract" type="submit" disabled={inviting}>
                                        {inviting ? 'Sending...' : 'Send invite →'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="sidebar-card">
                        <div className="sidebar-head">Workspace info</div>
                        <div style={{ padding: '14px 16px' }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Workspace name</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{workspaceName}</div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your role</div>
                                <span className={`pill ${role === 'manager' ? 'pill-green' : 'pill-blue'}`} style={{ fontSize: 12 }}>
                                    {role}
                                </span>
                            </div>

                            {role === 'manager' && workspace?.code && (
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Team code</div>
                                    <div style={{
                                        background: 'var(--accent-light)',
                                        border: '1px solid var(--accent)',
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 6, color: 'var(--accent-text)' }}>
                                            {workspace.code}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--accent-text)', marginTop: 4 }}>
                                            Share this code with your team
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}