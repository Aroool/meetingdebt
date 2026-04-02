// Content script — runs on Meet, Zoom, Teams pages
// Scrapes transcript when requested

function scrapeGoogleMeet() {
    const transcriptElements = document.querySelectorAll(
        '[class*="transcript"] span, [data-message-text], .bj26n, [jsname="tgaKEf"]'
    );
    if (transcriptElements.length === 0) return null;

    const lines = [];
    transcriptElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) lines.push(text);
    });
    return lines.join('\n') || null;
}

function scrapeZoom() {
    const transcriptElements = document.querySelectorAll(
        '.transcript-item, [class*="transcript-content"], .chat-item__text'
    );
    if (transcriptElements.length === 0) return null;

    const lines = [];
    transcriptElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) lines.push(text);
    });
    return lines.join('\n') || null;
}

function scrapeTeams() {
    const transcriptElements = document.querySelectorAll(
        '[data-tid="closed-captions-renderer"] span, .ts-message-list-item, [class*="transcript"]'
    );
    if (transcriptElements.length === 0) return null;

    const lines = [];
    transcriptElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) lines.push(text);
    });
    return lines.join('\n') || null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeTranscript') {
        let transcript = null;
        const url = window.location.href;

        if (url.includes('meet.google.com')) {
            transcript = scrapeGoogleMeet();
        } else if (url.includes('zoom.us')) {
            transcript = scrapeZoom();
        } else if (url.includes('teams.microsoft.com')) {
            transcript = scrapeTeams();
        }

        sendResponse({ transcript, url });
    }
    return true;
});