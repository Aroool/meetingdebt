import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import LogoTransition from './LogoTransition';
import api from '../api';

// These pages handle their own logic — don't redirect from them
const SKIP_WORKSPACE_CHECK = [
    '/join-or-create',
    '/create-workspace',
    '/enter-invite',
    '/invite',
    '/login',
    '/signup',
    '/profile',
];

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showTransition, setShowTransition] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname;
        const shouldSkip = SKIP_WORKSPACE_CHECK.some(p => currentPath.startsWith(p));

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) {
                navigate('/login');
                setLoading(false);
                return;
            }

            setUser(session.user);

            // Don't do workspace check on setup pages
            if (shouldSkip) {
                setLoading(false);
                return;
            }

            // Check if user has a workspace
            const workspaceId = localStorage.getItem('workspaceId');
            const soloMode = localStorage.getItem('soloMode');

            // Solo users don't need a workspace
            if (soloMode === 'true') {
                setLoading(false);
                return;
            }

            if (!workspaceId) {
                try {
                    const { data } = await api.get('/workspaces');
                    if (data.length > 0) {
                        // Find manager workspace first, fall back to first
                        const preferred = data.find(w => w.role === 'manager') || data[0];
                        localStorage.setItem('workspaceId', preferred.id);
                        localStorage.setItem('workspaceName', preferred.name);
                        localStorage.setItem('userRole', preferred.role);
                    } else {
                        navigate('/join-or-create');
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    navigate('/join-or-create');
                    setLoading(false);
                    return;
                }
            }

            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setShowTransition(true);
                    setUser(session.user);
                } else if (!session) {
                    navigate('/login');
                } else {
                    setUser(session.user);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [navigate, location.pathname]);

    if (loading) return null;

    if (showTransition) {
        return <LogoTransition onComplete={() => setShowTransition(false)} />;
    }

    return user ? children : null;
}