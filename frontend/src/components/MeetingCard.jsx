import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MeetingCard({ meeting, index, onClick }) {
    const navigate = useNavigate();
    const date = new Date(meeting.created_at);
    const formatted = date.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });

    function handleClick() {
        if (onClick) onClick(meeting);
        // Navigate to meetings page with this meeting pre-selected
        navigate('/meetings', { state: { selectedMeetingId: meeting.id } });
    }

    return (
        <motion.div
            className="meeting-row"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            whileHover={{ background: 'var(--bg)' }}
        >
            <div className="meeting-top">
                <div className="meeting-name">{meeting.title}</div>
                <div className="meeting-badge">{meeting.commitmentCount || 0} items</div>
            </div>
            <div className="meeting-date">{formatted} · {time}</div>
        </motion.div>
    );
}