import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

export default function Signup() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        firstName: '', lastName: '', nickname: '', bio: '',
        email: '', password: '', confirmPassword: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    }

    function handleAvatar(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return; }
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    function validateStep1() {
        if (!form.firstName.trim()) return 'First name is required';
        if (!form.lastName.trim()) return 'Last name is required';
        return null;
    }

    function validateStep2() {
        if (!form.email.trim()) return 'Email is required';
        if (!form.password) return 'Password is required';
        if (form.password.length < 8) return 'Password must be at least 8 characters';
        if (form.password !== form.confirmPassword) return 'Passwords do not match';
        return null;
    }

    function nextStep() {
        const err = validateStep1();
        if (err) { setError(err); return; }
        setStep(2);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const err = validateStep2();
        if (err) { setError(err); return; }

        setLoading(true);
        try {
            const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

            const { data, error: signupError } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
                options: {
                    data: {
                        full_name: fullName,
                        first_name: form.firstName.trim(),
                        last_name: form.lastName.trim(),
                        nickname: form.nickname.trim(),
                        bio: form.bio.trim(),
                        avatar_url: '',
                    }
                }
            });

            if (signupError) throw signupError;

            // Upload avatar if provided
            if (avatar && data.user) {
                const ext = avatar.name.split('.').pop();
                const path = `${data.user.id}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(path, avatar, { upsert: true });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(path);
                    await supabase.auth.updateUser({
                        data: { avatar_url: urlData.publicUrl }
                    });
                }
            }

            sessionStorage.setItem('showTransition', 'true');
            navigate('/join-or-create');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const initials = form.firstName ? form.firstName[0].toUpperCase() : '?';

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg)', padding: 20,
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    width: '100%', maxWidth: 460,
                    background: 'var(--bg-card)', borderRadius: 20,
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ padding: '28px 32px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                            Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                        </span>
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {step === 1 ? 'Create your account' : 'Almost there 🎉'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                        {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
                    </div>

                    {/* Progress */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                        {[1, 2].map(s => (
                            <div key={s} style={{
                                height: 3, flex: 1, borderRadius: 10,
                                background: s <= step ? '#16a34a' : 'var(--border)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>
                </div>

                <div style={{ padding: '0 32px 32px' }}>
                    <AnimatePresence mode="wait">

                        {/* Step 1 — Profile info */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Avatar upload */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                                    <label style={{ cursor: 'pointer', position: 'relative' }}>
                                        <div style={{
                                            width: 80, height: 80, borderRadius: '50%',
                                            background: avatarPreview ? 'transparent' : '#dbeafe',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', border: '3px solid var(--border)',
                                            transition: 'border-color 0.2s',
                                        }}>
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="avatar"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8' }}>
                                                    {initials}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: '#16a34a', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, color: '#fff', border: '2px solid var(--bg-card)',
                                        }}>
                                            +
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleAvatar}
                                            style={{ display: 'none' }} />
                                    </label>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: -16, marginBottom: 20 }}>
                                    Click to add photo (optional)
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                            First name *
                                        </label>
                                        <input
                                            className="field-input"
                                            name="firstName"
                                            placeholder="John"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                            Last name *
                                        </label>
                                        <input
                                            className="field-input"
                                            name="lastName"
                                            placeholder="Smith"
                                            value={form.lastName}
                                            onChange={handleChange}
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
                                        name="nickname"
                                        placeholder="Johnny"
                                        value={form.nickname}
                                        onChange={handleChange}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                        Bio <span style={{ fontWeight: 400 }}>(optional)</span>
                                    </label>
                                    <textarea
                                        className="field-input"
                                        name="bio"
                                        placeholder="Tell your team a bit about yourself..."
                                        value={form.bio}
                                        onChange={handleChange}
                                        rows={2}
                                        style={{ marginBottom: 0, resize: 'none', fontFamily: 'inherit' }}
                                    />
                                </div>

                                {error && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={nextStep}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600 }}
                                >
                                    Continue →
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2 — Credentials */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Mini profile preview */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'var(--bg)', border: '1px solid var(--border)',
                                    marginBottom: 20,
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: avatarPreview ? 'transparent' : '#dbeafe',
                                        overflow: 'hidden', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {avatarPreview
                                            ? <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>{initials}</span>
                                        }
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {form.firstName} {form.lastName}
                                            {form.nickname && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> "{form.nickname}"</span>}
                                        </div>
                                        {form.bio && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.bio}</div>}
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Edit
                                    </button>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                        Email address *
                                    </label>
                                    <input
                                        className="field-input"
                                        name="email"
                                        type="email"
                                        placeholder="john@company.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                        Password * <span style={{ fontWeight: 400 }}>(min. 8 characters)</span>
                                    </label>
                                    <input
                                        className="field-input"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                        Confirm password *
                                    </label>
                                    <input
                                        className="field-input"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        style={{ marginBottom: 0 }}
                                    />
                                    {form.confirmPassword && form.password !== form.confirmPassword && (
                                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Passwords do not match</div>
                                    )}
                                    {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                                        <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>✓ Passwords match</div>
                                    )}
                                </div>

                                {error && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600 }}
                                >
                                    {loading ? 'Creating account...' : 'Create account 🚀'}
                                </button>

                                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                    By signing up you agree to our terms of service
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}