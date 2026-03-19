import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API from '../config';
import { supabase } from '../supabase';

export default function NewMeetingModal({ isOpen, onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [processingText, setProcessingText] = useState('');
    const [error, setError] = useState('');
    const workspaceId = localStorage.getItem('workspaceId');

    const processingSteps = [
        'Reading transcript...',
        'Identifying speakers...',
        'Extracting commitments...',
        'Scheduling nudges...',
        'Almost done...',
    ];

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
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            await axios.post(`${API}/extract`, {
                transcript,
                meetingTitle: title || 'Untitled Meeting',
                ownerEmail: email || session?.user?.email || 'unknown@email.com',
                userId,
                workspaceId,
            });
            clearInterval(interval);
            setLoading(false);
            setTitle('');
            setEmail('');
            setTranscript('');
            onSuccess && onSuccess();
            onClose();
        } catch (err) {
            clearInterval(interval);
            setLoading(false);
            setError('Something went wrong. Is the backend running?');
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
                    onClick={onClose}
                >
                    <motion.div
                        className="modal"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-title">New meeting</div>
                            <button className="modal-close" onClick={onClose}>✕</button>
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

                            <label className="field-label">Your email</label>
                            <input
                                className="field-input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={loading}
                            />

                            <label className="field-label">Paste transcript</label>
                            <textarea
                                className="field-textarea"
                                placeholder={`Sarah: We need the report by Friday...\nJohn: I'll handle that, no problem...\nSarah: Great. Marcus, what's the status?`}
                                value={transcript}
                                onChange={e => setTranscript(e.target.value)}
                                disabled={loading}
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
                            <button className="btn-cancel" onClick={onClose} disabled={loading}>
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}