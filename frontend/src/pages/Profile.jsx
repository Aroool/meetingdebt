import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import api from '../api';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [tab, setTab] = useState('profile');
    const [workspaces, setWorkspaces] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [passwordSent, setPasswordSent] = useState(false);
    const [form, setForm] = useState({
        full_name: '', first_name: '', last_name: '',
        nickname: '', bio: '', avatar_url: '',
    });
    const fileRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('tab') === 'settings') setTab('settings');
    }, [searchParams]);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { navigate('/login'); return; }
            const u = session.user;
            setUser(u);
            const meta = u.user_metadata || {};
            setForm({
                full_name: meta.full_name || '',
                first_name: meta.first_name || '',
                last_name: meta.last_name || '',
                nickname: meta.nickname || '',
                bio: meta.bio || '',
                avatar_url: meta.avatar_url || meta.picture || '',
            });
            try {
                const { data } = await api.get(`/workspaces?userId=${u.id}`);
                setWorkspaces(data);
            } catch (err) { console.error(err); }
        });
    }, [navigate]);

    function getAvatarUrl() {
        // Priority: uploaded > google > null
        if (form.avatar_url) return form.avatar_url;
        if (user?.user_metadata?.picture) return user.user_metadata.picture;
        return null;
    }

    function getInitials() {
        const name = form.full_name || user?.email || '';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    }

    async function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
        setAvatarUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.id}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            const newUrl = urlData.publicUrl + '?t=' + Date.now();
            setForm(prev => ({ ...prev, avatar_url: newUrl }));
            await supabase.auth.updateUser({ data: { avatar_url: newUrl } });
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setAvatarUploading(false);
        }
    }

    async function saveProfile() {
        setSaving(true);
        try {
            const fullName = form.first_name && form.last_name
                ? `${form.first_name.trim()} ${form.last_name.trim()}`
                : form.full_name;
            await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    first_name: form.first_name,
                    last_name: form.last_name,
                    nickname: form.nickname,
                    bio: form.bio,
                    avatar_url: form.avatar_url,
                }
            });
            setForm(prev => ({ ...prev, full_name: fullName }));
            setSaveSuccess(true);
            window.dispatchEvent(new Event('profileUpdated'));
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function sendPasswordReset() {
        await supabase.auth.resetPasswordForEmail(user.email);
        setPasswordSent(true);
    }

    async function deleteAccount() {
        if (deleteConfirm !== 'DELETE') return;
        setDeleting(true);
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            navigate('/');
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    }

    function switchWorkspace(ws) {
        localStorage.setItem('workspaceId', ws.id);
        localStorage.setItem('workspaceName', ws.name);
        localStorage.setItem('userRole', ws.role);
        localStorage.removeItem('soloMode');
        window.dispatchEvent(new Event('workspaceSwitched'));
        navigate('/dashboard');
    }

    if (!user) return null;

    const avatarUrl = getAvatarUrl();
    const initials = getInitials();
    const displayName = form.full_name || user.email?.split('@')[0] || 'User';
    const activeWsId = localStorage.getItem('workspaceId');

    const TABS = [
        { key: 'profile', label: '👤 Profile' },
        { key: 'workspaces', label: '🏢 Workspaces' },
        { key: 'settings', label: '⚙️ Settings' },
    ];

    return (
        <div className="main" style={{ maxWidth: 680, margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-title" style={{ marginBottom: 4 }}>Profile</div>
                <div className="page-sub" style={{ marginBottom: 24 }}>Manage your account and preferences</div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '8px 16px', border: 'none', background: 'none',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
                        color: tab === t.key ? 'var(--accent-text)' : 'var(--text-muted)',
                        borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                        transition: 'all 0.15s', marginBottom: -1,
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* PROFILE TAB */}
            {tab === 'profile' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* Avatar section */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24, marginBottom: 16,
                        display: 'flex', alignItems: 'center', gap: 24,
                    }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: avatarUrl ? 'transparent' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26, fontWeight: 800, color: '#1d4ed8',
                                border: '3px solid var(--border)', overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}>
                                {avatarUrl
                                    ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials
                                }
                            </div>
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={avatarUploading}
                                style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: '#16a34a', border: '2px solid var(--bg-card)',
                                    cursor: 'pointer', fontSize: 14, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {avatarUploading ? '...' : '📷'}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                {displayName}
                                {form.nickname && (
                                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                                        "{form.nickname}"
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{user.email}</div>
                            {form.bio && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{form.bio}"</div>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                Click 📷 to change photo · Max 2MB
                            </div>
                        </div>
                    </div>

                    {/* Edit form */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24, marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                            Edit profile
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                    First name
                                </label>
                                <input
                                    className="field-input"
                                    value={form.first_name}
                                    onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                                    placeholder="John"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                    Last name
                                </label>
                                <input
                                    className="field-input"
                                    value={form.last_name}
                                    onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                                    placeholder="Smith"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                Nickname <span style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input
                                className="field-input"
                                value={form.nickname}
                                onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                                placeholder="Johnny"
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                Bio <span style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea
                                className="field-input"
                                value={form.bio}
                                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                                placeholder="Tell your team about yourself..."
                                rows={3}
                                style={{ marginBottom: 0, resize: 'none', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="btn-primary"
                                style={{ padding: '10px 24px', fontSize: 13 }}
                            >
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            {saveSuccess && (
                                <motion.span
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}
                                >
                                    ✓ Saved!
                                </motion.span>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* WORKSPACES TAB */}
            {tab === 'workspaces' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, overflow: 'hidden',
                    }}>
                        {workspaces.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                No workspaces yet
                            </div>
                        ) : workspaces.map((ws, i) => {
                            const isActive = ws.id === activeWsId;
                            return (
                                <div key={ws.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 20px',
                                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                                    background: isActive ? 'var(--accent-light)' : 'transparent',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    }}>
                                        {ws.role === 'manager' ? '🏢' : '👤'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                                            {ws.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)',
                                            }}>
                                                {ws.role}
                                            </span>
                                            {isActive && (
                                                <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!isActive && (
                                        <button
                                            onClick={() => switchWorkspace(ws)}
                                            style={{
                                                fontSize: 12, padding: '6px 14px', borderRadius: 8,
                                                border: '1px solid var(--border)', background: 'var(--bg)',
                                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            Switch →
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* Password reset */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24, marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Password
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                            Send a password reset link to {user.email}
                        </div>
                        {passwordSent ? (
                            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                                ✓ Reset email sent! Check your inbox.
                            </div>
                        ) : (
                            <button onClick={sendPasswordReset} className="btn-secondary" style={{ fontSize: 13, padding: '8px 20px' }}>
                                Send reset link
                            </button>
                        )}
                    </div>

                    {/* Danger zone */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--red)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>
                            Danger zone
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                            Permanently delete your account. This cannot be undone.
                        </div>
                        <input
                            className="field-input"
                            placeholder='Type "DELETE" to confirm'
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            style={{ marginBottom: 12, maxWidth: 280 }}
                        />
                        <br />
                        <button
                            onClick={deleteAccount}
                            disabled={deleteConfirm !== 'DELETE' || deleting}
                            style={{
                                fontSize: 13, padding: '8px 20px', borderRadius: 8,
                                border: 'none', fontFamily: 'inherit', fontWeight: 600,
                                background: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--border)',
                                color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--text-muted)',
                                cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {deleting ? 'Deleting...' : 'Delete my account'}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}