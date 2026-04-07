const MEETING_URLS = [
    'meet.google.com',
    'teams.microsoft.com',
    'app.zoom.us'
];

let capturingTabId = null;
let captureInterval = null;

// ── Detect when user enters a meeting tab ──
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    const url = tab.url || '';
    const isMeeting = MEETING_URLS.some(u => url.includes(u));
    if (!isMeeting) return;

    // Check if we're already capturing this tab
    chrome.storage.local.get(['capturingTabId'], (result) => {
        if (result.capturingTabId === tabId) return;

        // Show notification asking to start capture
        chrome.notifications.create('start-capture-' + tabId, {
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'MeetingDebt detected a meeting',
            message: 'Click the MeetingDebt extension icon to start capturing captions.',
            priority: 2,
        });
    });
});

// ── Detect when meeting tab is closed ──
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.get(['capturingTabId'], (result) => {
        if (result.capturingTabId !== tabId) return;
        stopCapture(tabId, true);
    });
});

// ── Detect when user navigates away from meeting ──
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    chrome.storage.local.get(['capturingTabId'], (result) => {
        if (result.capturingTabId !== tabId) return;
        const url = tab.url || '';
        const isMeeting = MEETING_URLS.some(u => url.includes(u));
        if (!isMeeting) {
            stopCapture(tabId, true);
        }
    });
});

async function stopCapture(tabId, meetingEnded) {
    chrome.storage.local.get(['capturedLines', 'meetingTitle'], (result) => {
        const lines = result.capturedLines || [];
        const title = result.meetingTitle || 'Untitled Meeting';

        // Clear capturing state
        chrome.storage.local.remove(['capturingTabId', 'isCapturing', 'capturedLines', 'meetingTitle']);

        if (!meetingEnded || lines.length < 5) return;

        // Show notification that meeting ended
        chrome.notifications.create('meeting-ended', {
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Meeting ended!',
            message: `${lines.length} caption lines captured from "${title}". Click to extract commitments.`,
            priority: 2,
        });

        // Store transcript for popup to pick up
        const transcript = lines.join('\n');
        chrome.storage.local.set({
            pendingTranscript: {
                transcript,
                title,
                timestamp: Date.now(),
            }
        });
    });
}

// ── Handle notification clicks ──
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
    if (notificationId === 'meeting-ended') {
        // Open MeetingDebt dashboard
        chrome.tabs.query({}, (tabs) => {
            const mdTab = tabs.find(t =>
                t.url?.includes('meetingdebt.com') ||
                t.url?.includes('localhost:3000')
            );
            if (mdTab) {
                chrome.tabs.update(mdTab.id, { active: true });
            } else {
                chrome.tabs.create({ url: 'https://meetingdebt.com/dashboard' });
            }
        });
    }
});

// ── Messages from popup and content script ──
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startCapture') {
        const { tabId, title } = request;
        chrome.storage.local.set({
            capturingTabId: tabId,
            isCapturing: true,
            capturedLines: [],
            meetingTitle: title,
        });
        capturingTabId = tabId;
        sendResponse({ success: true });
    }

    if (request.action === 'stopCapture') {
        chrome.storage.local.get(['capturingTabId'], (result) => {
            stopCapture(result.capturingTabId, true);
        });
        sendResponse({ success: true });
    }

    if (request.action === 'addCaptionLine') {
        chrome.storage.local.get(['capturedLines', 'isCapturing'], (result) => {
            if (!result.isCapturing) return;
            const lines = result.capturedLines || [];
            const newLine = request.line;
            // Avoid duplicates
            if (!lines.includes(newLine)) {
                lines.push(newLine);
                chrome.storage.local.set({ capturedLines: lines });
            }
        });
    }

    if (request.action === 'syncAuth') {
        chrome.storage.local.set({
            supabase_token: request.token,
            workspaceId: request.workspaceId,
            workspaceName: request.workspaceName,
        });
    }

    return true;
});