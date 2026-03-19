import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

export default function Navbar() {
    const [dark, setDark] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole') || 'solo';
    const isSolo = localStorage.getItem('soloMode') === 'true';

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

    async function handleLogout() {
        await supabase.auth.signOut();
        localStorage.clear();
        navigate('/login');
    }

    const name = user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] || 'Account';

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

                {/* Commitments — solo and manager see all, member sees "My Tasks" */}
                <Link to="/commitments"
                    className={`nav-link ${location.pathname === '/commitments' ? 'active' : ''}`}>
                    {role === 'member' ? 'My Tasks' : 'Commitments'}
                </Link>

                <Link to="/meetings"
                    className={`nav-link ${location.pathname === '/meetings' ? 'active' : ''}`}>
                    Meetings
                </Link>

                {/* Team tab — only for managers */}
                {role === 'manager' && (
                    <Link to="/workspace"
                        className={`nav-link ${location.pathname === '/workspace' ? 'active' : ''}`}>
                        Team
                    </Link>
                )}

                {/* Upgrade to team — only for solo users */}
                {isSolo && (
                    <Link to="/workspace"
                        className={`nav-link ${location.pathname === '/workspace' ? 'active' : ''}`}
                        style={{ color: 'var(--accent)', fontWeight: 600 }}
                    >
                        ⬆ Upgrade to team
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

                <div className="user-menu">
                    <div className="user-avatar">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    );
}