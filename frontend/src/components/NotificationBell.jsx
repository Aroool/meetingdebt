import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { supabase } from '../supabase';
import { BellIcon, ClipboardIcon, CheckCircleIcon, ClockIcon } from './Icons';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error(err);
        }
    }, [userId]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                setUserId(session.user.id);
            }
        });
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId, fetchNotifications]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function markRead(id) {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (err) {
            console.error(err);
        }
    }

    async function markAllRead() {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    }

    function timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    function getIcon(type) {
        switch (type) {
            case 'assignment': return <ClipboardIcon size={16} />;
            case 'status_update': return <CheckCircleIcon size={16} />;
            case 'nudge': return <ClockIcon size={16} />;
            default: return <BellIcon size={16} />;
        }
    }

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', color: 'var(--text-muted)', padding: 4,
                }}
            >
                <BellIcon size={18} />
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--red)',
                            border: '1.5px solid var(--bg-card)',
                        }}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="dropdown-menu"
                        style={{ width: 320 }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 8px 10px', borderBottom: '1px solid var(--border)',
                            marginBottom: 6,
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="pill pill-red" style={{ marginLeft: 8 }}>
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="btn-link">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications list */}
                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{
                                    padding: '24px 16px', textAlign: 'center',
                                    fontSize: 13, color: 'var(--text-muted)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, opacity: 0.4 }}>
                                        <BellIcon size={24} />
                                    </div>
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <motion.div
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        whileHover={{ background: 'var(--bg)' }}
                                        style={{
                                            display: 'flex', gap: 10,
                                            padding: '9px 10px', borderRadius: 8,
                                            cursor: 'pointer', transition: 'background 0.1s',
                                            background: n.read ? 'transparent' : 'var(--accent-light)',
                                            marginBottom: 2,
                                        }}
                                    >
                                        <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1, display: 'flex' }}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 12, color: 'var(--text-primary)',
                                                fontWeight: n.read ? 400 : 600,
                                                lineHeight: 1.5, marginBottom: 3,
                                            }}>
                                                {n.message}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                {timeAgo(n.created_at)}
                                            </div>
                                        </div>
                                        {!n.read && (
                                            <div style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: 'var(--accent)', flexShrink: 0, marginTop: 6
                                            }} />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}