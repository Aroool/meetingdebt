import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const LAYOUTS = [
    {
        key: 'A',
        name: 'Command Center',
        desc: 'Sidebar with stats, accountability, and recent meetings. Best for managers.',
        preview: (
            <div style={{ display: 'flex', gap: 0, height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: 70, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, width: '80%' }} />
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, width: '60%', marginTop: 4 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 4 }}>
                        {['#ef4444', '#f59e0b', '#3b82f6', '#16a34a'].map(c => (
                            <div key={c} style={{ height: 20, borderRadius: 4, background: c + '20', border: `1px solid ${c}30` }} />
                        ))}
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, width: '70%', marginTop: 6 }} />
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                            <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, flex: 1 }} />
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1, padding: 8, background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, width: '50%' }} />
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, width: '30%' }} />
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ height: 18, background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border)', padding: '0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border)' }} />
                                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, flex: 1 }} />
                                <div style={{ height: 4, width: 24, background: '#f59e0b30', borderRadius: 20 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },
    {
        key: 'B',
        name: 'Kanban Board',
        desc: 'Tasks in columns by status. Drag and drop between columns. Great for visual thinkers.',
        preview: (
            <div style={{ height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ height: 6, width: 80, background: 'var(--border)', borderRadius: 4 }} />
                    <div style={{ height: 4, width: 40, background: 'var(--border)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 'calc(100% - 28px)' }}>
                    {[
                        { color: '#f59e0b', n: 3 }, { color: '#ef4444', n: 2 },
                        { color: '#3b82f6', n: 1 }, { color: '#16a34a', n: 2 },
                    ].map((col, ci) => (
                        <div key={ci} style={{ borderRight: ci < 3 ? '1px solid var(--border)' : 'none', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color }} />
                                <div style={{ height: 3, width: 8, background: col.color + '40', borderRadius: 20 }} />
                            </div>
                            {Array(col.n).fill(0).map((_, i) => (
                                <div key={i} style={{ height: 28, background: 'var(--bg-card)', borderRadius: 5, border: '1px solid var(--border)', padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 4, width: '90%' }} />
                                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 4, width: '60%' }} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
];

export default function LayoutPicker({ currentLayout, onSelect, onClose }) {
    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                }}
            />

            {/* Modal */}
            <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'fixed', inset: 0, margin: 'auto',
                    width: '90%', maxWidth: 820,
                    height: 'fit-content',
                    zIndex: 201,
                    background: 'var(--bg-card)',
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                            Choose your dashboard layout
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Pick how you want to see your workspace. You can change this anytime.
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Layout options */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {LAYOUTS.map(layout => {
                        const isActive = currentLayout === layout.key;
                        return (
                            <motion.div
                                key={layout.key}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => { onSelect(layout.key); onClose(); }}
                                style={{
                                    borderRadius: 14, padding: 14, cursor: 'pointer',
                                    border: isActive ? '2px solid #16a34a' : '1.5px solid var(--border)',
                                    background: isActive ? '#16a34a08' : 'var(--bg)',
                                    transition: 'all 0.15s', position: 'relative',
                                }}
                            >
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', top: 10, right: 10,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <svg width="10" height="10" viewBox="0 0 10 10">
                                            <polyline points="2,5 4,7 8,3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                                <div style={{ marginBottom: 10 }}>{layout.preview}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {layout.name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    {layout.desc}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}