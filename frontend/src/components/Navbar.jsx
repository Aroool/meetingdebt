import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

export default function Navbar() {
    const [dark, setDark] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || 'solo';
    const isSolo = localStorage.getItem('soloMode') === 'true';
    const workspaceName = localStorage.getItem('workspaceName') || '';

    useEffect(() => {
        document.body.classList.toggle('dark', dark);
    }, [dark]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_, session) => setUser(session?.user)
        );
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    }

    const name = user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] || 'Account';
    const email = user?.email || '';

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="navbar-logo">
                <div className="logo-dot" />
                Meeting<span className="logo-debt">Debt</span>
            </Link>

            <div className="navbar-links">
                <Link to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                    Dashboard
                </Link>

                <Link to="/commitments"
                    className={`nav-link ${location.pathname === '/commitments' ? 'active' : ''}`}>
                    {role === 'member' ? 'My Tasks' : 'Commitments'}
                </Link>

                <Link to="/meetings"
                    className={`nav-link ${location.pathname === '/meetings' ? 'active' : ''}`}>
                    Meetings
                </Link>

                {role === 'manager' && !isSolo && (
                    <Link to="/workspace"
                        className={`nav-link ${location.pathname === '/workspace' ? 'active' : ''}`}>
                        Team
                    </Link>
                )}

                {isSolo && (
                    <Link to="/workspace"
                        className={`nav-link ${location.pathname === '/workspace' ? 'active' : ''}`}
                        style={{ color: 'var(--accent)', fontWeight: 600 }}
                    >
                        ⬆ Upgrade
                    </Link>
                )}
            </div>

            <div className="navbar-right">
                <motion.button
                    className="dark-toggle"
                    onClick={() => setDark(!dark)}
                    whileTap={{ scale: 0.92 }}
                >
                    {dark ? '☀️' : '🌙'}
                </motion.button>

                {/* Avatar with dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <motion.div
                        className="user-avatar"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ cursor: 'pointer' }}
                    >
                        {name.charAt(0).toUpperCase()}
                    </motion.div>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: 8,
                                    minWidth: 220,
                                    zIndex: 100,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                }}
                            >
                                {/* User info header */}
                                <div style={{
                                    padding: '8px 10px 12px',
                                    borderBottom: '1px solid var(--border)',
                                    marginBottom: 6,
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                        {name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email}</div>
                                    {workspaceName && (
                                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                                borderRadius: 20,
                                                background: role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                color: role === 'manager' ? 'var(--accent-text)' : 'var(--blue)'
                                            }}>
                                                {role}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{workspaceName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Menu items */}
                                {[
                                    { icon: '👤', label: 'View profile', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                                    { icon: '⚙️', label: 'Settings', action: () => { navigate('/profile?tab=settings'); setDropdownOpen(false); } },
                                    { icon: '🏢', label: 'Team', action: () => { navigate('/workspace'); setDropdownOpen(false); }, hide: isSolo && role !== 'member' },
                                ].filter(item => !item.hide).map(item => (
                                    <div
                                        key={item.label}
                                        onClick={item.action}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 10px', borderRadius: 8,
                                            cursor: 'pointer', fontSize: 13,
                                            color: 'var(--text-primary)',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}

                                {/* Divider */}
                                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

                                {/* Sign out */}
                                <div
                                    onClick={handleLogout}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 10px', borderRadius: 8,
                                        cursor: 'pointer', fontSize: 13,
                                        color: 'var(--red)',
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ fontSize: 14 }}>🚪</span>
                                    Sign out
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
}