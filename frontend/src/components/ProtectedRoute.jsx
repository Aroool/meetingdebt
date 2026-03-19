import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import LogoTransition from './LogoTransition';
import axios from 'axios';
import API from '../config';

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showTransition, setShowTransition] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const currentPath = window.location.pathname;
            const skipPaths = ['/join-or-create', '/create-workspace', '/enter-invite', '/invite'];
            if (skipPaths.some(p => currentPath.startsWith(p))) {
                setLoading(false);
                return;
            }
            if (!session) {
                navigate('/login');
                setLoading(false);
                return;
            }

            setUser(session.user);

            // Check if user has a workspace
            const workspaceId = localStorage.getItem('workspaceId');
            if (!workspaceId) {
                try {
                    const { data } = await axios.get(`${API}/workspaces?userId=${session.user.id}`);
                    if (data.length > 0) {
                        localStorage.setItem('workspaceId', data[0].id);
                        localStorage.setItem('workspaceName', data[0].name);
                        localStorage.setItem('userRole', data[0].role);
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
    }, [navigate]);

    if (loading) return null;

    if (showTransition) {
        return <LogoTransition onComplete={() => setShowTransition(false)} />;
    }

    return user ? children : null;
}