import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import NotificationBell from './NotificationBell';
import axios from 'axios';
import API from '../config';

function getRoleFromStorage() {
    return localStorage.getItem('userRole') || 'solo';
}

function getIsSolo() {
    return localStorage.getItem('soloMode') === 'true';
}

export default function Navbar() {
    const [dark, setDark] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [role, setRole] = useState(getRoleFromStorage);
    const [isSolo, setIsSolo] = useState(getIsSolo);
    const [workspaceName, setWorkspaceName] = useState(localStorage.getItem('workspaceName') || '');
    const [workspaces, setWorkspaces] = useState([]);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    async function fetchWorkspaces(userId) {
        if (!userId) return;
        try {
            const { data } = await axios.get(`${API}/workspaces?userId=${userId}`);
            setWorkspaces(data);
        } catch (err) { }
    }

    useEffect(() => {
        function handleSwitch() {
            setRole(getRoleFromStorage());
            setIsSolo(getIsSolo());
            setWorkspaceName(localStorage.getItem('workspaceName') || '');
        }
        window.addEventListener('workspaceSwitched', handleSwitch);
        window.addEventListener('profileUpdated', handleSwitch);
        return () => {
            window.removeEventListener('workspaceSwitched', handleSwitch);
            window.removeEventListener('profileUpdated', handleSwitch);
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle('dark', dark);
    }, [dark]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user);
            fetchWorkspaces(session?.user?.id);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_, session) => {
                setUser(session?.user);
                fetchWorkspaces(session?.user?.id);
            }
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

    function handleSwitchWorkspace(ws) {
        localStorage.setItem('workspaceId', ws.id);
        localStorage.setItem('workspaceName', ws.name);
        localStorage.setItem('userRole', ws.role);
        localStorage.removeItem('soloMode');
        setRole(ws.role);
        setIsSolo(false);
        setWorkspaceName(ws.name);
        window.dispatchEvent(new Event('workspaceSwitched'));
        setDropdownOpen(false);
        navigate('/dashboard');
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/');
    }

    const name = user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] || 'Account';
    const email = user?.email || '';
    const activeWsId = localStorage.getItem('workspaceId');

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
                <Link to="/my-tasks"
                    className={`nav-link ${location.pathname === '/my-tasks' ? 'active' : ''}`}>
                    Personal
                </Link>
                <Link to="/meetings"
                    className={`nav-link ${location.pathname === '/meetings' ? 'active' : ''}`}>
                    Meetings
                </Link>
                {!isSolo && (
                    <Link to="/workspace"
                        className={`nav-link ${location.pathname === '/workspace' ? 'active' : ''}`}>
                        Team
                    </Link>
                )}
                <Link to="/feedback"
                    className={`nav-link ${location.pathname === '/feedback' ? 'active' : ''}`}>
                    Feedback
                </Link>
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
                <NotificationBell />
                <motion.button
                    className="dark-toggle"
                    onClick={() => setDark(!dark)}
                    whileTap={{ scale: 0.92 }}
                >
                    {dark ? '☀️' : '🌙'}
                </motion.button>

                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <motion.div
                        className="user-avatar"
                        onClick={async () => {
                            setDropdownOpen(!dropdownOpen);
                            // Refetch workspaces every time dropdown opens
                            const { data: { session } } = await supabase.auth.getSession();
                            if (session?.user?.id) fetchWorkspaces(session.user.id);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ cursor: 'pointer' }}
                    >
                        {(() => {
                            const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                            return avatarUrl
                                ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : name.charAt(0).toUpperCase();
                        })()}
                    </motion.div>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                transition={{ duration: 0.15 }}
                                className="dropdown-menu"
                            >
                                {/* User info */}
                                <div style={{
                                    padding: '8px 10px 12px',
                                    borderBottom: '1px solid var(--border)', marginBottom: 6,
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                        {name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{email}</div>
                                    {workspaceName && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span className={`pill ${role === 'manager' ? 'pill-green' : role === 'member' ? 'pill-blue' : 'role-badge-purple'}`}>
                                                {role}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                                {workspaceName}
                                            </span>
                                        </div>
                                    )}
                                    {isSolo && !workspaceName && (
                                        <span className="pill role-badge-purple">
                                            solo
                                        </span>
                                    )}
                                </div>

                                {/* Menu items */}
                                {[
                                    { icon: '👤', label: 'View profile', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                                    { icon: '⚙️', label: 'Settings', action: () => { navigate('/profile?tab=settings'); setDropdownOpen(false); } },
                                ].map(item => (
                                    <div
                                        key={item.label}
                                        onClick={item.action}
                                        className="dropdown-item"
                                    >
                                        <span style={{ fontSize: 14 }}>{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}

                                {/* Workspace switcher */}
                                {workspaces.length >= 0 && (
                                    <>
                                        <div className="dropdown-divider" />
                                        <div className="dropdown-section-label">
                                            Workspaces
                                        </div>

                                        {workspaces.map(ws => {
                                            const isActive = activeWsId === ws.id;
                                            return (
                                                <div
                                                    key={ws.id}
                                                    onClick={() => !isActive && handleSwitchWorkspace(ws)}
                                                    className={`dropdown-item${isActive ? ' dropdown-item--active' : ''}`}
                                                    style={isActive ? { cursor: 'default' } : undefined}
                                                >
                                                    <div style={{
                                                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                                        background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12,
                                                    }}>
                                                        {ws.role === 'manager' ? '🏢' : '👤'}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: 12, fontWeight: isActive ? 600 : 400,
                                                            color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {ws.name}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ws.role}</div>
                                                    </div>
                                                    {isActive && (
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                                                    )}
                                                    {!isActive && (
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <div
                                            onClick={() => { navigate('/create-workspace'); setDropdownOpen(false); }}
                                            className="dropdown-item dropdown-item--accent"
                                        >
                                            <span style={{ fontSize: 16 }}>＋</span>
                                            Create new workspace
                                        </div>
                                    </>
                                )}

                                {/* Sign out */}
                                <div className="dropdown-divider" />
                                <div onClick={handleLogout} className="dropdown-item dropdown-item--danger">
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