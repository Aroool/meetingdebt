import { useState, useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import useIsMobile from '../hooks/useIsMobile';

const SUGGESTIONS = [
    "What's due this week?",
    "Who has the most overdue tasks?",
    "Summarise the last meeting",
    "What is Bhavethra working on?",
    "Was anyone stressed in the last meeting?",
    "What's currently blocked?",
];

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';

    // Render assistant text with basic markdown: **bold**, bullet -
    function renderContent(text) {
        return text.split('\n').map((line, i) => {
            const isBullet = /^[\-\*•]\s/.test(line.trim());
            const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                if (/^\*\*/.test(part)) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                return part;
            });
            return (
                <div key={i} style={{
                    marginBottom: i < text.split('\n').length - 1 ? 4 : 0,
                    paddingLeft: isBullet ? 0 : 0,
                    display: 'flex', gap: isBullet ? 6 : 0,
                }}>
                    {isBullet && <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>}
                    <span>{isBullet ? parts.slice(1) : parts}</span>
                </div>
            );
        });
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 12,
            alignItems: 'flex-end',
            gap: 8,
        }}>
            {/* Avatar for assistant */}
            {!isUser && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, marginBottom: 2,
                }}>
                    ✦
                </div>
            )}

            <div style={{ maxWidth: '78%' }}>
                <div style={{
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    fontSize: 13, lineHeight: 1.6,
                }}>
                    {isUser ? msg.content : renderContent(msg.content)}
                </div>
                {msg.ts && (
                    <div style={{
                        fontSize: 10, color: 'var(--text-muted)',
                        marginTop: 3,
                        textAlign: isUser ? 'right' : 'left',
                        paddingLeft: isUser ? 0 : 4,
                        paddingRight: isUser ? 4 : 0,
                    }}>
                        {formatTime(msg.ts)}
                    </div>
                )}
            </div>

            {/* Avatar for user */}
            {isUser && (
                <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 2,
                }}>
                    You
                </div>
            )}
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
            }}>
                ✦
            </div>
            <div style={{
                padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--text-muted)',
                        animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    );
}

export default function Chat() {
    const { messages, loading, error, sendMessage, clearHistory } = useChat();
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

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

    const isEmpty = messages.length === 0;

    return (
        <div style={{
            height: 'calc(100vh - 52px)',
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{
                padding: isMobile ? '14px 16px' : '16px 28px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17,
                    }}>
                        ✦
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                            MeetingDebt AI
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Ask about meetings, deadlines, or team mood
                        </div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearHistory}
                        style={{
                            fontSize: 12, padding: '5px 12px', borderRadius: 7,
                            border: '1px solid var(--border)',
                            background: 'transparent', color: 'var(--text-muted)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                        Clear chat
                    </button>
                )}
            </div>

            {/* Messages area */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: isMobile ? '16px' : '20px 28px',
                display: 'flex', flexDirection: 'column',
            }}>
                {isEmpty ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            How can I help?
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, textAlign: 'center', maxWidth: 360 }}>
                            Ask about your meetings, who owes what, upcoming deadlines, or even how someone seemed in a meeting.
                        </div>
                        {/* Suggestions */}
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: 8,
                            justifyContent: 'center', maxWidth: 520,
                        }}>
                            {SUGGESTIONS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                                    style={{
                                        fontSize: 12, padding: '7px 14px', borderRadius: 20,
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-card)', color: 'var(--text-secondary)',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'border-color 0.15s, color 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        {loading && <TypingIndicator />}
                        {error && (
                            <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', marginBottom: 8 }}>
                                {error}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div style={{
                borderTop: '1px solid var(--border)',
                padding: isMobile ? '12px 16px' : '14px 28px',
                flexShrink: 0,
                background: 'var(--bg)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 10,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 14, padding: '10px 14px',
                    transition: 'border-color 0.15s',
                }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your meetings or team…"
                        rows={1}
                        disabled={loading}
                        style={{
                            flex: 1, border: 'none', outline: 'none', resize: 'none',
                            background: 'transparent', color: 'var(--text-primary)',
                            fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit',
                            maxHeight: 120, overflowY: 'auto',
                        }}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
                            border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                            color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                            fontSize: 14,
                        }}
                    >
                        ↑
                    </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
                    Enter to send · Shift+Enter for new line
                </div>
            </div>

            <style>{`
                @keyframes chatDot {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
