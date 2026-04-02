// Runs on meetingdebt.com — syncs auth to extension storage
function syncAuth() {
    try {
        // Supabase stores token with this key format
        const projectRef = 'nxdgzrhvdwlxovdozaiw';
        const tokenKey = `sb-${projectRef}-auth-token`;
        const raw = localStorage.getItem(tokenKey);

        if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.access_token;
            const workspaceId = localStorage.getItem('workspaceId');
            const workspaceName = localStorage.getItem('workspaceName');

            if (token) {
                chrome.runtime.sendMessage({
                    action: 'syncAuth',
                    token,
                    workspaceId,
                    workspaceName,
                });
            }
        }
    } catch (err) {
        console.log('MeetingDebt auth sync failed:', err);
    }
}

syncAuth();
// Also sync when storage changes
window.addEventListener('storage', syncAuth);