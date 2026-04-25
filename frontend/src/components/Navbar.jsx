import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import NotificationBell from './NotificationBell';
import api from '../api';
import {
    MoonIcon, SunIcon, UserIcon, SettingsIcon, LogOutIcon,
    BuildingIcon, PlusIcon, ChevronRightIcon, ArrowUpIcon,
    HomeIcon, ListBulletIcon, CalendarIcon, StarIcon, UsersIcon, ChatBubbleIcon, DocumentTextIcon, SparklesIcon,
} from './Icons';

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
    useEffect(() => {
        const handle = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, [breakpoint]);
    return isMobile;
}

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

/* Pages reachable via sidebar that aren't in SEGMENTS — get a dynamic 4th tab */
const EXTRA_ROUTES = {
    '/transcripts': 'Transcripts',
    '/feedback':    'Feedback',
    '/chat':        'Ask AI',
    '/profile':     'Profile',
};

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

    const isMobile = useIsMobile();
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';
    const email = user?.email || '';
    const activeWsId = localStorage.getItem('workspaceId');
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const location = useLocation();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 52,
            background: 'var(--bg)',
            display: 'flex', alignItems: 'center',
            zIndex: 300,
        }}>
            {/* Logo — green dot + wordmark */}
            <Link to="/dashboard" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingLeft: 16, paddingRight: 12,
                textDecoration: 'none', flexShrink: 0,
                height: '100%',
            }}>
                <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                }} />
                <span style={{
                    fontSize: 17, fontWeight: 700, color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                }}>
                    Meeting<span style={{ color: 'var(--accent)' }}>Debt</span>
                </span>
            </Link>

            <div style={{ flex: 1 }} />

            {/* Floating pill nav — desktop only */}
            {!isMobile && (() => {
                const inMain = SEGMENTS.some(s => s.match.includes(location.pathname));
                const extraLabel = !inMain ? (EXTRA_ROUTES[location.pathname] || null) : null;

                return (
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: 4,
                        borderRadius: 22,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    }}>
                        {SEGMENTS.map(seg => {
                            const isActive = seg.match.includes(location.pathname);
                            return (
                                <Link key={seg.to} to={seg.to} style={{
                                    padding: '7px 22px', borderRadius: 18,
                                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                    textDecoration: 'none',
                                    position: 'relative', zIndex: 1,
                                    transition: 'color 0.25s',
                                    lineHeight: '18px',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-glow"
                                            style={{
                                                position: 'absolute', inset: '-10px -14px',
                                                borderRadius: '50%', background: 'var(--accent)',
                                                opacity: 0.09, filter: 'blur(16px)', zIndex: -2,
                                            }}
                                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            style={{
                                                position: 'absolute', inset: 0, borderRadius: 18,
                                                background: 'var(--accent-light)', zIndex: -1,
                                            }}
                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                    )}
                                    {seg.label}
                                </Link>
                            );
                        })}

                        {/* Dynamic 4th tab — slides in when on a sidebar-only page */}
                        <AnimatePresence>
                            {extraLabel && (
                                <motion.div
                                    key={extraLabel}
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                    style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}
                                >
                                    <div style={{
                                        padding: '7px 22px', borderRadius: 18,
                                        fontSize: 13, fontWeight: 600,
                                        color: 'var(--accent-text)',
                                        position: 'relative', zIndex: 1,
                                        lineHeight: '18px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {/* Active pill bg */}
                                        <motion.div
                                            layoutId="nav-pill"
                                            style={{
                                                position: 'absolute', inset: 0, borderRadius: 18,
                                                background: 'var(--accent-light)', zIndex: -1,
                                            }}
                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                        {/* Active glow */}
                                        <motion.div
                                            layoutId="nav-glow"
                                            style={{
                                                position: 'absolute', inset: '-10px -14px',
                                                borderRadius: '50%', background: 'var(--accent)',
                                                opacity: 0.09, filter: 'blur(16px)', zIndex: -2,
                                            }}
                                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                        {extraLabel}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })()}

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

// ─── Rail Item (collapsible nav link) ────────────────────────────────────────

function RailItem({ item, location, expanded }) {
    const isActive = location.pathname === item.to;
    const Icon = item.icon;
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={item.to}
            title={expanded ? undefined : item.label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                display: 'flex', alignItems: 'center',
                height: 36, borderRadius: 9, flexShrink: 0,
                textDecoration: 'none', overflow: 'hidden',
                margin: '1px 0',
                color: isActive
                    ? 'var(--accent-text)'
                    : item.accent
                    ? 'var(--accent)'
                    : hovered
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                background: !isActive && hovered ? 'rgba(128,128,128,0.08)' : 'transparent',
                transition: 'color 0.15s, background 0.12s',
            }}
        >
            {/* Animated active bg — slides between items via layoutId */}
            {isActive && (
                <motion.div
                    layoutId="rail-active-bg"
                    style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'var(--accent-light)' }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
            )}

            {/* Icon — always visible, fixed width so it stays aligned at both widths */}
            <div style={{
                width: 36, height: 36, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
            }}>
                <Icon size={17} />
            </div>

            {/* Label — fades + slides in when expanded */}
            <motion.span
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap', flex: 1,
                    position: 'relative', zIndex: 1,
                    pointerEvents: 'none',
                }}
            >
                {item.label}
            </motion.span>

            {/* Badge — dot when collapsed, pill count when expanded */}
            {item.badge > 0 && !expanded && (
                <span style={{
                    position: 'absolute', top: 7, right: 7,
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--red)', zIndex: 2,
                }} />
            )}
            {item.badge > 0 && (
                <motion.div
                    animate={{ opacity: expanded ? 1 : 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ marginRight: 10, position: 'relative', zIndex: 1, flexShrink: 0 }}
                >
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
                        background: 'var(--red)', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                    }}>{item.badge}</span>
                </motion.div>
            )}
        </Link>
    );
}

// ─── Rail Button (collapsible action) ────────────────────────────────────────

function RailBtn({ icon, label, isActive, onClick, title, expanded }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            title={expanded ? undefined : title}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center',
                height: 36, borderRadius: 9, flexShrink: 0,
                cursor: 'pointer', overflow: 'hidden',
                margin: '1px 0',
                color: isActive ? 'var(--accent-text)' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive
                    ? 'var(--accent-light)'
                    : hovered
                    ? 'rgba(128,128,128,0.08)'
                    : 'transparent',
                transition: 'color 0.15s, background 0.12s',
            }}
        >
            <div style={{
                width: 36, height: 36, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {icon}
            </div>
            <motion.span
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap', flex: 1,
                    pointerEvents: 'none',
                }}
            >
                {label}
            </motion.span>
        </div>
    );
}

// ─── Rail Workspace Item ──────────────────────────────────────────────────────

function RailWorkspaceItem({ ws, expanded, onSwitch }) {
    const [hovered, setHovered] = useState(false);
    const isActive = localStorage.getItem('workspaceId') === ws.id;

    return (
        <div
            title={expanded ? undefined : ws.name}
            onClick={() => !isActive && onSwitch(ws)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center',
                height: 36, borderRadius: 9, flexShrink: 0,
                cursor: isActive ? 'default' : 'pointer',
                overflow: 'hidden', margin: '1px 0',
                background: isActive ? 'var(--accent-light)' : hovered ? 'rgba(128,128,128,0.08)' : 'transparent',
                transition: 'background 0.12s',
            }}
        >
            <div style={{
                width: 36, height: 36, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: isActive ? 'var(--accent)' : 'var(--border)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800,
                    transition: 'background 0.15s, color 0.15s',
                }}>
                    {ws.name.charAt(0).toUpperCase()}
                </div>
                {isActive && (
                    <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--accent)',
                    }} />
                )}
            </div>
            <motion.div
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{ minWidth: 0, flex: 1, pointerEvents: 'none' }}
            >
                <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--accent-text)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{ws.role}</div>
            </motion.div>
        </div>
    );
}

// ─── Collapsible Rail Section ─────────────────────────────────────────────────

function CollapsibleRailSection({ icon, label, isOpen, onToggle, expanded, title, children }) {
    return (
        <>
            <div
                onClick={onToggle}
                title={expanded ? undefined : title}
                style={{
                    display: 'flex', alignItems: 'center',
                    height: 36, borderRadius: 9, flexShrink: 0,
                    cursor: expanded ? 'pointer' : 'default',
                    overflow: 'hidden', margin: '1px 0',
                    color: 'var(--text-muted)',
                    transition: 'background 0.12s',
                }}
            >
                <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <motion.span
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', flex: 1, whiteSpace: 'nowrap', pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                    {label}
                </motion.span>
                <motion.div
                    animate={{ opacity: expanded ? 1 : 0, rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ marginRight: 10, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                >
                    <ChevronRightIcon size={12} />
                </motion.div>
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key={label}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Icon Rail ────────────────────────────────────────────────────────────────

function Rail({ role, isSolo, user, overdueCount, workspaces, handleSwitchWorkspace, workspaceName }) {
    const isMobile = useIsMobile();
    const [expanded, setExpanded] = useState(false);
    const [wsOpen, setWsOpen] = useState(false);
    const [layoutOpen, setLayoutOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [dashLayout, setDashLayout] = useState(localStorage.getItem('dashboardLayout') || 'A');
    const [dashView, setDashView] = useState(localStorage.getItem('commitmentsView') || 'grouped');
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard';

    const name = user?.user_metadata?.full_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    const initial = name.charAt(0).toUpperCase();

    const primaryNav = [
        { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
        { to: '/commitments', label: role === 'member' ? 'My Tasks' : 'Commitments', icon: ListBulletIcon, badge: overdueCount > 0 ? overdueCount : null },
        { to: '/meetings', label: 'Meetings', icon: CalendarIcon },
        { to: '/transcripts', label: 'Transcripts', icon: DocumentTextIcon },
        { to: '/my-tasks', label: 'Personal', icon: StarIcon },
    ];

    const secondaryNav = [
        ...(!isSolo ? [{ to: '/workspace', label: 'Team', icon: UsersIcon }] : []),
        { to: '/chat', label: 'Ask AI', icon: SparklesIcon },
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

    if (isMobile) return null;

    const divider = (
        <div style={{
            height: 1, width: '100%', flexShrink: 0,
            background: 'var(--text-muted)',
            opacity: 0.15,
            margin: '5px 0',
        }} />
    );

    return (
        <motion.div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            animate={{ width: expanded ? 216 : 52 }}
            initial={false}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
                position: 'fixed', left: 0, top: 52, bottom: 0,
                background: 'var(--bg)',
                zIndex: 200,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                padding: '10px 8px 12px',
            }}
        >
            {primaryNav.map(item => (
                <RailItem key={item.to} item={item} location={location} expanded={expanded} />
            ))}

            {secondaryNav.length > 0 && divider}

            {secondaryNav.map(item => (
                <RailItem key={item.to + item.label} item={item} location={location} expanded={expanded} />
            ))}

            {/* Workspace switcher section — collapsible */}
            {workspaces && workspaces.length > 0 && (
                <>
                    {divider}
                    <CollapsibleRailSection
                        icon={<BuildingIcon size={16} />}
                        label="Workspaces"
                        isOpen={wsOpen}
                        onToggle={() => expanded && setWsOpen(o => !o)}
                        expanded={expanded}
                        title="Workspaces"
                    >
                        {workspaces.map(ws => (
                            <RailWorkspaceItem key={ws.id} ws={ws} expanded={expanded} onSwitch={handleSwitchWorkspace} />
                        ))}
                        <RailItem item={{ to: '/create-workspace', label: 'New workspace', icon: PlusIcon, accent: true }} location={{ pathname: '' }} expanded={expanded} />
                    </CollapsibleRailSection>
                </>
            )}

            {isDashboard && (
                <>
                    {/* Layout section */}
                    {divider}
                    <CollapsibleRailSection
                        icon={<LayoutGridIcon size={16} />}
                        label="Layout"
                        isOpen={layoutOpen}
                        onToggle={() => expanded && setLayoutOpen(o => !o)}
                        expanded={expanded}
                        title="Layout"
                    >
                        <RailBtn icon={<LayoutGridIcon size={16} />} label="Command Center" isActive={dashLayout === 'A'} onClick={() => switchLayout('A')} title="Command Center" expanded={expanded} />
                        <RailBtn icon={<LayoutColumnsIcon size={16} />} label="Kanban Board" isActive={dashLayout === 'B'} onClick={() => switchLayout('B')} title="Kanban Board" expanded={expanded} />
                    </CollapsibleRailSection>

                    {/* View section — only for layout A */}
                    {dashLayout === 'A' && (
                        <>
                            {divider}
                            <CollapsibleRailSection
                                icon={<GroupedIcon size={16} />}
                                label="View"
                                isOpen={viewOpen}
                                onToggle={() => expanded && setViewOpen(o => !o)}
                                expanded={expanded}
                                title="View"
                            >
                                <RailBtn icon={<GroupedIcon size={16} />} label="Grouped view" isActive={dashView === 'grouped'} onClick={() => switchView('grouped')} title="Grouped view" expanded={expanded} />
                                <RailBtn icon={<FlatListIcon size={16} />} label="Flat list" isActive={dashView === 'flat'} onClick={() => switchView('flat')} title="Flat list" expanded={expanded} />
                            </CollapsibleRailSection>
                        </>
                    )}
                </>
            )}

            <div style={{ flex: 1 }} />

            {/* User identity anchor at bottom */}
            <div style={{ display: 'flex', alignItems: 'center', height: 36, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-light)', color: 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, overflow: 'hidden',
                    margin: '0 5px',
                }}>
                    {avatarUrl
                        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initial}
                </div>
                <motion.div
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{ minWidth: 0, pointerEvents: 'none' }}
                >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{isSolo ? 'solo' : role}</div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── Bottom Nav (mobile only) ─────────────────────────────────────────────────

function BottomNav({ role, overdueCount }) {
    const location = useLocation();
    const navItems = [
        { to: '/dashboard', label: 'Home', icon: HomeIcon, match: ['/dashboard'] },
        { to: '/commitments', label: 'Tasks', icon: ListBulletIcon, match: ['/commitments'], badge: overdueCount },
        { to: '/meetings', label: 'Meetings', icon: CalendarIcon, match: ['/meetings'] },
        { to: '/my-tasks', label: 'Personal', icon: StarIcon, match: ['/my-tasks'] },
        { to: '/profile', label: 'Profile', icon: UserIcon, match: ['/profile', '/workspace', '/feedback'] },
    ];

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'stretch',
            zIndex: 300,
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
            {navItems.map(item => {
                const isActive = item.match.includes(location.pathname);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 4, textDecoration: 'none',
                            padding: '10px 0 8px',
                            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                            position: 'relative',
                            transition: 'color 0.15s',
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="bottom-nav-active"
                                style={{
                                    position: 'absolute', top: 0, left: 4, right: 4,
                                    height: 2, background: 'var(--accent)',
                                    borderRadius: '0 0 2px 2px',
                                }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            />
                        )}
                        <div style={{ position: 'relative' }}>
                            <Icon size={21} />
                            {item.badge > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -8,
                                    background: 'var(--red)', color: '#fff',
                                    borderRadius: 99, minWidth: 14, height: 14,
                                    fontSize: 8, fontWeight: 800, padding: '0 3px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Navbar() {
    const isMobile = useIsMobile();
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
            const { data } = await api.get('/workspaces');
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
                const due = c.deadline ? (() => { const [y,m,d] = c.deadline.slice(0,10).split('-').map(Number); return new Date(y,m-1,d); })() : null;
                return due && due < new Date();
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
            <Rail
                role={role}
                isSolo={isSolo}
                user={user}
                overdueCount={overdueCount}
                workspaces={workspaces}
                handleSwitchWorkspace={handleSwitchWorkspace}
                workspaceName={workspaceName}
            />
            {isMobile && (
                <BottomNav
                    role={role}
                    overdueCount={overdueCount}
                />
            )}
        </>
    );
}
