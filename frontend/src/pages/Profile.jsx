import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import axios from 'axios';
import API from '../config';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('profile');
    const [name, setName] = useState('');
    const [nameEditing, setNameEditing] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [passwordSent, setPasswordSent] = useState(false);
    const [nudgeEmails, setNudgeEmails] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('tab') === 'settings') setTab('settings');
    }, [searchParams]);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
            setName(session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || '');

            // Fetch workspaces
            try {
                const { data } = await axios.get(`${API}/workspaces?userId=${session.user.id}`);
                setWorkspaces(data);
            } catch (err) {
                console.error(err);
            }
        });
    }, [navigate]);

    async function saveName() {
        setSavingName(true);
        await supabase.auth.updateUser({ data: { full_name: name } });
        setSavingName(false);
        setNameEditing(false);
    }

    async function sendPasswordReset() {
        await supabase.auth.resetPasswordForEmail(user.email);
        setPasswordSent(true);
    }

    async function handleDelete() {
        if (deleteConfirm !== 'DELETE') {
            setDeleteError('Please type DELETE exactly to confirm.');
            return;
        }

        const role = localStorage.getItem('userRole');
        const workspaceId = localStorage.getItem('workspaceId');

        if (role === 'manager' && workspaceId) {
            // Check if there are other members
            try {
                const { data: members } = await axios.get(`${API}/workspaces/${workspaceId}/members`);
                const otherMembers = members.filter(m => m.user_id !== user.id);
                if (otherMembers.length > 0) {
                    setDeleteError('You are a manager with team members. Please transfer ownership or remove all members before deleting your account.');
                    return;
                }
            } catch (err) {
                console.error(err);
            }
        }

        setDeleting(true);
        try {
            // Sign out and delete
            await supabase.auth.signOut();
            localStorage.clear();
            navigate('/');
        } catch (err) {
            setDeleteError('Failed to delete account. Please try again.');
            setDeleting(false);
        }
    }

    async function switchWorkspace(ws) {
        localStorage.setItem('workspaceId', ws.id);
        localStorage.setItem('workspaceName', ws.name);
        localStorage.setItem('userRole', ws.role);
        if (ws.role === 'manager') {
            localStorage.removeItem('soloMode');
        }
        navigate('/dashboard');
    }

    const tabs = [
        { key: 'profile', label: 'Profile' },
        { key: 'settings', label: 'Settings' },
        { key: 'danger', label: 'Danger zone' },
    ];

    if (!user) return null;

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <div className="main" style={{ maxWidth: 680, margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 24 }}
            >
                <div className="page-title">Profile</div>
                <div className="page-sub">Manage your account and preferences</div>
            </motion.div>

            {/* Avatar + name header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '20px 24px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 16
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--accent-light)', color: 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, flexShrink: 0
                }}>
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {displayName}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            padding: '7px 16px', borderRadius: 8, border: 'none',
                            background: tab === t.key ? 'var(--accent-light)' : 'transparent',
                            color: tab === t.key ? 'var(--accent-text)' : 'var(--text-muted)',
                            fontWeight: tab === t.key ? 600 : 400,
                            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">

                {/* PROFILE TAB */}
                {tab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div className="card-header">
                                <div className="card-title">Account details</div>
                            </div>

                            {/* Name */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Full name</div>
                                {nameEditing ? (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            className="field-input"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            style={{ marginBottom: 0, flex: 1 }}
                                            autoFocus
                                        />
                                        <button onClick={saveName} className="btn-extract" style={{ padding: '8px 16px' }} disabled={savingName}>
                                            {savingName ? 'Saving...' : 'Save'}
                                        </button>
                                        <button onClick={() => setNameEditing(false)} className="btn-cancel" style={{ padding: '8px 16px' }}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{displayName}</div>
                                        <button onClick={() => setNameEditing(true)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</div>
                                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{user.email}</div>
                            </div>

                            {/* Password */}
                            <div style={{ padding: '14px 20px' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</div>
                                {passwordSent ? (
                                    <div style={{ fontSize: 13, color: 'var(--accent)' }}>✓ Password reset email sent to {user.email}</div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>••••••••</div>
                                        <button onClick={sendPasswordReset} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                            Send reset email
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Workspaces */}
                        {workspaces.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">Your workspaces</div>
                                </div>
                                {workspaces.map((ws, i) => {
                                    const isActive = localStorage.getItem('workspaceId') === ws.id;
                                    return (
                                        <div key={ws.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 20px',
                                            borderBottom: i < workspaces.length - 1 ? '1px solid var(--border)' : 'none',
                                            background: isActive ? 'var(--accent-light)' : 'transparent'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{ws.name}</div>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                    background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                    color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)'
                                                }}>
                                                    {ws.role}
                                                </span>
                                            </div>
                                            {!isActive && (
                                                <button
                                                    onClick={() => switchWorkspace(ws)}
                                                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Switch →
                                                </button>
                                            )}
                                            {isActive && (
                                                <span style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 600 }}>Active</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* SETTINGS TAB */}
                {tab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Notifications</div>
                            </div>
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>Nudge emails</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive email reminders when commitments are overdue</div>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setNudgeEmails(!nudgeEmails)}
                                        style={{
                                            width: 44, height: 24, borderRadius: 12, border: 'none',
                                            background: nudgeEmails ? '#16a34a' : 'var(--border)',
                                            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                            flexShrink: 0
                                        }}
                                    >
                                        <motion.div
                                            animate={{ x: nudgeEmails ? 22 : 2 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            style={{
                                                width: 18, height: 18, borderRadius: '50%',
                                                background: '#fff', position: 'absolute', top: 3,
                                            }}
                                        />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* DANGER ZONE TAB */}
                {tab === 'danger' && (
                    <motion.div
                        key="danger"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="card" style={{ border: '1px solid var(--red)' }}>
                            <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="card-title" style={{ color: 'var(--red)' }}>⚠️ Danger zone</div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                                    Delete your account
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                                    This action is permanent and cannot be undone. All your meetings, commitments, and data will be deleted.
                                    {localStorage.getItem('userRole') === 'manager' && (
                                        <span style={{ color: 'var(--red)', display: 'block', marginTop: 8 }}>
                                            ⚠️ You are a manager. If your team has members, you must remove them first before deleting your account.
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="field-label">Type DELETE to confirm</label>
                                    <input
                                        className="field-input"
                                        placeholder="DELETE"
                                        value={deleteConfirm}
                                        onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                                        style={{ borderColor: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--border)' }}
                                    />
                                </div>

                                {deleteError && (
                                    <div className="auth-error" style={{ marginBottom: 12 }}>{deleteError}</div>
                                )}

                                <button
                                    onClick={handleDelete}
                                    disabled={deleting || deleteConfirm !== 'DELETE'}
                                    style={{
                                        padding: '10px 20px', borderRadius: 8, border: 'none',
                                        background: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--border)',
                                        color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--text-muted)',
                                        fontSize: 13, fontWeight: 600, cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                                        fontFamily: 'inherit', transition: 'all 0.15s'
                                    }}
                                >
                                    {deleting ? 'Deleting...' : 'Delete my account permanently'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}