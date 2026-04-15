import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Terms() {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: 720, margin: '0 auto' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
                    <div
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Meeting<span style={{ color: '#16a34a' }}>Debt</span>
                        </span>
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '48px 56px',
                }}>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>
                        Terms of Service
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 40 }}>
                        Last updated: April 15, 2026
                    </p>

                    {[
                        {
                            title: '1. Acceptance of Terms',
                            body: `By accessing or using MeetingDebt ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. We reserve the right to update these terms at any time, and continued use of the Service constitutes acceptance of any changes.`,
                        },
                        {
                            title: '2. Description of Service',
                            body: `MeetingDebt is a productivity tool that helps individuals and teams track commitments made during meetings. The Service allows users to create workspaces, assign tasks, set deadlines, and receive email notifications about pending and overdue commitments.`,
                        },
                        {
                            title: '3. Account Registration',
                            body: `To use MeetingDebt, you must create an account using a valid email address or a Google account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must be at least 13 years old to use the Service.`,
                        },
                        {
                            title: '4. Acceptable Use',
                            body: `You agree to use MeetingDebt only for lawful purposes and in a way that does not infringe the rights of others. You must not misuse the Service by introducing malware, attempting unauthorized access, or using the Service to send spam. We reserve the right to suspend or terminate accounts that violate these terms.`,
                        },
                        {
                            title: '5. Workspaces and Teams',
                            body: `Workspace managers are responsible for the members they invite and the content within their workspace. By inviting team members, managers consent to sharing workspace data (tasks, meeting records, member activity) with those members. Members can leave a workspace at any time from their profile settings.`,
                        },
                        {
                            title: '6. Intellectual Property',
                            body: `MeetingDebt and its original content, features, and functionality are owned by MeetingDebt and are protected by copyright and other intellectual property laws. You retain ownership of any content you create within the Service (tasks, meeting notes, etc.).`,
                        },
                        {
                            title: '7. Privacy',
                            body: `Your use of MeetingDebt is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.`,
                        },
                        {
                            title: '8. Email Notifications',
                            body: `By creating an account, you consent to receiving transactional emails from MeetingDebt including account verification, password reset, and task reminder notifications. You can manage notification preferences in your profile settings.`,
                        },
                        {
                            title: '9. Disclaimer of Warranties',
                            body: `The Service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely secure. Your use of the Service is at your own risk.`,
                        },
                        {
                            title: '10. Limitation of Liability',
                            body: `To the maximum extent permitted by law, MeetingDebt shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service, even if we have been advised of the possibility of such damages.`,
                        },
                        {
                            title: '11. Termination',
                            body: `You may delete your account at any time from Profile → Settings → Danger Zone. We reserve the right to suspend or terminate your access to the Service at any time for violations of these Terms. Upon termination, your right to use the Service will immediately cease.`,
                        },
                        {
                            title: '12. Contact Us',
                            body: `If you have any questions about these Terms of Service, please contact us at: support@meetingdebt.com`,
                        },
                    ].map(section => (
                        <div key={section.title} style={{ marginBottom: 32 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, marginTop: 0 }}>
                                {section.title}
                            </h2>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
                                {section.body}
                            </p>
                        </div>
                    ))}

                    <div style={{
                        marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 MeetingDebt. All rights reserved.</span>
                        <button
                            onClick={() => navigate('/privacy')}
                            style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Privacy Policy →
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
