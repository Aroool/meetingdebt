import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import NewMeetingModal from '../components/NewMeetingModal';
import LayoutPicker from '../components/LayoutPicker';
import LayoutA from '../components/layouts/LayoutA';
import LayoutB from '../components/layouts/LayoutB';
import { motion } from 'framer-motion';


function getStatusKey(c) {
    if (c.status === 'completed') return 'done';
    if (c.status === 'blocked') return 'blocked';
    if (c.deadline && new Date(c.deadline) < new Date()) return 'overdue';
    return 'pending';
}

export default function Dashboard() {
    const [commitments, setCommitments] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [layout, setLayout] = useState(localStorage.getItem('dashboardLayout') || 'A');
    const [currentRole, setCurrentRole] = useState(localStorage.getItem('userRole') || 'solo');
    const [userName, setUserName] = useState('');
    const [pendingExtraction, setPendingExtraction] = useState(null);


    useEffect(() => {
        import('../supabase').then(({ supabase }) => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                const meta = session?.user?.user_metadata;
                setUserName(meta?.first_name || meta?.full_name?.split(' ')[0] || '');
            });
        });
        function handleSwitch() {
            setCurrentRole(localStorage.getItem('userRole') || 'solo');
        }
        window.addEventListener('workspaceSwitched', handleSwitch);
        return () => window.removeEventListener('workspaceSwitched', handleSwitch);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const workspaceId = localStorage.getItem('workspaceId');
            const role = localStorage.getItem('userRole') || 'solo';
            const params = (workspaceId && (role === 'manager' || role === 'member'))
                ? { workspaceId }
                : {};

            const [cm, mm] = await Promise.allSettled([
                api.get('/commitments', { params }),
                api.get('/meetings', { params }),
            ]);

            if (cm.status === 'fulfilled') setCommitments(cm.value.data);
            else console.error('Commitments failed:', cm.reason);

            if (mm.status === 'fulfilled') setMeetings(mm.value.data);
            else console.error('Meetings failed:', mm.reason);

            if (params.workspaceId && role === 'manager') {
                try {
                    const mr = await api.get(`/workspaces/${workspaceId}/members`);
                    setMembers(mr.data);
                } catch (err) { console.error('Members failed:', err); }
            }
        } catch (err) {
            console.error('fetchData error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Listen for layout changes dispatched from sidebar
    useEffect(() => {
        function handleLayoutChange() {
            setLayout(localStorage.getItem('dashboardLayout') || 'A');
        }
        window.addEventListener('layoutChanged', handleLayoutChange);
        return () => window.removeEventListener('layoutChanged', handleLayoutChange);
    }, []);

    useEffect(() => {
        // Check localStorage first (set by extension via scripting)
        const raw = localStorage.getItem('pendingExtraction');
        if (raw) {
            try {
                const extraction = JSON.parse(raw);
                if (Date.now() - extraction.timestamp < 5 * 60 * 1000) {
                    localStorage.removeItem('pendingExtraction');
                    setPendingExtraction(extraction);
                    setModalOpen(true);
                    return;
                }
            } catch (e) { }
            localStorage.removeItem('pendingExtraction');
        }

        // Fallback: check chrome.storage (when dashboard was opened fresh by extension)
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(['pendingExtraction'], (result) => {
                if (!result.pendingExtraction) return;
                const extraction = result.pendingExtraction;
                if (Date.now() - extraction.timestamp < 5 * 60 * 1000) {
                    window.chrome.storage.local.remove(['pendingExtraction']);
                    setPendingExtraction(extraction);
                    setModalOpen(true);
                } else {
                    window.chrome.storage.local.remove(['pendingExtraction']);
                }
            });
        }
    }, []);

    function selectLayout(l) {
        setLayout(l);
        localStorage.setItem('dashboardLayout', l);
    }

    const overdue = commitments.filter(c => getStatusKey(c) === 'overdue').length;
    const pending = commitments.filter(c => getStatusKey(c) === 'pending').length;
    const blocked = commitments.filter(c => getStatusKey(c) === 'blocked').length;
    const done = commitments.filter(c => getStatusKey(c) === 'done').length;
    const total = commitments.length;
    const workspaceName = localStorage.getItem('workspaceName') || '';

    const sharedData = {
        commitments, meetings, members, loading,
        overdue, pending, blocked, done, total,
        userName, currentRole, workspaceName,
    };

    const LayoutComponent = layout === 'B' ? LayoutB : LayoutA;

    return (
        <div style={{ height: 'calc(100vh - 52px)', background: 'var(--bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <motion.div
                    key={layout}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ height: '100%' }}
                >
                    <LayoutComponent
                        data={sharedData}
                        onOpenModal={() => setModalOpen(true)}
                        onUpdate={fetchData}
                        onOpenPicker={() => setPickerOpen(true)}
                        currentLayout={layout}
                    />
                </motion.div>
            </div>

            {currentRole !== 'member' && (
                <motion.button
                    className="fab"
                    onClick={() => setModalOpen(true)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                    +
                </motion.button>
            )}

            <NewMeetingModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setPendingExtraction(null); }}
                onSuccess={fetchData}
                pendingExtraction={pendingExtraction}
            />

            {pickerOpen && (
                <LayoutPicker
                    currentLayout={layout}
                    onSelect={selectLayout}
                    onClose={() => setPickerOpen(false)}
                />
            )}
        </div>
    );
}