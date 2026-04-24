import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useChat from '../hooks/useChat';
import useIsMobile from '../hooks/useIsMobile';

const SUGGESTIONS = [
    { label: "What's due this week?", icon: "📅" },
    { label: "Who has the most overdue tasks?", icon: "⚠️" },
    { label: "Summarise the last meeting", icon: "📝" },
    { label: "What is Bhavethra working on?", icon: "👤" },
    { label: "Was anyone stressed in the last meeting?", icon: "🎭" },
    { label: "What's currently blocked?", icon: "🚧" },
];

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderMarkdown(text) {
    return text.split('\n').filter((_, i, arr) => !(i === 0 && arr[i] === '') ).map((line, i, arr) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        const isBullet = /^[\-\*•]\s/.test(line.trim());
        const parts = line.replace(/^[\-\*•]\s/, '').split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (/^\*\*/.test(part)) return <strong key={j}>{part.slice(2, -2)}</strong>;
            return part;
        });
        return (
            <div key={i} style={{ display: 'flex', gap: isBullet ? 8 : 0, marginBottom: i < arr.length - 1 ? 3 : 0 }}>
                {isBullet && <span style={{ flexShrink: 0, color: 'var(--accent-text)', fontWeight: 700, marginTop: 1 }}>•</span>}
                <span>{parts}</span>
            </div>
        );
    });
}

function MessageGroup({ group }) {
    const isUser = group[0].role === 'user';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 16,
            gap: 2,
        }}>
            {group.map((msg, i) => {
                const isFirst = i === 0;
                const isLast = i === group.length - 1;

                // Border radius gives a "tail" only on the first/last of a group
                const radius = isUser
                    ? `${isFirst ? 18 : 6}px ${isFirst ? 18 : 6}px ${isLast ? 4 : 6}px ${isFirst ? 18 : 6}px`
                    : `${isFirst ? 18 : 6}px ${isFirst ? 18 : 6}px ${isLast ? 18 : 6}px ${isLast ? 4 : 6}px`;

                return (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 8,
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        width: '100%',
                    }}>
                        {/* Avatar placeholder — only assistant shows it, only on last message */}
                        {!isUser && (
                            <div style={{
                                width: 28, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {isLast ? (
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'var(--accent-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, color: 'var(--accent-text)',
                                    }}>✦</div>
                                ) : null}
                            </div>
                        )}

                        <div style={{ maxWidth: '72%' }}>
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: radius,
                                background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                                color: isUser ? '#fff' : 'var(--text-primary)',
                                border: isUser ? 'none' : '1px solid var(--border)',
                                fontSize: 13.5, lineHeight: 1.65,
                            }}>
                                {isUser ? msg.content : renderMarkdown(msg.content)}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Timestamp — only on last message of group */}
            <div style={{
                fontSize: 10, color: 'var(--text-muted)',
                marginTop: 2,
                paddingLeft: isUser ? 0 : 36,
                paddingRight: isUser ? 4 : 0,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
            }}>
                {formatTime(group[group.length - 1].ts)}
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
            <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: 'var(--accent-text)',
            }}>✦</div>
            <div style={{
                padding: '11px 16px', borderRadius: '18px 18px 18px 4px',
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

// Group consecutive messages from same sender
function groupMessages(messages) {
    return messages.reduce((acc, msg) => {
        const last = acc[acc.length - 1];
        if (last && last[0].role === msg.role) {
            last.push(msg);
        } else {
            acc.push([msg]);
        }
        return acc;
    }, []);
}

// Group messages by date
function groupByDate(messages) {
    const byDate = [];
    let lastDate = null;
    messages.forEach(msg => {
        const date = msg.ts ? formatDate(msg.ts) : null;
        if (date && date !== lastDate) {
            byDate.push({ type: 'separator', label: date });
            lastDate = date;
        }
        const last = byDate[byDate.length - 1];
        if (!last || last.type === 'separator') {
            byDate.push({ type: 'group', messages: [msg] });
        } else if (last.messages[last.messages.length - 1].role === msg.role) {
            last.messages.push(msg);
        } else {
            byDate.push({ type: 'group', messages: [msg] });
        }
    });
    return byDate;
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

    function handleSend(text) {
        const t = (text || input).trim();
        if (!t || loading) return;
        setInput('');
        sendMessage(t);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const isEmpty = messages.length === 0;
    const timeline = groupByDate(messages);

    return (
        <div style={{
            height: 'calc(100vh - 52px)',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{
                padding: isMobile ? '12px 16px' : '13px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0, background: 'var(--bg)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--accent-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: 'var(--accent-text)',
                        boxShadow: '0 0 0 4px var(--accent-light)',
                    }}>✦</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            MeetingDebt AI
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 500 }}>
                            ● Online · knows your meetings & deadlines
                        </div>
                    </div>
                </div>
                <AnimatePresence>
                    {messages.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={clearHistory}
                            style={{
                                fontSize: 11, padding: '5px 12px', borderRadius: 7,
                                border: '1px solid var(--border)',
                                background: 'transparent', color: 'var(--text-muted)',
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            Clear chat
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Messages area */}
            <div style={{
                flex: 1, overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
            }}>
                <div style={{
                    flex: 1,
                    maxWidth: 760, width: '100%',
                    margin: '0 auto',
                    padding: isMobile ? '20px 16px' : '24px 28px',
                    boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column',
                    minHeight: '100%',
                }}>
                    {isEmpty ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
                            {/* Animated icon */}
                            <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'var(--accent-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, marginBottom: 18,
                                    boxShadow: '0 0 0 10px var(--accent-light)',
                                }}
                            >✦</motion.div>

                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                                How can I help?
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                                Ask about deadlines, meeting summaries, who owes what, or how your team felt in a meeting.
                            </div>

                            {/* Suggestion chips in a 2-col grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: 8, width: '100%', maxWidth: 520,
                            }}>
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => handleSend(s.label)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 14px', borderRadius: 10,
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-card)', color: 'var(--text-secondary)',
                                            cursor: 'pointer', fontFamily: 'inherit',
                                            fontSize: 12, fontWeight: 500, textAlign: 'left',
                                            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                                    >
                                        <span style={{ fontSize: 15 }}>{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {timeline.map((item, i) =>
                                item.type === 'separator' ? (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        margin: '8px 0 16px',
                                    }}>
                                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                    </div>
                                ) : (
                                    <MessageGroup key={i} group={item.messages} />
                                )
                            )}
                            {loading && <TypingIndicator />}
                            {error && (
                                <div style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', marginBottom: 8, padding: '6px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                                    {error}
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>
            </div>

            {/* Input bar */}
            <div style={{
                borderTop: '1px solid var(--border)',
                padding: isMobile ? '12px 16px 14px' : '12px 24px 16px',
                flexShrink: 0,
                background: 'var(--bg)',
            }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: 10,
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 14, padding: '10px 12px 10px 16px',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                        onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-light)'; }}
                        onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
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
                                fontSize: 13.5, lineHeight: 1.5, fontFamily: 'inherit',
                                maxHeight: 120, overflowY: 'auto', paddingTop: 1,
                            }}
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <motion.button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            whileTap={input.trim() && !loading ? { scale: 0.9 } : {}}
                            style={{
                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
                                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s',
                                color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                                fontSize: 16,
                            }}
                        >↑</motion.button>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
                        Enter to send · Shift+Enter for new line
                    </div>
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
