const API_URL = 'https://meetingdebt-production.up.railway.app';
const APP_URL = 'https://meetingdebt.com';

let authToken = null;
let workspaceId = null;
let workspaceName = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadAuthState();
});

// ── FIND MEETINGDEBT TAB ──
async function findMeetingDebtTab() {
    const allTabs = await chrome.tabs.query({});
    return allTabs.find(t =>
        (t.url?.includes('meetingdebt.com') || t.url?.includes('localhost:3000')) &&
        !t.url?.includes('namecheap') // exclude namecheap
    ) || null;
}

// ── LOAD AUTH STATE ──
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

                    // Cache in extension storage for next time
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

        // Fall back to cached storage
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

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || '';
        const isMeetPage =
            url.includes('meet.google.com') ||
            url.includes('zoom.us') ||
            url.includes('teams.microsoft.com');

        showMainUI(isMeetPage, tab);
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
            <a href="${APP_URL}/login" target="_blank" class="login-btn">
                Open MeetingDebt
            </a>
            <br/><br/>
            <button id="refreshBtn" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:7px 16px;font-size:12px;color:#64748b;cursor:pointer;font-family:inherit;">
                Already signed in? Refresh ↺
            </button>
        </div>
    `;
    document.getElementById('refreshBtn').addEventListener('click', () => {
        window.location.reload();
    });
}

// ── MAIN UI ──
function showMainUI(isMeetPage, tab) {
    const platform = getPlatform(tab?.url || '');
    const meetingTitle = getMeetingTitle(tab?.url || '', tab?.title || '');

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
            value="${escapeHtml(meetingTitle)}"
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
    });

    extractBtn.addEventListener('click', handleExtract);
}

// ── SCRAPE ──
async function handleScrape() {
    const btn = document.getElementById('scrapeBtn');
    btn.disabled = true;
    btn.textContent = 'Scraping...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeTranscript' });

        if (response?.transcript && response.transcript.length > 20) {
            const textarea = document.getElementById('transcriptInput');
            textarea.value = response.transcript;
            const len = response.transcript.length;
            document.getElementById('charCount').textContent = `${len} characters`;
            document.getElementById('extractBtn').disabled = false;
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
        btn.textContent = 'Could not scrape — paste manually below';
        btn.style.background = '#fef2f2';
        btn.style.color = '#ef4444';
        btn.disabled = false;
    }
}

// ── EXTRACT ──
async function handleExtract() {
    const transcript = document.getElementById('transcriptInput').value.trim();
    const title = document.getElementById('meetingTitle').value.trim() || 'Untitled Meeting';
    const btn = document.getElementById('extractBtn');
    const errorMsg = document.getElementById('errorMsg');

    if (!transcript || transcript.length < 20) return;

    if (!workspaceId) {
        showError('No workspace found. Open MeetingDebt dashboard first.');
        return;
    }

    if (!authToken) {
        showError('Not authenticated. Please refresh and sign in.');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⚡ Extracting with AI...';
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

        if (res.status === 401) {
            // Token expired — clear cache and ask to re-login
            await chrome.storage.local.clear();
            showError('Session expired. Please refresh MeetingDebt and try again.');
            btn.disabled = false;
            btn.textContent = 'Extract commitments →';
            return;
        }

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        const commitments = data.commitments || [];

        if (commitments.length === 0) {
            showError('No commitments found in transcript. Try adding more detail.');
            btn.disabled = false;
            btn.textContent = 'Extract commitments →';
            return;
        }

        // Write to meetingdebt tab's localStorage so dashboard picks it up
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
                    func: (payload) => {
                        localStorage.setItem('pendingExtraction', JSON.stringify(payload));
                    },
                    args: [extractionPayload]
                });
                // Reload dashboard to trigger useEffect
                await chrome.tabs.reload(mdTab.id);
                // Switch to dashboard tab
                await chrome.tabs.update(mdTab.id, { active: true });
            } catch (scriptErr) {
                console.log('script inject error:', scriptErr);
            }
        } else {
            // No dashboard tab open — open one, it'll read from storage on load
            // Store in extension storage as fallback
            await chrome.storage.local.set({ pendingExtraction: extractionPayload });
            chrome.tabs.create({ url: `${APP_URL}/dashboard` });
        }

        showSuccess(commitments.length, title);

    } catch (err) {
        console.log('extract error:', err);
        showError('Extraction failed. Check your connection and try again.');
        btn.disabled = false;
        btn.textContent = 'Extract commitments →';
    }
}

// ── SUCCESS ──
function showSuccess(count, title) {
    document.getElementById('mainBody').innerHTML = `
        <div class="success-state">
            <div class="success-icon">✓</div>
            <div class="success-title">${count} commitments extracted!</div>
            <div class="success-sub">
                From "${escapeHtml(title)}". The dashboard is opening the confirmation modal now.
            </div>
        </div>
    `;
}

// ── HELPERS ──
function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
}

function getPlatform(url) {
    if (url.includes('meet.google.com')) return 'Google Meet';
    if (url.includes('zoom.us')) return 'Zoom';
    if (url.includes('teams.microsoft.com')) return 'Microsoft Teams';
    return 'Meeting';
}

function getMeetingTitle(url, tabTitle) {
    if (!tabTitle) return '';
    if (url.includes('meet.google.com')) return tabTitle.replace(' - Google Meet', '').trim();
    if (url.includes('zoom.us')) return tabTitle.replace(' - Zoom', '').trim();
    if (url.includes('teams.microsoft.com')) return tabTitle.replace(' | Microsoft Teams', '').trim();
    return '';
}

function escapeHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}