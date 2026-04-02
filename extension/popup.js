const API_URL = 'https://meetingdebt-production.up.railway.app';
const APP_URL = 'https://meetingdebt.com';

let authToken = null;
let workspaceId = null;
let workspaceName = null;
let currentTranscript = '';

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    await loadAuthState();
});

async function loadAuthState() {
    try {
        // Get auth from storage
        const stored = await chrome.storage.local.get([
            'supabase_token', 'workspaceId', 'workspaceName'
        ]);

        if (!stored.supabase_token) {
            showNotLoggedIn();
            return;
        }

        authToken = stored.supabase_token;
        workspaceId = stored.workspaceId;
        workspaceName = stored.workspaceName;

        document.getElementById('workspaceName').textContent =
            workspaceName || 'No workspace';

        // Check current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || '';

        const isMeetPage =
            url.includes('meet.google.com') ||
            url.includes('zoom.us') ||
            url.includes('teams.microsoft.com');

        showMainUI(isMeetPage, tab);
    } catch (err) {
        showNotLoggedIn();
    }
}

function showNotLoggedIn() {
    document.getElementById('workspaceName').textContent = 'Not connected';
    document.getElementById('mainBody').innerHTML = `
        <div class="not-logged-in">
            <p>Sign in to MeetingDebt to extract commitments from your meetings.</p>
            <a href="${APP_URL}/login" target="_blank" class="login-btn">
                Sign in to MeetingDebt
            </a>
        </div>
    `;
}

function showMainUI(isMeetPage, tab) {
    const platform = getPlatform(tab?.url || '');

    document.getElementById('mainBody').innerHTML = `
        <div class="status-bar">
            <div class="status-dot ${isMeetPage ? 'green' : 'amber'}"></div>
            <span>${isMeetPage
            ? `${platform} detected — try auto-scrape`
            : 'Navigate to Meet, Zoom, or Teams to auto-scrape'
        }</span>
        </div>

        ${isMeetPage ? `
            <button class="scrape-btn" id="scrapeBtn">
                ⚡ Auto-scrape transcript
            </button>

            <div class="divider">
                <div class="divider-line"></div>
                <span>or paste manually</span>
                <div class="divider-line"></div>
            </div>
        ` : ''}

        <input
            class="meeting-title-input"
            id="meetingTitle"
            placeholder="Meeting title (e.g. Friday Sprint Review)"
            value="${getMeetingTitle(tab?.url || '', tab?.title || '')}"
        />

        <textarea
            id="transcriptInput"
            placeholder="Paste your meeting transcript here...&#10;&#10;John: I'll finish the API docs by Wednesday.&#10;Sarah: I'll review them by Thursday."
        ></textarea>
        <div class="char-count" id="charCount">0 characters</div>

        <div id="errorMsg" style="display:none" class="error-msg"></div>

        <button class="extract-btn" id="extractBtn" disabled>
            Extract commitments →
        </button>
    `;

    // Events
    if (isMeetPage) {
        document.getElementById('scrapeBtn').addEventListener('click', handleScrape);
    }

    const textarea = document.getElementById('transcriptInput');
    const charCount = document.getElementById('charCount');
    const extractBtn = document.getElementById('extractBtn');

    textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        charCount.textContent = `${len} characters`;
        extractBtn.disabled = len < 20;
        currentTranscript = textarea.value;
    });

    extractBtn.addEventListener('click', handleExtract);
}

function getPlatform(url) {
    if (url.includes('meet.google.com')) return 'Google Meet';
    if (url.includes('zoom.us')) return 'Zoom';
    if (url.includes('teams.microsoft.com')) return 'Teams';
    return 'Meeting';
}

function getMeetingTitle(url, tabTitle) {
    if (url.includes('meet.google.com')) return tabTitle.replace(' - Google Meet', '').trim();
    if (url.includes('zoom.us')) return tabTitle.replace(' - Zoom', '').trim();
    if (url.includes('teams.microsoft.com')) return tabTitle.replace(' | Microsoft Teams', '').trim();
    return '';
}

async function handleScrape() {
    const btn = document.getElementById('scrapeBtn');
    btn.disabled = true;
    btn.textContent = 'Scraping...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeTranscript' });

        if (response?.transcript) {
            const textarea = document.getElementById('transcriptInput');
            textarea.value = response.transcript;
            currentTranscript = response.transcript;
            const len = response.transcript.length;
            document.getElementById('charCount').textContent = `${len} characters`;
            document.getElementById('extractBtn').disabled = len < 20;
            btn.textContent = '✓ Transcript captured!';
            btn.style.background = '#f0fdf4';
            btn.style.color = '#16a34a';
        } else {
            btn.textContent = 'No transcript found — paste manually';
            btn.style.background = '#fff7ed';
            btn.style.color = '#f59e0b';
            btn.disabled = false;
        }
    } catch (err) {
        btn.textContent = 'Could not scrape — paste manually';
        btn.style.background = '#fef2f2';
        btn.style.color = '#ef4444';
        btn.disabled = false;
    }
}

async function handleExtract() {
    const transcript = document.getElementById('transcriptInput').value.trim();
    const title = document.getElementById('meetingTitle').value.trim() || 'Meeting';
    const btn = document.getElementById('extractBtn');
    const errorMsg = document.getElementById('errorMsg');

    if (!transcript || transcript.length < 20) return;
    if (!workspaceId) {
        showError('No workspace found. Please open MeetingDebt first.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Extracting with AI...';
    errorMsg.style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/extract-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ transcript, workspaceId }),
        });

        if (!res.ok) throw new Error('Extraction failed');
        const data = await res.json();

        // Save commitments to storage for dashboard to pick up
        await chrome.storage.local.set({
            pendingExtraction: {
                transcript,
                title,
                workspaceId,
                commitments: data.commitments,
                timestamp: Date.now(),
            }
        });

        showSuccess(data.commitments?.length || 0, title);
    } catch (err) {
        showError('Extraction failed. Check your connection and try again.');
        btn.disabled = false;
        btn.textContent = 'Extract commitments →';
    }
}

function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function showSuccess(count, title) {
    document.getElementById('mainBody').innerHTML = `
        <div class="success-state">
            <div class="success-icon">✓</div>
            <div class="success-title">${count} commitments extracted!</div>
            <div class="success-sub">
                From "${title}". Open the dashboard to review and confirm assignments.
            </div>
            <button class="open-btn" id="openDashboard">
                Open dashboard →
            </button>
        </div>
    `;
    document.getElementById('openDashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: `${APP_URL}/dashboard` });
    });
}