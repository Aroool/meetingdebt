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
    const [prefs, setPrefs] = useState({ timezone: 'America/New_York', nudge_hour: 9 });
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);
    const [stats, setStats] = useState({ total: 0, done: 0, pending: 0, overdue: 0 });
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
                // Fetch commitment stats across all workspaces
                if (data.length > 0) {
                    const allCommitments = await Promise.all(
                        data.map(ws => api.get('/commitments', { params: { workspaceId: ws.id, userId: u.id } }).then(r => r.data).catch(() => []))
                    );
                    const flat = allCommitments.flat();
                    const now = new Date();
                    setStats({
                        total: flat.length,
                        done: flat.filter(c => c.status === 'completed').length,
                        pending: flat.filter(c => c.status === 'pending').length,
                        overdue: flat.filter(c => {
                            if (c.status === 'completed') return false;
                            if (!c.deadline) return false;
                            const [y, m, d] = c.deadline.slice(0, 10).split('-').map(Number);
                            return new Date(y, m - 1, d) < now;
                        }).length,
                    });
                }
            } catch (err) { console.error(err); }
            try {
                const { data } = await api.get('/preferences');
                setPrefs(data);
            } catch (err) { console.error(err); }
        });
    }, [navigate]);

    function getAvatarUrl() {
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
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
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
                data: { full_name: fullName, first_name: form.first_name, last_name: form.last_name, nickname: form.nickname, bio: form.bio, avatar_url: form.avatar_url }
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
        await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setPasswordSent(true);
    }

    async function savePrefs() {
        setPrefsSaving(true);
        try {
            await api.post('/preferences', prefs);
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 3000);
        } catch (err) {
            alert('Failed to save preferences: ' + err.message);
        } finally {
            setPrefsSaving(false);
        }
    }

    async function deleteAccount() {
        if (deleteConfirm !== 'DELETE') return;
        setDeleting(true);
        try {
            await supabase.auth.signOut();
            localStorage.clear();
            navigate('/');
        } catch (err) { console.error(err); } finally { setDeleting(false); }
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
    const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const TABS = [
        { key: 'profile', label: 'Profile' },
        { key: 'workspaces', label: 'Workspaces' },
        { key: 'settings', label: 'Settings' },
    ];

    return (
        <div className="main" style={{ maxWidth: 700, margin: '0 auto' }}>

            {/* Hero card */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    borderRadius: 20, overflow: 'hidden',
                    border: '1px solid var(--border)', marginBottom: 20,
                    background: 'var(--bg-card)',
                }}
            >
                {/* Banner */}
                <div style={{
                    height: 90,
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 40%, #1d4ed8 100%)',
                    position: 'relative',
                }} />

                {/* Avatar + info row */}
                <div style={{ padding: '0 28px 24px', position: 'relative' }}>
                    {/* Avatar overlapping banner */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44 }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: '50%',
                                background: avatarUrl ? 'transparent' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 30, fontWeight: 800, color: '#1d4ed8',
                                border: '4px solid var(--bg-card)', overflow: 'hidden',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            }}>
                                {avatarUrl
                                    ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : initials}
                            </div>
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={avatarUploading}
                                style={{
                                    position: 'absolute', bottom: 2, right: 2,
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: '#16a34a', border: '2px solid var(--bg-card)',
                                    cursor: 'pointer', fontSize: 13, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                title="Change photo"
                            >
                                {avatarUploading ? '…' : '📷'}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                        </div>

                        {/* Member since + verification badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                                background: user.email_confirmed_at ? '#dcfce7' : '#fef3c7',
                                color: user.email_confirmed_at ? '#16a34a' : '#92400e',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                {user.email_confirmed_at ? '✓ Verified' : '⚠ Unverified'}
                            </div>
                        </div>
                    </div>

                    {/* Name & info */}
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                                {displayName}
                            </div>
                            {form.nickname && (
                                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>"{form.nickname}"</span>
                            )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            {user.email} · Member since {memberSince}
                        </div>
                        {form.bio && (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                                "{form.bio}"
                            </div>
                        )}
                    </div>

                    {/* Stats row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1, marginTop: 20, borderRadius: 12, overflow: 'hidden',
                        border: '1px solid var(--border)',
                    }}>
                        {[
                            { label: 'Total Tasks', value: stats.total, color: 'var(--text-primary)' },
                            { label: 'Completed', value: stats.done, color: '#16a34a' },
                            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                            { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
                        ].map((s, i) => (
                            <div key={s.label} style={{
                                padding: '14px 0', textAlign: 'center',
                                background: 'var(--bg)',
                                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '8px 18px', border: 'none', background: 'none',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                        fontWeight: tab === t.key ? 700 : 400,
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
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
                            Edit profile
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>First name</label>
                                <input className="field-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="John" style={{ marginBottom: 0 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Last name</label>
                                <input className="field-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Smith" style={{ marginBottom: 0 }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                Nickname <span style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input className="field-input" value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} placeholder="e.g. Johnny" style={{ marginBottom: 0 }} />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                Bio <span style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <textarea className="field-input" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your team about yourself..." rows={3} style={{ marginBottom: 0, resize: 'none', fontFamily: 'inherit' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ padding: '10px 28px', fontSize: 13 }}>
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            {saveSuccess && (
                                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
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
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                My workspaces
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</div>
                        </div>
                        {workspaces.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No workspaces yet</div>
                        ) : workspaces.map((ws, i) => {
                            const isActive = ws.id === activeWsId;
                            return (
                                <div key={ws.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 20px',
                                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                                    background: isActive ? 'var(--accent-light)' : 'transparent',
                                    transition: 'background 0.1s',
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                        background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    }}>
                                        {ws.role === 'manager' ? '🏢' : '👤'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{ws.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)',
                                            }}>{ws.role}</span>
                                            {isActive && (
                                                <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!isActive && (
                                        <button onClick={() => switchWorkspace(ws)} style={{
                                            fontSize: 12, padding: '7px 16px', borderRadius: 8,
                                            border: '1px solid var(--border)', background: 'var(--bg)',
                                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, color: 'var(--text-primary)',
                                        }}>
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

                    {/* Notification preferences */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>🔔</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Notification preferences</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>When you receive daily task digests and overdue alerts</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Your timezone</label>
                                    <select className="field-input" value={prefs.timezone} onChange={e => setPrefs(p => ({ ...p, timezone: e.target.value }))} style={{ marginBottom: 0 }}>
                                        {[
                                            ['America/New_York',   'Eastern (EST) — New York, Boston'],
                                            ['America/Chicago',    'Central (CST) — Chicago, Dallas'],
                                            ['America/Denver',     'Mountain (MST) — Denver'],
                                            ['America/Los_Angeles','Pacific (PST) — Los Angeles'],
                                            ['Pacific/Honolulu',   'Hawaii — Honolulu'],
                                            ['America/Sao_Paulo',  'Brazil — São Paulo'],
                                            ['Europe/London',      'GMT/BST — London'],
                                            ['Europe/Paris',       'CET — Paris, Berlin'],
                                            ['Europe/Moscow',      'Moscow Time'],
                                            ['Asia/Dubai',         'GST — Dubai'],
                                            ['Asia/Kolkata',       'IST — Mumbai, Delhi'],
                                            ['Asia/Dhaka',         'BST — Dhaka'],
                                            ['Asia/Bangkok',       'ICT — Bangkok'],
                                            ['Asia/Singapore',     'SGT — Singapore'],
                                            ['Asia/Tokyo',         'JST — Tokyo'],
                                            ['Asia/Shanghai',      'CST — Shanghai'],
                                            ['Australia/Sydney',   'AEST — Sydney'],
                                            ['Pacific/Auckland',   'NZST — Auckland'],
                                        ].map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Daily email time</label>
                                    <select className="field-input" value={prefs.nudge_hour} onChange={e => setPrefs(p => ({ ...p, nudge_hour: parseInt(e.target.value) }))} style={{ marginBottom: 0 }}>
                                        {Array.from({ length: 17 }, (_, i) => i + 6).map(h => {
                                            const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
                                            return <option key={h} value={h}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button onClick={savePrefs} disabled={prefsSaving} className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
                                    {prefsSaving ? 'Saving...' : 'Save preferences'}
                                </button>
                                {prefsSaved && (
                                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                                        ✓ Saved!
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>🔒</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Password</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Send a reset link to {user.email}</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
                            {passwordSent ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 16px', borderRadius: 10,
                                    background: '#dcfce7', border: '1px solid #bbf7d0',
                                    fontSize: 13, color: '#16a34a', fontWeight: 600,
                                }}>
                                    ✓ Reset email sent! Check your inbox.
                                </div>
                            ) : (
                                <button onClick={sendPasswordReset} style={{
                                    fontSize: 13, padding: '10px 20px', borderRadius: 8,
                                    border: '1px solid var(--border)', background: 'var(--bg)',
                                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}>
                                    Send reset link →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--red)', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--red)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 18 }}>⚠️</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Danger zone</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently delete your account — cannot be undone</div>
                            </div>
                        </div>
                        <div style={{ padding: 24 }}>
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
                                    fontSize: 13, padding: '10px 20px', borderRadius: 8,
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
                    </div>
                </motion.div>
            )}
        </div>
    );
}
