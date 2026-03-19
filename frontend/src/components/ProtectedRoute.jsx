import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import LogoTransition from './LogoTransition';

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showTransition, setShowTransition] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login');
                setLoading(false);
            } else {
                setUser(session.user);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // New sign in — show the transition
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
        return (
            <LogoTransition onComplete={() => setShowTransition(false)} />
        );
    }

    return user ? children : null;
}