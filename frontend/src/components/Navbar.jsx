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

/* Segmented tabs — top-level section switcher */
const SEGMENTS = [
    { label: 'Dashboard', to: '/dashboard', match: ['/dashboard', '/commitments'] },
    { label: 'Personal', to: '/my-tasks', match: ['/my-tasks'] },
    { label: 'Team', to: '/workspace', match: ['/workspace', '/meetings'] },
];

// ─── Small inline SVG icons for layout/view toggles ──────────────────────────
function LayoutGridIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
    );
}
function LayoutColumnsIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <rect x="2" y="2" width="3.5" height="12" rx="1" />
            <rect x="6.5" y="2" width="3.5" height="12" rx="1" />
            <rect x="11" y="2" width="3" height="12" rx="1" />
        </svg>
    );
}
function GroupedIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <line x1="3" y1="3" x2="13" y2="3" />
            <line x1="5" y1="6" x2="13" y2="6" />
            <line x1="5" y1="9" x2="13" y2="9" />
            <line x1="3" y1="12" x2="13" y2="12" />
        </svg>
    );
}
function FlatListIcon({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <line x1="3" y1="4" x2="13" y2="4" />
            <line x1="3" y1="8" x2="13" y2="8" />
            <line x1="3" y1="12" x2="13" y2="12" />
        </svg>
    );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar({ dark, onToggleDark, user, workspaceName, role, isSolo,
    dropdownOpen, setDropdownOpen, dropdownRef, workspaces,
    handleSwitchWorkspace, handleLogout, navigate, fetchWorkspaces }) {

    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';
    const email = user?.email || '';
    const activeWsId = localStorage.getItem('workspaceId');
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const location = useLocation();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 52,
            background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center',
            zIndex: 300,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.03)',
        }}>
            {/* Logo — green dot + wordmark */}
            <Link to="/dashboard" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingLeft: 16, paddingRight: 12,
                textDecoration: 'none', flexShrink: 0,
                height: '100%',
            }}>
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                }} />
                <span style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                }}>
                    Meeting<span style={{ color: 'var(--accent)' }}>Debt</span>
                </span>
            </Link>

            <div style={{ flex: 1 }} />

            {/* Segmented nav — centered */}
            <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--bg)', borderRadius: 10, padding: 3,
                border: '1px solid var(--border)',
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            }}>
                {SEGMENTS.map(seg => {
                    const isActive = seg.match.includes(location.pathname);
                    return (
                        <Link key={seg.to} to={seg.to} style={{
                            padding: '5px 18px', borderRadius: 7,
                            fontSize: 13, fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            background: isActive ? 'var(--bg-card)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                            lineHeight: '20px',
                        }}>
                            {seg.label}
                        </Link>
                    );
                })}
            </div>

            <div style={{ flex: 1 }} />

            {/* Right utilities */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 14 }}>
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
                        onClick={async () => {
                            setDropdownOpen(o => !o);
                            const { data: { session } } = await supabase.auth.getSession();
                            if (session?.user?.id) fetchWorkspaces(session.user.id);
                        }}
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
                                {/* User info header */}
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

                                {[
                                    { icon: <UserIcon size={14} />, label: 'View profile', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                                    { icon: <SettingsIcon size={14} />, label: 'Settings', action: () => { navigate('/profile?tab=settings'); setDropdownOpen(false); } },
                                ].map(item => (
                                    <div key={item.label} onClick={item.action} className="dropdown-item">{item.icon}{item.label}</div>
                                ))}

                                <div className="dropdown-divider" />
                                <div className="dropdown-section-label">Workspaces</div>
                                {workspaces.map(ws => {
                                    const isActive = activeWsId === ws.id;
                                    return (
                                        <div key={ws.id} onClick={() => !isActive && handleSwitchWorkspace(ws)}
                                            className={`dropdown-item${isActive ? ' dropdown-item--active' : ''}`}
                                            style={isActive ? { cursor: 'default' } : undefined}>
                                            <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: ws.role === 'manager' ? 'var(--accent-light)' : 'var(--blue-light)', color: ws.role === 'manager' ? 'var(--accent-text)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {ws.role === 'manager' ? <BuildingIcon size={13} /> : <UserIcon size={13} />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ws.role}</div>
                                            </div>
                                            {isActive
                                                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                                                : <span style={{ color: 'var(--text-muted)', display: 'flex' }}><ChevronRightIcon size={12} /></span>}
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
        <div style={{ padding: '1px 6px' }}>
            <Link to={item.to}
                title={!expanded ? item.label : undefined}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 6px 7px 8px', borderRadius: 8,
                    textDecoration: 'none', position: 'relative',
                    color: 'inherit',
                }}>
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-bg"
                        style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'var(--accent-light)' }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                )}
                <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    color: isActive ? 'var(--accent-text)' : item.accent ? 'var(--accent)' : 'var(--text-muted)',
                    transition: 'color 0.15s',
                }}>
                    <Icon size={17} />
                </div>
                <motion.span
                    animate={{ opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap',
                        position: 'relative', zIndex: 1, flex: 1,
                        color: isActive ? 'var(--accent-text)' : item.accent ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                    {item.label}
                </motion.span>
                {item.badge != null && (
                    <motion.span animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.15 }}
                        style={{ position: 'relative', zIndex: 1 }}>
                        <span className="pill pill-red" style={{ fontSize: 10, padding: '1px 6px', lineHeight: '14px' }}>
                            {item.badge}
                        </span>
                    </motion.span>
                )}
            </Link>
        </div>
    );
}

// ─── Toggle Button Group ─────────────────────────────────────────────────────

function ToggleItem({ icon: Icon, label, isActive, onClick, expanded }) {
    return (
        <div style={{ padding: '1px 6px' }}>
            <div onClick={onClick}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 6px 7px 8px', borderRadius: 8,
                    cursor: 'pointer', position: 'relative',
                    background: isActive ? 'var(--accent-light)' : 'transparent',
                    transition: 'background 0.15s',
                }}>
                <div style={{
                    width: 22, height: 22, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    transition: 'color 0.15s',
                }}>
                    {Icon}
                </div>
                <motion.span
                    animate={{ opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap',
                        color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                    }}>
                    {label}
                </motion.span>
            </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ role, isSolo, user, overdueCount }) {
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard';

    const [dashLayout, setDashLayout] = useState(localStorage.getItem('dashboardLayout') || 'A');
    const [dashView, setDashView] = useState(localStorage.getItem('commitmentsView') || 'grouped');

    const name = user?.user_metadata?.full_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const initial = name.charAt(0).toUpperCase();

    const primaryNav = [
        { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
        { to: '/commitments', label: role === 'member' ? 'My Tasks' : 'Commitments', icon: ListBulletIcon, badge: overdueCount > 0 ? overdueCount : null },
        { to: '/meetings', label: 'Meetings', icon: CalendarIcon },
        { to: '/my-tasks', label: 'Personal', icon: StarIcon },
    ];

    const secondaryNav = [
        ...(!isSolo ? [{ to: '/workspace', label: 'Team', icon: UsersIcon }] : []),
        { to: '/feedback', label: 'Feedback', icon: ChatBubbleIcon },
        ...(isSolo ? [{ to: '/workspace', label: 'Upgrade', icon: ArrowUpIcon, accent: true }] : []),
    ];

    function switchLayout(l) {
        setDashLayout(l);
        localStorage.setItem('dashboardLayout', l);
        window.dispatchEvent(new Event('layoutChanged'));
    }
    function switchView(v) {
        setDashView(v);
        localStorage.setItem('commitmentsView', v);
        window.dispatchEvent(new Event('viewChanged'));
    }

    useEffect(() => {
        function sync() {
            setDashLayout(localStorage.getItem('dashboardLayout') || 'A');
            setDashView(localStorage.getItem('commitmentsView') || 'grouped');
        }
        window.addEventListener('layoutChanged', sync);
        window.addEventListener('viewChanged', sync);
        return () => {
            window.removeEventListener('layoutChanged', sync);
            window.removeEventListener('viewChanged', sync);
        };
    }, []);

    return (
        <motion.div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            animate={{ width: expanded ? 220 : 52 }}
            initial={false}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
                position: 'fixed', left: 0, top: 52, bottom: 0,
                background: 'var(--bg-card)',
                zIndex: 200,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: expanded
                    ? '4px 0 24px rgba(0,0,0,0.07), 1px 0 0 rgba(0,0,0,0.03)'
                    : '1px 0 0 rgba(0,0,0,0.03)',
                transition: 'box-shadow 0.22s',
            }}
        >
            {/* Primary navigation */}
            <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
                {primaryNav.map(item => (
                    <NavItem key={item.to} item={item} location={location} expanded={expanded} />
                ))}

                {secondaryNav.length > 0 && (
                    <div style={{ height: 1, background: 'var(--border)', margin: '6px 14px', opacity: 0.5 }} />
                )}
                {secondaryNav.map(item => (
                    <NavItem key={item.to + item.label} item={item} location={location} expanded={expanded} />
                ))}

                {/* Dashboard controls — layout & view */}
                {isDashboard && (
                    <>
                        <div style={{ height: 1, background: 'var(--border)', margin: '6px 14px', opacity: 0.5 }} />
                        <ToggleItem
                            icon={<LayoutGridIcon size={17} />}
                            label="Command Center"
                            isActive={dashLayout === 'A'}
                            onClick={() => switchLayout('A')}
                            expanded={expanded}
                        />
                        <ToggleItem
                            icon={<LayoutColumnsIcon size={17} />}
                            label="Kanban Board"
                            isActive={dashLayout === 'B'}
                            onClick={() => switchLayout('B')}
                            expanded={expanded}
                        />
                        {dashLayout === 'A' && (
                            <>
                                <div style={{ height: 1, background: 'var(--border)', margin: '6px 14px', opacity: 0.5 }} />
                                <ToggleItem
                                    icon={<GroupedIcon size={17} />}
                                    label="Grouped"
                                    isActive={dashView === 'grouped'}
                                    onClick={() => switchView('grouped')}
                                    expanded={expanded}
                                />
                                <ToggleItem
                                    icon={<FlatListIcon size={17} />}
                                    label="Flat list"
                                    isActive={dashView === 'flat'}
                                    onClick={() => switchView('flat')}
                                    expanded={expanded}
                                />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* User profile — bottom */}
            <div style={{ padding: '10px 0', flexShrink: 0 }}>
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
                        style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{isSolo ? 'solo' : role}</div>
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

    useEffect(() => { fetchOverdueCount(); }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
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
                fetchWorkspaces={fetchWorkspaces}
            />
            <Sidebar
                role={role}
                isSolo={isSolo}
                user={user}
                overdueCount={overdueCount}
            />
        </>
    );
}
