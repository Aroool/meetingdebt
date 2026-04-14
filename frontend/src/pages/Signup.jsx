import { useState, useRef } from 'react';
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
    // OTP step
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);
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

    function getStrength(pw) {
        if (!pw) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
        if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
        if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
        return { score: 4, label: 'Strong', color: '#16a34a' };
    }

    const passwordStrength = getStrength(form.password);

    function validateStep2() {
        if (!form.email.trim()) return 'Email is required';
        if (!form.password) return 'Password is required';
        if (form.password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(form.password)) return 'Password must include at least one uppercase letter';
        if (!/[0-9]/.test(form.password)) return 'Password must include at least one number';
        if (!/[^A-Za-z0-9]/.test(form.password)) return 'Password must include at least one special character (!@#$...)';
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
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                    await supabase.auth.updateUser({ data: { avatar_url: urlData.publicUrl } });
                }
            }

            // If email confirmation is disabled in Supabase, go straight to join-or-create
            if (data.session) {
                sessionStorage.setItem('showTransition', 'true');
                navigate('/join-or-create');
            } else {
                // Show OTP verification step
                setStep(3);
                startResendCooldown();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function startResendCooldown() {
        setResendCooldown(60);
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
    }

    async function resendOtp() {
        if (resendCooldown > 0) return;
        const { error } = await supabase.auth.resend({ type: 'signup', email: form.email.trim() });
        if (!error) startResendCooldown();
    }

    function handleOtpInput(index, value) {
        // Allow only digits
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setOtpError('');
        // Auto-advance
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
        // Auto-submit when all 6 filled
        if (digit && newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
            verifyOtp(newOtp.join(''));
        }
    }

    function handleOtpKeyDown(index, e) {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }

    function handleOtpPaste(e) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtp(newOtp);
            otpRefs.current[5]?.focus();
            verifyOtp(pasted);
        }
        e.preventDefault();
    }

    async function verifyOtp(code) {
        setOtpLoading(true);
        setOtpError('');
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: form.email.trim(),
                token: code,
                type: 'signup',
            });
            if (error) throw error;
            sessionStorage.setItem('showTransition', 'true');
            navigate('/join-or-create');
        } catch (err) {
            setOtpError('Invalid code. Please check your email and try again.');
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } finally {
            setOtpLoading(false);
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
                        {step === 1 ? 'Create your account' : step === 2 ? 'Almost there 🎉' : 'Verify your email'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                        {step === 1 ? 'Tell us about yourself'
                            : step === 2 ? 'Set up your login credentials'
                            : `We sent a 6-digit code to ${form.email}`}
                    </div>

                    {/* Progress */}
                    {step < 3 && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                            {[1, 2].map(s => (
                                <div key={s} style={{
                                    height: 3, flex: 1, borderRadius: 10,
                                    background: s <= step ? '#16a34a' : 'var(--border)',
                                    transition: 'background 0.3s',
                                }} />
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '0 32px 32px' }}>
                    <AnimatePresence mode="wait">

                        {/* Step 1 — Profile info */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                {/* Google signup */}
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: { redirectTo: window.location.origin + '/dashboard' }
                                        });
                                    }}
                                    style={{
                                        width: '100%', padding: '11px', borderRadius: 10,
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                        marginBottom: 16, color: 'var(--text-primary)', fontFamily: 'inherit',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18">
                                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
                                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
                                        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
                                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
                                    </svg>
                                    Continue with Google
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
                                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                </div>

                                {/* Avatar */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                                    <label style={{ cursor: 'pointer', position: 'relative' }}>
                                        <div style={{
                                            width: 80, height: 80, borderRadius: '50%',
                                            background: avatarPreview ? 'transparent' : '#dbeafe',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', border: '3px solid var(--border)',
                                        }}>
                                            {avatarPreview
                                                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <span style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8' }}>{initials}</span>
                                            }
                                        </div>
                                        <div style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: '#16a34a', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, color: '#fff', border: '2px solid var(--bg-card)',
                                        }}>+</div>
                                        <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
                                    </label>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: -16, marginBottom: 20 }}>
                                    Click to add photo (optional)
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>First name *</label>
                                        <input className="field-input" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} style={{ marginBottom: 0 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Last name *</label>
                                        <input className="field-input" name="lastName" placeholder="Smith" value={form.lastName} onChange={handleChange} style={{ marginBottom: 0 }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nickname <span style={{ fontWeight: 400 }}>(optional)</span></label>
                                    <input className="field-input" name="nickname" placeholder="Johnny" value={form.nickname} onChange={handleChange} style={{ marginBottom: 0 }} />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Bio <span style={{ fontWeight: 400 }}>(optional)</span></label>
                                    <textarea className="field-input" name="bio" placeholder="Tell your team a bit about yourself..." value={form.bio} onChange={handleChange} rows={2} style={{ marginBottom: 0, resize: 'none', fontFamily: 'inherit' }} />
                                </div>

                                {error && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>
                                        {error}
                                    </div>
                                )}
                                <button onClick={nextStep} className="btn-primary" style={{ marginTop: 0 }}>Continue →</button>
                            </motion.div>
                        )}

                        {/* Step 2 — Credentials */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                {/* Mini profile preview */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 20,
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
                                    <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email address *</label>
                                    <input className="field-input" name="email" type="email" placeholder="john@company.com" value={form.email} onChange={handleChange} style={{ marginBottom: 0 }} />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Password *</label>
                                    <input className="field-input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} style={{ marginBottom: 0 }} />
                                    {form.password && (
                                        <div style={{ marginTop: 6 }}>
                                            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{
                                                        height: 3, flex: 1, borderRadius: 99,
                                                        background: i <= passwordStrength.score ? passwordStrength.color : 'var(--border)',
                                                        transition: 'all 0.2s',
                                                    }} />
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 600 }}>{passwordStrength.label}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>8+ chars, uppercase, number, special character</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Confirm password *</label>
                                    <input className="field-input" name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} style={{ marginBottom: 0 }} />
                                    {form.confirmPassword && form.password !== form.confirmPassword && (
                                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Passwords do not match</div>
                                    )}
                                    {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                                        <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>✓ Passwords match</div>
                                    )}
                                </div>

                                {error && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>{error}</div>
                                )}
                                <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                                    {loading ? 'Creating account...' : 'Create account 🚀'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                    By signing up you agree to our terms of service
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3 — OTP Verification */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                                {/* Email icon */}
                                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: 'var(--accent-light)', border: '2px solid var(--accent)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 28, margin: '0 auto 16px',
                                    }}>✉️</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                        Enter the 6-digit code we sent to<br />
                                        <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>
                                    </div>
                                </div>

                                {/* OTP boxes */}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => otpRefs.current[i] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpInput(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            onPaste={i === 0 ? handleOtpPaste : undefined}
                                            style={{
                                                width: 48, height: 56, borderRadius: 10,
                                                border: `2px solid ${otpError ? '#ef4444' : digit ? '#16a34a' : 'var(--border)'}`,
                                                background: 'var(--bg)',
                                                textAlign: 'center', fontSize: 22, fontWeight: 800,
                                                color: 'var(--text-primary)',
                                                outline: 'none', fontFamily: 'inherit',
                                                transition: 'border-color 0.15s',
                                            }}
                                        />
                                    ))}
                                </div>

                                {otpError && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8, textAlign: 'center' }}>
                                        {otpError}
                                    </div>
                                )}

                                <button
                                    onClick={() => verifyOtp(otp.join(''))}
                                    disabled={otpLoading || otp.join('').length < 6}
                                    className="btn-primary"
                                    style={{ marginBottom: 16 }}
                                >
                                    {otpLoading ? 'Verifying...' : 'Verify email →'}
                                </button>

                                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                                    Didn't get the code?{' '}
                                    {resendCooldown > 0 ? (
                                        <span style={{ color: 'var(--text-muted)' }}>Resend in {resendCooldown}s</span>
                                    ) : (
                                        <button onClick={resendOtp} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                                            Resend code
                                        </button>
                                    )}
                                </div>

                                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                    <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textDecoration: 'underline' }}>
                                        Wrong email? Go back
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {step < 3 && (
                        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
