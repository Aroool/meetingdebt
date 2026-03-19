import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogoTransition({ onComplete }) {
    const [showText, setShowText] = useState(false);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Show text after dot bounces
        const t1 = setTimeout(() => setShowText(true), 900);
        // Fade out and complete
        const t2 = setTimeout(() => setVisible(false), 1800);
        const t3 = setTimeout(() => onComplete && onComplete(), 2300);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="transition"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Bouncing dot */}
                        <motion.div
                            style={{
                                width: 14, height: 14,
                                borderRadius: '50%',
                                background: '#16a34a',
                                flexShrink: 0,
                            }}
                            initial={{ y: -80, opacity: 0 }}
                            animate={{
                                y: [null, 0, 6, -5, 2, 0],
                                opacity: [null, 1, 1, 1, 1, 1],
                                scaleX: [null, 1, 1.5, 0.85, 1.1, 1],
                                scaleY: [null, 1, 0.55, 1.25, 0.9, 1],
                            }}
                            transition={{
                                duration: 0.85,
                                times: [0, 0.38, 0.52, 0.7, 0.85, 1],
                                ease: 'easeOut',
                            }}
                        />

                        {/* Text slides in after dot settles */}
                        <motion.div
                            style={{ overflow: 'hidden' }}
                            initial={{ width: 0, opacity: 0 }}
                            animate={showText
                                ? { width: 'auto', opacity: 1 }
                                : { width: 0, opacity: 0 }
                            }
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.span
                                initial={{ x: -20, opacity: 0 }}
                                animate={showText ? { x: 0, opacity: 1 } : {}}
                                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    fontSize: 32,
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    letterSpacing: -1,
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
                                }}
                            >
                                Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                            </motion.span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}