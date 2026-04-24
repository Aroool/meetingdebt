import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useChat from '../hooks/useChat';

function renderContent(text) {
    return text.split('\n').map((line, i) => {
        const isBullet = /^[\-\*•]\s/.test(line.trim());
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (/^\*\*/.test(part)) return <strong key={j}>{part.slice(2, -2)}</strong>;
            return part;
        });
        return (
            <div key={i} style={{ marginBottom: 3, display: 'flex', gap: isBullet ? 5 : 0 }}>
                {isBullet && <span style={{ flexShrink: 0 }}>•</span>}
                <span>{isBullet ? parts.slice(1) : parts}</span>
            </div>
        );
    });
}

const QUICK = [
    "What's due this week?",
    "Who's overdue?",
    "Summarise the last meeting",
];

export default function ChatBubble() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, loading, error, sendMessage } = useChat();
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, open]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 180);
    }, [open]);

    function handleSend() {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        sendMessage(text);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Only show recent messages in bubble (last 10)
    const recent = messages.slice(-10);
    const unread = messages.filter(m => m.role === 'assistant').length;

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            {/* Chat panel — opens upward and to the left so it clears the right column */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 12 }}
                        transition={{ duration: 0.17, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: 'absolute', bottom: 58, right: 0,
                            width: 320, maxHeight: 460,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '11px 14px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0, background: 'var(--bg-card)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'var(--accent-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: 'var(--accent-text)',
                                }}>✦</div>
                                <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                        MeetingDebt AI
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--accent-text)', fontWeight: 500 }}>
                                        ● Online
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => { setOpen(false); navigate('/chat'); }}
                                style={{
                                    fontSize: 10, padding: '4px 10px', borderRadius: 6,
                                    border: '1px solid var(--border)',
                                    background: 'transparent', color: 'var(--text-muted)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    transition: 'color 0.15s, border-color 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-text)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                Open full ↗
                            </button>
                        </div>

                        {/* Messages */}
                        <div style={{
                            flex: 1, overflowY: 'auto',
                            padding: '12px 12px 6px',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            {recent.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: 8 }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        Hey! Ask me anything.
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
                                        Deadlines, meeting summaries,<br />or how your team is feeling.
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
                                        {QUICK.map(q => (
                                            <button
                                                key={q}
                                                onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                                style={{
                                                    fontSize: 11, padding: '6px 10px', borderRadius: 8,
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg)', color: 'var(--text-secondary)',
                                                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                                    transition: 'border-color 0.15s, color 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {recent.map((msg, i) => {
                                        const isUser = msg.role === 'user';
                                        return (
                                            <div key={i} style={{
                                                display: 'flex',
                                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                                marginBottom: 8,
                                            }}>
                                                <div style={{
                                                    maxWidth: '84%',
                                                    padding: '8px 11px',
                                                    borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                                                    background: isUser ? 'var(--accent)' : 'var(--bg)',
                                                    color: isUser ? '#fff' : 'var(--text-primary)',
                                                    border: isUser ? 'none' : '1px solid var(--border)',
                                                    fontSize: 12, lineHeight: 1.55,
                                                }}>
                                                    {isUser ? msg.content : renderContent(msg.content)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {loading && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
                                            <div style={{
                                                padding: '10px 14px', borderRadius: '14px 14px 14px 3px',
                                                background: 'var(--bg)', border: '1px solid var(--border)',
                                                display: 'flex', gap: 4, alignItems: 'center',
                                            }}>
                                                {[0,1,2].map(i => (
                                                    <div key={i} style={{
                                                        width: 5, height: 5, borderRadius: '50%',
                                                        background: 'var(--text-muted)',
                                                        animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                                                    }}/>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {error && (
                                        <div style={{ fontSize: 11, color: 'var(--red)', textAlign: 'center', marginBottom: 4 }}>
                                            {error}
                                        </div>
                                    )}
                                    <div ref={bottomRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: '8px 10px 10px',
                            borderTop: '1px solid var(--border)',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 10, padding: '7px 10px',
                            }}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask something…"
                                    disabled={loading}
                                    style={{
                                        flex: 1, border: 'none', outline: 'none',
                                        background: 'transparent', color: 'var(--text-primary)',
                                        fontSize: 12, fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    style={{
                                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                        background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
                                        border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                                        fontSize: 12, transition: 'background 0.15s',
                                    }}
                                >↑</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger button */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: open ? 'var(--bg-card)' : 'var(--accent)',
                    border: open ? '1.5px solid var(--border)' : 'none',
                    boxShadow: open ? 'none' : '0 4px 20px rgba(22,163,74,0.35)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: open ? 16 : 18,
                    color: open ? 'var(--text-muted)' : '#fff',
                    transition: 'background 0.18s, box-shadow 0.18s',
                }}
            >
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'inline-block', lineHeight: 1 }}
                >
                    {open ? '✕' : '✦'}
                </motion.span>
            </motion.button>

            {/* Unread dot */}
            {!open && unread > 0 && (
                <div style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--red)',
                    border: '2px solid var(--bg)',
                }} />
            )}

            <style>{`
                @keyframes chatDot {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
