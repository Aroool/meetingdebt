let captureActive = false;
let captureInterval = null;
let lastCapturedText = '';

// ── Detect captions for Google Meet ──
function getGoogleMeetCaptions() {
    const selectors = [
        '[class*="a4cQT"]',
        '[class*="TBnnIc"]',
        '[jsname="tgaKEf"]',
        '[class*="iOzk7"]',
        '.a4cQT',
        '[data-message-text]',
    ];
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
            return Array.from(els).map(el => el.textContent?.trim()).filter(t => t && t.length > 3).join('\n');
        }
    }
    return null;
}

// ── Detect captions for Teams ──
function getTeamsCaptions() {
    const selectors = [
        '[data-tid="closed-captions-renderer"]',
        '[class*="captionText"]',
        '[class*="caption-text"]',
        '.ts-message-list-item',
    ];
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
            return Array.from(els).map(el => el.textContent?.trim()).filter(t => t && t.length > 3).join('\n');
        }
    }
    return null;
}

// ── Get platform ──
function getPlatform() {
    const url = window.location.href;
    if (url.includes('meet.google.com')) return 'meet';
    if (url.includes('teams.microsoft.com')) return 'teams';
    if (url.includes('zoom.us')) return 'zoom';
    return null;
}

// ── Start polling captions ──
function startCaptionPolling() {
    if (captureInterval) return;
    captureActive = true;

    captureInterval = setInterval(() => {
        if (!captureActive) return;

        const platform = getPlatform();
        let text = null;

        if (platform === 'meet') text = getGoogleMeetCaptions();
        else if (platform === 'teams') text = getTeamsCaptions();

        if (!text || text === lastCapturedText) return;
        lastCapturedText = text;

        // Send new lines to background
        const lines = text.split('\n').filter(l => l.trim().length > 3);
        lines.forEach(line => {
            chrome.runtime.sendMessage({
                action: 'addCaptionLine',
                line: line.trim(),
            });
        });
    }, 2000);

    console.log('[MeetingDebt] Caption polling started');
}

// ── Stop polling ──
function stopCaptionPolling() {
    captureActive = false;
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    console.log('[MeetingDebt] Caption polling stopped');
}

// ── Listen for messages from popup/background ──
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeTranscript') {
        const platform = getPlatform();
        let transcript = null;
        if (platform === 'meet') transcript = getGoogleMeetCaptions();
        else if (platform === 'teams') transcript = getTeamsCaptions();
        sendResponse({ transcript, url: window.location.href });
    }

    if (request.action === 'startPolling') {
        startCaptionPolling();
        sendResponse({ success: true });
    }

    if (request.action === 'stopPolling') {
        stopCaptionPolling();
        sendResponse({ success: true });
    }

    if (request.action === 'getLineCount') {
        chrome.storage.local.get(['capturedLines'], (result) => {
            sendResponse({ count: (result.capturedLines || []).length });
        });
        return true;
    }

    return true;
});

// ── Check if we should auto-start (already capturing this tab) ──
chrome.storage.local.get(['capturingTabId', 'isCapturing'], (result) => {
    if (result.isCapturing) {
        chrome.tabs.getCurrent?.((tab) => {
            if (tab && tab.id === result.capturingTabId) {
                startCaptionPolling();
            }
        });
    }
});