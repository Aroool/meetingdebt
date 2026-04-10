import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import NotificationBell from './NotificationBell';
import axios from 'axios';
import API from '../config';
import api from '../api';
import {
    MoonIcon, SunIcon, UserIcon, SettingsIcon, LogOutIcon,
    BuildingIcon, PlusIcon, ChevronRightIcon, ArrowUpIcon,
    HomeIcon, ListBulletIcon, CalendarIcon, StarIcon, UsersIcon, ChatBubbleIcon,
} from './Icons';

function getRoleFromStorage() {
    return localStorage.getItem('userRole') || 'solo';
}

function getIsSolo() {
    return localStorage.getItem('soloMode') === 'true';
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar({ dark, onToggleDark, user, workspaceName, role, isSolo,
    dropdownOpen, setDropdownOpen, dropdownRef, workspaces,
    handleSwitchWorkspace, handleLogout, navigate }) {

    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';
    const email = user?.email || '';
    const activeWsId = localStorage.getItem('workspaceId');
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 56,
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
            zIndex: 300,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }}>
            {/* Logo zone — same width as collapsed sidebar (52px) */}
            <Link to="/dashboard" style={{
                width: 52, height: 56, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
            }}>
                <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                </div>
            </Link>

            {/* Brand wordmark */}
            <div style={{
                fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', flex: 1,
            }}>
                Meeting<span style={{ color: 'var(--accent)' }}>Debt</span>
            </div>

            {/* Right utilities */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 12 }}>
                <NotificationBell />

                <motion.button
                    className="dark-toggle"
                    onClick={onToggleDark}
                    whileTap={{ scale: 0.92 }}
                >
                    {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                </motion.button>

                <div ref={dropdownRef} style={{ position: 'relative', marginLeft: 4 }}>
                    <motion.div
                        className="user-avatar"
                        onClick={() => setDropdownOpen(o => !o)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ cursor: 'pointer' }}
                    >
                        {avatarUrl
                            ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : name.charAt(0).toUpperCase()}
                    </motion.div>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                transition={{ duration: 0.13 }}
                                className="dropdown-menu"
                            >
                                {/* User info */}
                                <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{email}</div>
                                    {workspaceName && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span className={`pill ${role === 'manager' ? 'pill-green' : role === 'member' ? 'pill-blue' : 'role-badge-purple'}`}>{role}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{workspaceName}</span>
                                        </div>
                                    )}
                                    {isSolo && !workspaceName && <span className="pill role-badge-purple">solo</span>}
                                </div>

                                {/* Profile / Settings */}
                                {[
                                    { icon: <UserIcon size={14} />, label: 'View profile', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                                    { icon: <SettingsIcon size={14} />, label: 'Settings', action: () => { navigate('/profile?tab=settings'); setDropdownOpen(false); } },
                                ].map(item => (
                                    <div key={item.label} onClick={item.action} className="dropdown-item">
                                        {item.icon}
                                        {item.label}
                                    </div>
                                ))}

                                {/* Workspace switcher */}
                                <div className="dropdown-divider" />
                                <div className="dropdown-section-label">Workspaces</div>
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
                                                color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {ws.role === 'manager' ? <BuildingIcon size={13} /> : <UserIcon size={13} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ws.role}</div>
                                            </div>
                                            {isActive
                                                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                                                : <span style={{ color: 'var(--text-muted)', display: 'flex' }}><ChevronRightIcon size={12} /></span>
                                            }
                                        </div>
                                    );
                                })}
                                <div onClick={() => { navigate('/create-workspace'); setDropdownOpen(false); }} className="dropdown-item dropdown-item--accent">
                                    <PlusIcon size={14} />
                                    Create new workspace
                                </div>

                                <div className="dropdown-divider" />
                                <div onClick={handleLogout} className="dropdown-item dropdown-item--danger">
                                    <LogOutIcon size={14} />
                                    Sign out
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ item, location, expanded }) {
    const isActive = location.pathname === item.to;
    const Icon = item.icon;

    return (
        <div style={{ padding: '1px 6px', position: 'relative' }}>
            <Link
                to={item.to}
                title={!expanded ? item.label : undefined}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 6px 7px 8px', borderRadius: 8,
                    textDecoration: 'none', position: 'relative',
                    color: 'inherit',
                }}
            >
                {/* Animated active background (slides between items) */}
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-bg"
                        style={{
                            position: 'absolute', inset: 0, borderRadius: 8,
                            background: 'var(--accent-light)',
                        }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                )}

                {/* Icon */}
                <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    color: isActive
                        ? 'var(--accent-text)'
                        : item.accent
                            ? 'var(--accent)'
                            : 'var(--text-muted)',
                    transition: 'color 0.15s',
                }}>
                    <Icon size={17} />
                </div>

                {/* Label — fades in when expanded */}
                <motion.span
                    animate={{ opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                        position: 'relative', zIndex: 1, flex: 1,
                        color: isActive
                            ? 'var(--accent-text)'
                            : item.accent
                                ? 'var(--accent)'
                                : 'var(--text-primary)',
                    }}
                >
                    {item.label}
                </motion.span>

                {/* Overdue badge */}
                {item.badge != null && (
                    <motion.span
                        animate={{ opacity: expanded ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: 'relative', zIndex: 1 }}
                    >
                        <span className="pill pill-red" style={{ fontSize: 10, padding: '1px 6px', lineHeight: '14px' }}>
                            {item.badge}
                        </span>
                    </motion.span>
                )}
            </Link>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ role, isSolo, workspaceName, user, overdueCount }) {
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();

    const name = user?.user_metadata?.full_name ||
        user?.user_metadata?.first_name ||
        user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const initial = name.charAt(0).toUpperCase();

    const primaryItems = [
        { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
        {
            to: '/commitments',
            label: role === 'member' ? 'My Tasks' : 'Commitments',
            icon: ListBulletIcon,
            badge: overdueCount > 0 ? overdueCount : null,
        },
        { to: '/meetings', label: 'Meetings', icon: CalendarIcon },
        { to: '/my-tasks', label: 'Personal', icon: StarIcon },
    ];

    const secondaryItems = [
        ...(!isSolo ? [{ to: '/workspace', label: 'Team', icon: UsersIcon }] : []),
        { to: '/feedback', label: 'Feedback', icon: ChatBubbleIcon },
        ...(isSolo ? [{ to: '/workspace', label: 'Upgrade', icon: ArrowUpIcon, accent: true }] : []),
    ];

    return (
        <motion.div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            animate={{ width: expanded ? 220 : 52 }}
            initial={false}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
                position: 'fixed', left: 0, top: 56, bottom: 0,
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                zIndex: 200,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.07)' : 'none',
                transition: 'box-shadow 0.22s',
            }}
        >
            {/* Workspace identity block */}
            <div style={{ padding: '14px 0 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 0 15px', minHeight: 32 }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: isSolo ? '#EEEDFE' : role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)',
                        color: isSolo ? '#3C3489' : role === 'manager' ? 'var(--accent-text)' : 'var(--blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {isSolo ? <StarIcon size={12} /> : role === 'manager' ? <BuildingIcon size={12} /> : <UsersIcon size={12} />}
                    </div>
                    <motion.div
                        animate={{ opacity: expanded ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ minWidth: 0, flex: 1 }}
                    >
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {workspaceName || 'Personal'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {isSolo ? 'solo mode' : role}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
                {primaryItems.map(item => (
                    <NavItem key={item.to} item={item} location={location} expanded={expanded} />
                ))}

                <div style={{ height: 1, background: 'var(--border)', margin: '6px 10px' }} />

                {secondaryItems.map(item => (
                    <NavItem key={item.to + item.label} item={item} location={location} expanded={expanded} />
                ))}
            </div>

            {/* User profile row */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px 0 15px', minHeight: 32 }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--accent-light)', color: 'var(--accent-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, overflow: 'hidden',
                    }}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initial}
                    </div>
                    <motion.div
                        animate={{ opacity: expanded ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ minWidth: 0, flex: 1 }}
                    >
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                            {isSolo ? 'solo' : role}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Navbar() {
    const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [role, setRole] = useState(getRoleFromStorage);
    const [isSolo, setIsSolo] = useState(getIsSolo);
    const [workspaceName, setWorkspaceName] = useState(localStorage.getItem('workspaceName') || '');
    const [workspaces, setWorkspaces] = useState([]);
    const [overdueCount, setOverdueCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    async function fetchWorkspaces(userId) {
        if (!userId) return;
        try {
            const { data } = await axios.get(`${API}/workspaces?userId=${userId}`);
            setWorkspaces(data);
        } catch (e) { }
    }

    async function fetchOverdueCount() {
        try {
            const workspaceId = localStorage.getItem('workspaceId');
            const currentRole = localStorage.getItem('userRole') || 'solo';
            const params = (workspaceId && (currentRole === 'manager' || currentRole === 'member'))
                ? { workspaceId } : {};
            const { data } = await api.get('/commitments', { params });
            const overdue = data.filter(c => {
                if (c.status === 'completed' || c.status === 'blocked') return false;
                return c.deadline && new Date(c.deadline) < new Date();
            }).length;
            setOverdueCount(overdue);
        } catch (e) { }
    }

    useEffect(() => {
        function handleSwitch() {
            setRole(getRoleFromStorage());
            setIsSolo(getIsSolo());
            setWorkspaceName(localStorage.getItem('workspaceName') || '');
            fetchOverdueCount();
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
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }, [dark]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user);
            fetchWorkspaces(session?.user?.id);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user);
            fetchWorkspaces(session?.user?.id);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        fetchOverdueCount();
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

    return (
        <>
            <TopBar
                dark={dark}
                onToggleDark={() => setDark(d => !d)}
                user={user}
                workspaceName={workspaceName}
                role={role}
                isSolo={isSolo}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                dropdownRef={dropdownRef}
                workspaces={workspaces}
                handleSwitchWorkspace={handleSwitchWorkspace}
                handleLogout={handleLogout}
                navigate={navigate}
            />
            <Sidebar
                role={role}
                isSolo={isSolo}
                workspaceName={workspaceName}
                user={user}
                overdueCount={overdueCount}
            />
        </>
    );
}
