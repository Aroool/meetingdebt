import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';


export default function NewMeetingModal({ isOpen, onClose, onSuccess, pendingExtraction }) {
    const [step, setStep] = useState('input'); // 'input' | 'confirm'
    const [title, setTitle] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingText, setProcessingText] = useState('');
    const [error, setError] = useState('');
    const [extracted, setExtracted] = useState(null); // { meeting, commitments, members }
    const [assignments, setAssignments] = useState({}); // commitmentIndex -> userId
    const [saving, setSaving] = useState(false);
    const workspaceId = localStorage.getItem('workspaceId');

    useEffect(() => {
        if (!pendingExtraction || !isOpen) return;
        setTitle(pendingExtraction.title || '');
        const workspaceId = localStorage.getItem('workspaceId');
        api.get(`/workspaces/${workspaceId}/members`).then(res => {
            const initialAssignments = {};
            pendingExtraction.commitments?.forEach((c, i) => {
                if (c.assigned_to) initialAssignments[i] = c.assigned_to;
            });
            setExtracted({
                commitments: pendingExtraction.commitments || [],
                meeting: { title: pendingExtraction.title },
                members: res.data,
            });
            setAssignments(initialAssignments);
            setStep('confirm');
        });
    }, [pendingExtraction, isOpen]);

    const processingSteps = [
        'Reading transcript...',
        'Identifying speakers...',
        'Extracting commitments...',
        'Matching team members...',
        'Almost done...',
    ];

    function reset() {
        setStep('input');
        setTitle('');
        setTranscript('');
        setLoading(false);
        setProcessingText('');
        setError('');
        setExtracted(null);
        setAssignments({});
        setSaving(false);
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleExtract() {
        if (!transcript.trim()) {
            setError('Please paste a transcript first.');
            return;
        }
        setError('');
        setLoading(true);

        let step = 0;
        setProcessingText(processingSteps[0]);
        const interval = setInterval(() => {
            step++;
            if (step < processingSteps.length) {
                setProcessingText(processingSteps[step]);
            }
        }, 800);

        try {
            // Fetch workspace members for matching display
            let members = [];
            if (workspaceId) {
                const membersRes = await api.get(`/workspaces/${workspaceId}/members`);
                members = membersRes.data;
            }

            const { data } = await api.post('/extract-preview', {
                transcript,
                meetingTitle: title || 'Untitled Meeting',
                workspaceId,
            });

            clearInterval(interval);
            setLoading(false);

            // Pre-populate assignments from auto-match
            const initialAssignments = {};
            data.commitments.forEach((c, i) => {
                if (c.assigned_to) initialAssignments[i] = c.assigned_to;
            });

            setExtracted({ ...data, members });
            setAssignments(initialAssignments);
            setStep('confirm');

        } catch (err) {
            clearInterval(interval);
            setLoading(false);
            setError(err.response?.data?.error || 'Something went wrong. Is the backend running?');
        }
    }

    async function handleConfirm() {
        setSaving(true);
        try {
            await api.post('/save-commitments', {
                meeting: extracted.meeting,
                commitments: extracted.commitments.map((c, i) => ({
                    ...c,
                    assigned_to: assignments[i] || null,
                })),
                workspaceId,
            });

            reset();
            onClose();
            setTimeout(() => {
                onSuccess && onSuccess();
            }, 300);
        } catch (err) {
            setSaving(false);
            setError('Failed to save. Try again.');
        }
    }



    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="modal"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: step === 'confirm' ? 560 : 480 }}
                    >

                        {/* STEP 1 — INPUT */}
                        {step === 'input' && (
                            <>
                                <div className="modal-header">
                                    <div className="modal-title">New meeting</div>
                                    <button className="modal-close" onClick={handleClose}>✕</button>
                                </div>

                                <div className="modal-body">
                                    <label className="field-label">Meeting title</label>
                                    <input
                                        className="field-input"
                                        placeholder="e.g. Product Sync"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        disabled={loading}
                                    />

                                    <label className="field-label">Paste transcript</label>
                                    <textarea
                                        className="field-textarea"
                                        placeholder={`Sarah: We need the report by Friday...\nJohn: I'll handle that, no problem...\nSarah: Great. Marcus, what's the status?`}
                                        value={transcript}
                                        onChange={e => setTranscript(e.target.value)}
                                        disabled={loading}
                                        style={{ height: 140 }}
                                    />

                                    {error && (
                                        <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {loading && (
                                    <motion.div
                                        className="processing-msg"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="dot" />
                                        <div className="dot" />
                                        <div className="dot" />
                                        {processingText}
                                    </motion.div>
                                )}

                                <div className="modal-footer">
                                    <button className="btn-cancel" onClick={handleClose} disabled={loading}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-extract"
                                        onClick={handleExtract}
                                        disabled={loading}
                                    >
                                        {loading ? 'Extracting...' : 'Extract commitments →'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* STEP 2 — CONFIRM ASSIGNMENTS */}
                        {step === 'confirm' && extracted && (
                            <>
                                <div className="modal-header">
                                    <div>
                                        <div className="modal-title">Confirm assignments</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {extracted.commitments.length} commitments extracted · review and confirm
                                        </div>
                                    </div>
                                    <button className="modal-close" onClick={handleClose}>✕</button>
                                </div>

                                <div style={{ padding: '16px 24px', maxHeight: 400, overflowY: 'auto' }}>
                                    {extracted.commitments.map((c, i) => {
                                        const assignedUserId = assignments[i];
                                        const isMatched = !!assignedUserId;

                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderRadius: 10,
                                                    marginBottom: 8,
                                                    background: isMatched ? 'var(--accent-light)' : 'var(--amber-light)',
                                                    border: `0.5px solid ${isMatched ? 'var(--accent)' : 'var(--amber)'}`,
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                    {/* Match indicator */}
                                                    <div style={{
                                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                                        background: isMatched ? 'var(--accent)' : 'var(--amber)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 10, color: '#fff', fontWeight: 700, marginTop: 1
                                                    }}>
                                                        {isMatched ? '✓' : '!'}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                                            {c.task}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                Said by: <strong>{c.owner}</strong>
                                                            </span>
                                                            {c.deadline && (
                                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                    · Due: {c.deadline}
                                                                </span>
                                                            )}
                                                            <span style={{
                                                                fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                                                                background: c.type === 'action_item' ? '#E6F1FB' : c.type === 'blocker' ? '#FCEBEB' : '#F0F0F0',
                                                                color: c.type === 'action_item' ? '#0C447C' : c.type === 'blocker' ? '#A32D2D' : '#555'
                                                            }}>
                                                                {c.type?.replace('_', ' ')}
                                                            </span>
                                                        </div>

                                                        {/* Assignment dropdown */}
                                                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                                                Assign to:
                                                            </span>
                                                            <select
                                                                value={assignedUserId || ''}
                                                                onChange={e => setAssignments(prev => ({
                                                                    ...prev,
                                                                    [i]: e.target.value || null
                                                                }))}
                                                                style={{
                                                                    fontSize: 12, fontWeight: 600,
                                                                    border: `1px solid ${isMatched ? 'var(--accent)' : 'var(--amber)'}`,
                                                                    borderRadius: 6, padding: '3px 8px',
                                                                    background: 'var(--bg-card)',
                                                                    color: 'var(--text-primary)',
                                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                                    outline: 'none',
                                                                }}
                                                            >
                                                                <option value="">— Unassigned —</option>
                                                                {extracted.members?.map(m => (
                                                                    <option key={m.user_id} value={m.user_id}>
                                                                        {m.name || m.email}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {isMatched && (
                                                                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                                                    ✓ Auto-matched
                                                                </span>
                                                            )}
                                                            {!isMatched && (
                                                                <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
                                                                    ⚠ No match found
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {error && (
                                    <div style={{ fontSize: 12, color: 'var(--red)', padding: '0 24px 12px' }}>
                                        {error}
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button className="btn-cancel" onClick={() => setStep('input')} disabled={saving}>
                                        ← Back
                                    </button>
                                    <button
                                        className="btn-extract"
                                        onClick={handleConfirm}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : `Save ${extracted.commitments.length} commitments →`}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}