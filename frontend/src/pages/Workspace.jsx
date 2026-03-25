import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

function RightPanel({ ws, isActive, onSwitch }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMember, setExpandedMember] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);



    useEffect(() => {
        setLoading(true);
        setExpandedMember(null);
        api.get(`/workspaces/${ws.id}/members`)
            .then(res => { setMembers(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [ws.id]);

    async function handleInvite(e) {
        e.preventDefault();
        setInviting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await api.post(`/workspaces/${ws.id}/invite`, {
                email: inviteEmail,
                invitedBy: session?.user?.id,
                workspaceName: ws.name
            });
            setInviteEmail('');
            setInviteSuccess(true);
            setTimeout(() => setInviteSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setInviting(false);
        }
    }

    const avatarColors = [
        { bg: '#dbeafe', color: '#1d4ed8' },
        { bg: '#ede9fe', color: '#7c3aed' },
        { bg: '#fef3c7', color: '#92400e' },
        { bg: '#ffe4e6', color: '#be123c' },
        { bg: '#ccfbf1', color: '#0f766e' },
    ];

    return (
        <motion.div
            key={ws.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {ws.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                            color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)'
                        }}>
                            {ws.role}
                        </span>
                        {isActive && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active workspace</span>
                        )}
                    </div>
                </div>
                {!isActive && (
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => onSwitch(ws)}
                        style={{
                            fontSize: 13, padding: '8px 18px', borderRadius: 8,
                            border: 'none', background: '#16a34a', color: '#fff',
                            cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit'
                        }}
                    >
                        Switch to this →
                    </motion.button>
                )}
            </div>

            {/* Stats row */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
                borderBottom: '0.5px solid var(--border)', flexShrink: 0,
            }}>
                {[
                    { label: 'Members', value: ws.stats?.members || 0, color: 'var(--text-primary)' },
                    { label: 'Total', value: ws.stats?.total || 0, color: 'var(--text-primary)' },
                    { label: 'Pending', value: ws.stats?.pending || 0, color: 'var(--amber)' },
                    { label: 'Overdue', value: ws.stats?.overdue || 0, color: 'var(--red)' },
                    { label: 'Done', value: ws.stats?.done || 0, color: 'var(--accent)' },
                ].map((s, i) => (
                    <div key={s.label} style={{
                        padding: '10px 0', textAlign: 'center',
                        borderRight: i < 4 ? '0.5px solid var(--border)' : 'none',
                        background: isActive ? 'var(--accent-light)' : 'var(--bg)',
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: -0.5, lineHeight: 1, marginBottom: 3 }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Members list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Team members
                </div>

                {loading ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
                ) : members.map((m, i) => {
                    const av = avatarColors[i % avatarColors.length];
                    const isOpen = expandedMember === m.id;
                    return (
                        <div key={m.id}>
                            <div
                                onClick={() => setExpandedMember(isOpen ? null : m.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                    background: isOpen ? 'var(--bg)' : 'transparent',
                                    transition: 'background 0.1s', marginBottom: 2,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: av.bg, color: av.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, flexShrink: 0
                                }}>
                                    {m.email?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.email}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        Joined {new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                                    background: m.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                    color: m.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)'
                                }}>
                                    {m.role}
                                </span>
                                <motion.span
                                    animate={{ rotate: isOpen ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, display: 'inline-block' }}
                                >
                                    ›
                                </motion.span>
                            </div>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{
                                            background: 'var(--bg)', borderRadius: 8,
                                            padding: '10px 14px', margin: '3px 0 6px 40px',
                                            border: '0.5px solid var(--border)'
                                        }}>
                                            {[
                                                ['Email', m.email],
                                                ['Role', m.role],
                                                ['Joined', new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                                            ].map(([label, value]) => (
                                                <div key={label} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    padding: '4px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12
                                                }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Footer — invite + code — manager only */}
            {ws.role === 'manager' && (
                <div style={{
                    borderTop: '0.5px solid var(--border)', padding: '12px 20px',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 16,
                    alignItems: 'start', flexShrink: 0, background: 'var(--bg-card)'
                }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                            Invite member
                        </div>
                        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="field-input"
                                type="email"
                                placeholder="teammate@company.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                required
                                style={{ marginBottom: 0, flex: 1 }}
                            />
                            <button className="btn-extract" type="submit" disabled={inviting}
                                style={{ whiteSpace: 'nowrap', padding: '0 16px' }}>
                                {inviting ? '...' : 'Send →'}
                            </button>
                        </form>
                        {inviteSuccess && (
                            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>✓ Invite sent!</div>
                        )}
                    </div>

                    {ws.code && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                Team code
                            </div>
                            <div style={{
                                background: 'var(--bg)', border: '0.5px solid var(--border)',
                                borderRadius: 8, padding: '7px 14px', textAlign: 'center', minWidth: 110
                            }}>
                                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 3, color: 'var(--accent-text)', lineHeight: 1 }}>
                                    {ws.code}
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
                                    Share with team
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

export default function Workspace() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();
    const activeWsId = localStorage.getItem('workspaceId');

    const fetchWorkspaces = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: wsData } = await api.get('/workspaces');

            const withStats = await Promise.all(wsData.map(async (ws) => {
                try {
                    const [membersRes, commitmentsRes] = await Promise.all([
                        api.get(`/workspaces/${ws.id}/members`),
                        api.get(`/commitments`, { params: { workspaceId: ws.id } })
                    ]);
                    const commitments = commitmentsRes.data;
                    const now = new Date();
                    return {
                        ...ws,
                        stats: {
                            members: membersRes.data.length,
                            total: commitments.length,
                            pending: commitments.filter(c => c.status === 'pending').length,
                            overdue: commitments.filter(c => {
                                if (c.status === 'completed') return false;
                                if (c.deadline) { const due = new Date(c.deadline); return !isNaN(due) && due < now; }
                                return false;
                            }).length,
                            done: commitments.filter(c => c.status === 'completed').length,
                        }
                    };
                } catch {
                    return { ...ws, stats: { members: 0, total: 0, pending: 0, overdue: 0, done: 0 } };
                }
            }));

            setWorkspaces(withStats);
            // Auto select active workspace
            const active = withStats.find(w => w.id === activeWsId) || withStats[0];
            if (active) setSelected(active);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeWsId]);

    useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

    function switchWorkspace(ws) {
        localStorage.setItem('workspaceId', ws.id);
        localStorage.setItem('workspaceName', ws.name);
        localStorage.setItem('userRole', ws.role);
        localStorage.removeItem('soloMode');
        window.dispatchEvent(new Event('workspaceSwitched'));
        navigate('/dashboard');
    }

    return (
        <div className="main">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
                <div>
                    <div className="page-title">My Teams</div>
                    <div className="page-sub">
                        {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} · Click to view details
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/create-workspace')}
                        style={{
                            fontSize: 12, padding: '7px 14px', borderRadius: 8,
                            border: 'none', background: '#16a34a', color: '#fff',
                            cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit'
                        }}
                    >
                        + Create team
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/enter-invite')}
                        style={{
                            fontSize: 12, padding: '7px 14px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit'
                        }}
                    >
                        Join another team
                    </motion.button>
                </div>
            </motion.div>

            {loading ? (
                <div className="empty-state"><div className="empty-title">Loading...</div></div>
            ) : workspaces.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 48 }}>
                    <div className="empty-title">No workspaces yet</div>
                    <div className="empty-sub">Create a team or join one with an invite code.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, height: 520 }}>
                    {/* Left panel */}
                    <div style={{
                        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                        borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '10px 14px', borderBottom: '0.5px solid var(--border)',
                            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            Workspaces
                        </div>

                        {workspaces.map(ws => {
                            const isActive = ws.id === activeWsId;
                            const isSelected = selected?.id === ws.id;
                            return (
                                <div
                                    key={ws.id}
                                    onClick={() => setSelected(ws)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', cursor: 'pointer',
                                        borderBottom: '0.5px solid var(--border)',
                                        background: isSelected ? 'var(--accent-light)' : 'transparent',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg)'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                                        background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                                    }}>
                                        {ws.role === 'manager' ? '🏢' : '👤'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 13, fontWeight: 600, marginBottom: 3,
                                            color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {ws.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                                                background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)'
                                            }}>
                                                {ws.role}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ws.stats?.members || 0} members</span>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right panel */}
                    {selected && (
                        <RightPanel
                            ws={selected}
                            isActive={selected.id === activeWsId}
                            onSwitch={switchWorkspace}
                        />
                    )}
                </div>
            )}
        </div>
    );
}