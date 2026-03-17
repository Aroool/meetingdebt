import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/global.css';

export default function Navbar({ onNewMeeting }) {
    const [dark, setDark] = useState(false);
    const location = useLocation();

    useEffect(() => {
        document.body.classList.toggle('dark', dark);
    }, [dark]);

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <div className="logo-dot" />
                Meeting<span className="logo-debt">Debt</span>
            </Link>

            <div className="navbar-links">
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/commitments"
                    className={`nav-link ${location.pathname === '/commitments' ? 'active' : ''}`}
                >
                    Commitments
                </Link>
                <Link
                    to="/meetings"
                    className={`nav-link ${location.pathname === '/meetings' ? 'active' : ''}`}
                >
                    Meetings
                </Link>
            </div>

            <div className="navbar-right">
                <motion.button
                    className="dark-toggle"
                    onClick={() => setDark(!dark)}
                    whileTap={{ scale: 0.92 }}
                    title="Toggle dark mode"
                >
                    {dark ? '☀️' : '🌙'}
                </motion.button>
            </div>
        </nav>
    );
}