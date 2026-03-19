import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import axios from 'axios';
import API from '../config';

export default function CreateWorkspace() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleCreate(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const userEmail = session?.user?.email;

            const { data } = await axios.post(`${API}/workspaces`, {
                name, userId, userEmail
            });

            localStorage.setItem('workspaceId', data.workspace.id);
            localStorage.setItem('workspaceName', data.workspace.name);
            localStorage.setItem('userRole', 'manager');
            localStorage.removeItem('soloMode');
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create workspace. Try again.');
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="auth-logo">
                    <div className="logo-dot" />
                    Meeting<span className="logo-debt">Debt</span>
                </div>

                <div className="auth-title">Create your workspace</div>
                <div className="auth-sub">A workspace is where your team tracks meeting commitments together.</div>

                <form onSubmit={handleCreate}>
                    <label className="field-label">Workspace name</label>
                    <input
                        className="field-input"
                        placeholder="e.g. Acme Engineering Team"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn-extract" type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? 'Creating...' : 'Create workspace →'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}