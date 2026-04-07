const API_URL = 'https://meetingdebt-production.up.railway.app';
const APP_URL = 'https://meetingdebt.com';

let authToken = null;
let workspaceId = null;
let workspaceName = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadAuthState();
});

async function findMeetingDebtTab() {
    const allTabs = await chrome.tabs.query({});
    return allTabs.find(t =>
        (t.url?.includes('meetingdebt.com') || t.url?.includes('localhost:3000')) &&
        !t.url?.includes('supabase') &&
        !t.url?.includes('railway') &&
        !t.url?.includes('vercel') &&
        !t.url?.includes('namecheap')
    ) || null;
}

async function loadAuthState() {
    try {
        const mdTab = await findMeetingDebtTab();
        if (mdTab) {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: mdTab.id },
                    func: () => {
                        const projectRef = 'nxdgzrhvdwlxovdozaiw';
                        const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
                        const parsed = raw ? JSON.parse(raw) : null;
                        return {
                            token: parsed?.access_token || null,
                            workspaceId: localStorage.getItem('workspaceId'),
                            workspaceName: localStorage.getItem('workspaceName'),
                        };
                    }
                });
                const result = results?.[0]?.result;
                if (result?.token) {
                    authToken = result.token;
                    workspaceId = result.workspaceId;
                    workspaceName = result.workspaceName;
                    await chrome.storage.local.set({
                        supabase_token: authToken,
                        workspaceId,
                        workspaceName,
                    });
                }
            } catch (e) {
                console.log('scripting error:', e);
            }
        }

        if (!authToken) {
            const stored = await chrome.storage.local.get([
                'supabase_token', 'workspaceId', 'workspaceName'
            ]);
            authToken = stored.supabase_token;
            workspaceId = stored.workspaceId;
            workspaceName = stored.workspaceName;
        }

        if (!authToken) {
            showNotLoggedIn();
            return;
        }

        document.getElementById('workspaceName').textContent =
            workspaceName || 'No workspace';

        // Check if there's a pending transcript from auto-capture
        const stored = await chrome.storage.local.get(['pendingTranscript', 'isCapturing', 'capturedLines', 'capturingTabId']);

        if (stored.pendingTranscript) {
            showPendingTranscript(stored.pendingTranscript);
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || '';
        const isMeetPage =
            url.includes('meet.google.com') ||
            url.includes('zoom.us') ||
            url.includes('teams.microsoft.com');

        if (isMeetPage && stored.isCapturing && stored.capturingTabId === tab.id) {
            showCapturing(tab, stored.capturedLines?.length || 0);
        } else if (isMeetPage) {
            showMeetingDetected(tab);
        } else {
            showMainUI(false, tab);
        }
    } catch (err) {
        console.log('loadAuthState error:', err);
        showNotLoggedIn();
    }
}

// ── NOT LOGGED IN ──
function showNotLoggedIn() {
    document.getElementById('workspaceName').textContent = 'Not connected';
    document.getElementById('mainBody').innerHTML = `
        <div class="not-logged-in">
            <p>Open MeetingDebt in a tab and sign in, then click Refresh.</p>
            <a href="${APP_URL}/login" target="_blank" class="login-btn">Open MeetingDebt</a>
            <br/><br/>
            <button id="refreshBtn" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:7px 16px;font-size:12px;color:#64748b;cursor:pointer;font-family:inherit;">
                Already signed in? Refresh ↺
            </button>
        </div>
    `;
    document.getElementById('refreshBtn').addEventListener('click', () => window.location.reload());
}

// ── MEETING DETECTED — not yet capturing ──
function showMeetingDetected(tab) {
    const platform = getPlatform(tab.url);
    document.getElementById('mainBody').innerHTML = `
        <div style="text-align:center;padding:16px 0">
            <div style="width:48px;height:48px;border-radius:50%;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:20px;">M</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px">${platform} detected!</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:20px;line-height:1.6">
                Enable Live Captions in your meeting (CC button), then click Start Capturing.
            </div>
            <button id="startCaptureBtn" class="scrape-btn" style="margin-bottom:10px">
                Start capturing captions
            </button>
            <div style="font-size:11px;color:#94a3b8">Captions will be captured automatically in the background</div>
        </div>

        <div style="margin-top:16px">
            <div class="divider">
                <div class="divider-line"></div>
                <span>or paste manually</span>
                <div class="divider-line"></div>
            </div>
            <input class="meeting-title-input" id="meetingTitle" placeholder="Meeting title" value="${escapeHtml(getMeetingTitle(tab.url, tab.title))}"/>
            <textarea id="transcriptInput" placeholder="Paste transcript here..."></textarea>
            <div class="char-count" id="charCount">0 characters</div>
            <div id="errorMsg" style="display:none" class="error-msg"></div>
            <button class="extract-btn" id="extractBtn" disabled>Extract commitments →</button>
        </div>
    `;

    document.getElementById('startCaptureBtn').addEventListener('click', async () => {
        const title = getMeetingTitle(tab.url, tab.title) || 'Meeting';
        await chrome.runtime.sendMessage({ action: 'startCapture', tabId: tab.id, title });
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'startPolling' });
        } catch (e) { console.log('content script not ready:', e); }
        showCapturing(tab, 0);
    });

    const textarea = document.getElementById('transcriptInput');
    const extractBtn = document.getElementById('extractBtn');
    textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        document.getElementById('charCount').textContent = `${len} characters`;
        extractBtn.disabled = len < 20;
    });
    extractBtn.addEventListener('click', handleExtract);
}

// ── CAPTURING IN PROGRESS ──
function showCapturing(tab, lineCount) {
    document.getElementById('mainBody').innerHTML = `
        <div style="text-align:center;padding:16px 0">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px">
                <div style="width:8px;height:8px;border-radius:50%;background:#16a34a;animation:pulse 1.5s infinite"></div>
                <div style="font-size:14px;font-weight:700;color:#0f172a">Capturing live captions</div>
            </div>
            <div style="font-size:28px;font-weight:800;color:#16a34a;margin-bottom:4px" id="lineCount">${lineCount}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:20px">caption lines captured</div>
            <button id="refreshCount" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;font-size:12px;color:#64748b;cursor:pointer;font-family:inherit;margin-bottom:12px">
                Refresh count ↺
            </button>
            <button id="stopCaptureBtn" style="width:100%;padding:11px;border-radius:10px;border:1px solid #fecaca;background:#fef2f2;color:#ef4444;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
                End meeting & extract
            </button>
            <div style="font-size:11px;color:#94a3b8;margin-top:10px">Close the meeting tab to auto-extract</div>
        </div>
        <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}</style>
    `;

    document.getElementById('refreshCount').addEventListener('click', async () => {
        const stored = await chrome.storage.local.get(['capturedLines']);
        document.getElementById('lineCount').textContent = stored.capturedLines?.length || 0;
    });

    document.getElementById('stopCaptureBtn').addEventListener('click', async () => {
        const stored = await chrome.storage.local.get(['capturedLines', 'meetingTitle']);
        const lines = stored.capturedLines || [];
        const title = stored.meetingTitle || 'Meeting';

        if (lines.length < 3) {
            showError('Not enough captions captured. Try enabling Live Captions in your meeting.');
            return;
        }

        await chrome.runtime.sendMessage({ action: 'stopCapture' });
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'stopPolling' });
        } catch (e) { }

        await handleExtractFromCapture(lines.join('\n'), title);
    });
}

// ── PENDING TRANSCRIPT (from auto-capture after meeting ended) ──
function showPendingTranscript(pending) {
    document.getElementById('mainBody').innerHTML = `
        <div style="text-align:center;padding:8px 0 16px">
            <div style="width:48px;height:48px;border-radius:50%;background:#fef3c7;border:1px solid #fde68a;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:22px;font-weight:700;color:#92400e;">!</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">Meeting captured!</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">"${escapeHtml(pending.title)}"</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:20px">${pending.transcript.split('\n').length} lines captured</div>
            <button id="extractNowBtn" class="scrape-btn" style="margin-bottom:8px">
                Extract commitments now
            </button>
            <button id="dismissBtn" style="width:100%;padding:9px;border-radius:10px;border:1px solid #e2e8f0;background:transparent;color:#94a3b8;font-size:12px;cursor:pointer;font-family:inherit;">
                Dismiss
            </button>
        </div>
    `;

    document.getElementById('extractNowBtn').addEventListener('click', async () => {
        await chrome.storage.local.remove(['pendingTranscript']);
        await handleExtractFromCapture(pending.transcript, pending.title);
    });

    document.getElementById('dismissBtn').addEventListener('click', async () => {
        await chrome.storage.local.remove(['pendingTranscript']);
        window.location.reload();
    });
}

// ── MAIN UI (no meeting detected) ──
function showMainUI(isMeetPage, tab) {
    document.getElementById('mainBody').innerHTML = `
        <div class="status-bar">
            <div class="status-dot amber"></div>
            <span>Navigate to Meet or Teams to auto-capture</span>
        </div>
        <input class="meeting-title-input" id="meetingTitle" placeholder="Meeting title (e.g. Friday Sprint Review)" value="${escapeHtml(getMeetingTitle(tab?.url || '', tab?.title || ''))}"/>
        <textarea id="transcriptInput" placeholder="Paste your meeting transcript here...&#10;&#10;John: I'll finish the API docs by Wednesday.&#10;Sarah: I'll review them by Thursday."></textarea>
        <div class="char-count" id="charCount">0 characters</div>
        <div id="errorMsg" style="display:none" class="error-msg"></div>
        <button class="extract-btn" id="extractBtn" disabled>Extract commitments →</button>
    `;

    const textarea = document.getElementById('transcriptInput');
    const extractBtn = document.getElementById('extractBtn');
    textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        document.getElementById('charCount').textContent = `${len} characters`;
        extractBtn.disabled = len < 20;
    });
    extractBtn.addEventListener('click', handleExtract);
}

// ── EXTRACT FROM CAPTURED CAPTIONS ──
async function handleExtractFromCapture(transcript, title) {
    showExtracting();
    try {
        const res = await fetch(`${API_URL}/extract-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ transcript, workspaceId, meetingTitle: title }),
        });

        if (!res.ok) throw new Error('Extraction failed');
        const data = await res.json();
        const commitments = data.commitments || [];

        if (commitments.length === 0) {
            document.getElementById('mainBody').innerHTML = `
                <div style="text-align:center;padding:24px 0">
                    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px">No commitments found</div>
                    <div style="font-size:12px;color:#64748b">Try enabling Live Captions during the meeting for better results.</div>
                </div>
            `;
            return;
        }

        // Write to dashboard localStorage
        const mdTab = await findMeetingDebtTab();
        const extractionPayload = {
            transcript,
            title,
            workspaceId,
            commitments,
            timestamp: Date.now(),
        };

        if (mdTab) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: mdTab.id },
                    func: (payload) => localStorage.setItem('pendingExtraction', JSON.stringify(payload)),
                    args: [extractionPayload]
                });
                await chrome.tabs.reload(mdTab.id);
                await chrome.tabs.update(mdTab.id, { active: true });
            } catch (e) {
                await chrome.storage.local.set({ pendingExtraction: extractionPayload });
                chrome.tabs.create({ url: `${APP_URL}/dashboard` });
            }
        } else {
            await chrome.storage.local.set({ pendingExtraction: extractionPayload });
            chrome.tabs.create({ url: `${APP_URL}/dashboard` });
        }

        showSuccess(commitments.length, title);
    } catch (err) {
        console.log('extract error:', err);
        document.getElementById('mainBody').innerHTML = `
            <div style="text-align:center;padding:24px 0">
                <div style="font-size:14px;font-weight:700;color:#ef4444;margin-bottom:8px">Extraction failed</div>
                <div style="font-size:12px;color:#64748b;margin-bottom:16px">Check your connection and try again.</div>
                <button onclick="window.location.reload()" style="padding:8px 20px;border-radius:8px;background:#16a34a;color:#fff;border:none;cursor:pointer;font-size:13px;font-family:inherit;">Try again</button>
            </div>
        `;
    }
}

// ── EXTRACT FROM MANUAL PASTE ──
async function handleExtract() {
    const transcript = document.getElementById('transcriptInput').value.trim();
    const title = document.getElementById('meetingTitle').value.trim() || 'Untitled Meeting';
    const btn = document.getElementById('extractBtn');

    if (!transcript || transcript.length < 20) return;
    if (!workspaceId) { showError('No workspace found. Open MeetingDebt first.'); return; }
    if (!authToken) { showError('Not authenticated. Please refresh.'); return; }

    btn.disabled = true;
    btn.textContent = 'Extracting with AI...';
    document.getElementById('errorMsg').style.display = 'none';

    try {
        const res = await fetch(`${API_URL}/extract-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ transcript, workspaceId, meetingTitle: title }),
        });

        if (res.status === 401) {
            await chrome.storage.local.clear();
            showError('Session expired. Refresh MeetingDebt and try again.');
            btn.disabled = false;
            btn.textContent = 'Extract commitments →';
            return;
        }

        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        const commitments = data.commitments || [];

        if (commitments.length === 0) {
            showError('No commitments found. Add more detail to the transcript.');
            btn.disabled = false;
            btn.textContent = 'Extract commitments →';
            return;
        }

        const mdTab = await findMeetingDebtTab();
        const extractionPayload = {
            transcript, title, workspaceId, commitments, timestamp: Date.now(),
        };

        if (mdTab) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: mdTab.id },
                    func: (payload) => localStorage.setItem('pendingExtraction', JSON.stringify(payload)),
                    args: [extractionPayload]
                });
                await chrome.tabs.reload(mdTab.id);
                await chrome.tabs.update(mdTab.id, { active: true });
            } catch (e) {
                await chrome.storage.local.set({ pendingExtraction: extractionPayload });
                chrome.tabs.create({ url: `${APP_URL}/dashboard` });
            }
        } else {
            await chrome.storage.local.set({ pendingExtraction: extractionPayload });
            chrome.tabs.create({ url: `${APP_URL}/dashboard` });
        }

        showSuccess(commitments.length, title);
    } catch (err) {
        showError('Extraction failed. Check your connection and try again.');
        btn.disabled = false;
        btn.textContent = 'Extract commitments →';
    }
}

// ── HELPERS ──
function showExtracting() {
    document.getElementById('mainBody').innerHTML = `
        <div style="text-align:center;padding:32px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:8px">Extracting commitments with AI...</div>
            <div style="font-size:11px;color:#94a3b8">This takes about 3 seconds</div>
        </div>
    `;
}

function showSuccess(count, title) {
    document.getElementById('mainBody').innerHTML = `
        <div class="success-state">
            <div class="success-icon">✓</div>
            <div class="success-title">${count} commitments extracted!</div>
            <div class="success-sub">From "${escapeHtml(title)}". Dashboard is opening...</div>
        </div>
    `;
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function getPlatform(url) {
    if (url?.includes('meet.google.com')) return 'Google Meet';
    if (url?.includes('zoom.us')) return 'Zoom';
    if (url?.includes('teams.microsoft.com')) return 'Microsoft Teams';
    return 'Meeting';
}

function getMeetingTitle(url, tabTitle) {
    if (!tabTitle) return '';
    if (url?.includes('meet.google.com')) return tabTitle.replace(' - Google Meet', '').trim();
    if (url?.includes('zoom.us')) return tabTitle.replace(' - Zoom', '').trim();
    if (url?.includes('teams.microsoft.com')) return tabTitle.replace(' | Microsoft Teams', '').trim();
    return '';
}

function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}