import { useState, useCallback } from 'react';
import api from '../api';

const STORAGE_KEY = 'meetingdebt_chat_history';
const MAX_STORED = 40;

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveHistory(msgs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
    } catch { /* quota */ }
}

export default function useChat() {
    const [messages, setMessages] = useState(loadHistory);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loading) return;
        setError('');

        const userMsg = { role: 'user', content: text, ts: Date.now() };
        const next = [...messages, userMsg];
        setMessages(next);
        saveHistory(next);
        setLoading(true);

        try {
            const workspaceId = localStorage.getItem('workspaceId') || undefined;
            const { data } = await api.post('/chat', {
                message: text,
                history: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
                workspaceId,
            });
            const assistantMsg = { role: 'assistant', content: data.reply, ts: Date.now() };
            const final = [...next, assistantMsg];
            setMessages(final);
            saveHistory(final);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong.');
            // Remove the optimistic user message on error
            setMessages(messages);
        } finally {
            setLoading(false);
        }
    }, [messages, loading]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { messages, loading, error, sendMessage, clearHistory };
}
