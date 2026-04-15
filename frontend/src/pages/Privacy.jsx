import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Privacy() {
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
                        Privacy Policy
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 40 }}>
                        Last updated: April 15, 2026
                    </p>

                    {[
                        {
                            title: '1. Information We Collect',
                            body: `When you create a MeetingDebt account, we collect your name, email address, and profile photo. When you use the app, we store meeting records, task commitments, deadlines, and workspace membership information you create. If you sign in with Google, we receive your name, email, and profile picture from Google.`,
                        },
                        {
                            title: '2. How We Use Your Information',
                            body: `We use your information to provide and improve MeetingDebt — creating your account, sending you task reminders and overdue alerts via email, allowing teammates to see your name and tasks in shared workspaces, and personalizing your experience. We do not sell your personal information to any third party.`,
                        },
                        {
                            title: '3. Email Communications',
                            body: `By creating an account, you may receive transactional emails such as account verification, password reset, and daily task digest notifications. You can control the timing of task digest emails in your profile settings. You can opt out of non-essential communications at any time.`,
                        },
                        {
                            title: '4. Data Storage',
                            body: `Your data is stored securely using Supabase (PostgreSQL), hosted on infrastructure provided by Amazon Web Services. Your data is encrypted in transit (TLS) and at rest. Profile photos are stored in Supabase Storage.`,
                        },
                        {
                            title: '5. Data Sharing',
                            body: `Within a workspace, your name, email, role, and task commitments are visible to other workspace members. We do not share your information with third parties except as necessary to operate the service (such as our email provider, SendGrid, which delivers notification emails on our behalf).`,
                        },
                        {
                            title: '6. Cookies & Local Storage',
                            body: `MeetingDebt uses browser local storage to keep you logged in and remember your workspace preferences. We do not use third-party tracking cookies or advertising cookies.`,
                        },
                        {
                            title: '7. Your Rights',
                            body: `You have the right to access, correct, or delete your personal data at any time. You can update your profile from the Profile page in the app. To delete your account and all associated data, go to Profile → Settings → Danger Zone. For any other data requests, contact us at the email below.`,
                        },
                        {
                            title: '8. Children\'s Privacy',
                            body: `MeetingDebt is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.`,
                        },
                        {
                            title: '9. Changes to This Policy',
                            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Continued use of MeetingDebt after changes constitutes your acceptance of the updated policy.`,
                        },
                        {
                            title: '10. Contact Us',
                            body: `If you have any questions about this Privacy Policy, please contact us at: support@meetingdebt.com`,
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
                            onClick={() => navigate('/terms')}
                            style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Terms of Service →
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
