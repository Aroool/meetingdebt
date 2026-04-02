chrome.runtime.onInstalled.addListener(() => {
    console.log('MeetingDebt extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'syncAuth') {
        chrome.storage.local.set({
            supabase_token: request.token,
            workspaceId: request.workspaceId,
            workspaceName: request.workspaceName,
        });
        console.log('Auth synced!', request.workspaceName);
    }
});