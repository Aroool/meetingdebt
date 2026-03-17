import { motion } from 'framer-motion';

const icons = {
    red: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M7 4v3M7 9.5v.3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    amber: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M7 4.5V7l2 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    blue: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h7M7 4l3 3-3 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    green: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7l3 3 5-5.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

const colorMap = {
    red: { icon: 'ic-r', num: 'num-red' },
    amber: { icon: 'ic-a', num: 'num-amber' },
    blue: { icon: 'ic-b', num: 'num-blue' },
    green: { icon: 'ic-g', num: 'num-green' },
};

export default function StatCard({ label, value, color, index }) {
    const c = colorMap[color] || colorMap.green;

    return (
        <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
        >
            <div className="stat-top">
                <div className="stat-label">{label}</div>
                <div className={`stat-icon ${c.icon}`}>
                    {icons[color]}
                </div>
            </div>
            <motion.div
                className={`stat-num ${c.num}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.08 + 0.2, type: 'spring', stiffness: 200 }}
            >
                {value}
            </motion.div>
        </motion.div>
    );
}