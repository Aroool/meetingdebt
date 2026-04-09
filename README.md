# MeetingDebt

**Turn meeting transcripts into tracked commitments — automatically.**

MeetingDebt extracts action items from your meeting transcripts using AI, assigns them to team members, and holds everyone accountable with deadline tracking, reassignment, and automated nudge emails.

---

## The Problem

Every team has the same meeting loop: decisions get made, action items get assigned in the moment, and then nothing happens. Someone eventually asks "wait, who was supposed to do that?" The commitments exist — they're buried in a transcript or a chat log — but there's no system connecting the words spoken in a meeting to actual tracked work.

Existing tools force you to manually create tasks. Nobody does it consistently.

---

## The Solution

MeetingDebt sits one step earlier in the workflow. Paste a meeting transcript (or let the Chrome extension capture it from Google Meet, Zoom, or Teams), and Claude parses it into structured commitments: task, owner, deadline, and type. You review and confirm. The tasks are then live in the dashboard, assigned to the right team members, and tracked to completion.

No manual entry. No context-switching to a project management tool mid-meeting.

---

## Key Features

**AI Extraction**
- Parses raw meeting transcripts using Claude Haiku (Anthropic)
- Extracts task descriptions, owners, deadlines, and commitment types (action item / decision / blocker)
- Converts relative dates ("end of week", "Friday") to ISO dates using the real calendar
- Auto-matches commitment owners to workspace members by name or email

**Workspace & Role Management**
- Manager / Member role model with enforced authorization throughout
- Invite members via email (tokenised invite links)
- Join workspaces by shareable code

**Commitment Tracking**
- Status lifecycle: Pending → Completed / Blocked / Overdue
- Inline status updates from any view
- Manager-only reassignment with in-app notifications
- Grouped view (by meeting) and flat view with filters

**Automated Nudges**
- Daily digest email sent at 9 AM ET via SendGrid
- Per-user summary of overdue, due today, and upcoming tasks
- Per-member nudge opt-out preference

**Manual Nudge**
- Manager can nudge any team member on a specific overdue commitment instantly

**Personal Task Tracking**
- Separate personal task list decoupled from workspace meetings
- Deadline tracking with the same status model

**Chrome Extension**
- Content scripts inject into Google Meet, Zoom, and Microsoft Teams
- Captures transcript text and pushes it to the dashboard via `chrome.storage.local`
- Auth-sync script keeps the session in sync with the web app
- Opens the extraction modal automatically on the dashboard

**Dashboard Layouts**
- Layout A: Three-column — Today's Focus, Commitments (grouped/flat), Accountability sidebar with per-member progress bars
- Layout B: Alternative layout persisted to localStorage
- Activity feed with real-time workspace event log

**Notification Center**
- In-app notification bell with unread count
- Assignment and status-change notifications
- Mark individual or all notifications read

---

## Architecture

```
┌─────────────────────┐     ┌───────────────────────┐
│   Chrome Extension  │     │    React SPA           │
│   (MV3)             │     │    (meetingdebt.com)   │
│                     │     │                        │
│  content.js ────────┼─────▶  chrome.storage.local  │
│  (Meet/Zoom/Teams)  │     │  → NewMeetingModal     │
│  background.js      │     │                        │
│  auth-sync.js       │     │  Supabase Auth (JWT)   │
└─────────────────────┘     └──────────┬─────────────┘
                                        │ Bearer token
                                        ▼
                            ┌───────────────────────┐
                            │   Express REST API     │
                            │   (Railway)            │
                            │                        │
                            │  requireAuth()         │
                            │  getWorkspaceMembership│
                            │  aiLimiter / general   │
                            │  Limiter               │
                            └──────────┬─────────────┘
                                        │
               ┌────────────────────────┼────────────────────┐
               ▼                        ▼                     ▼
   ┌─────────────────┐     ┌──────────────────┐   ┌──────────────────┐
   │  Supabase       │     │  Anthropic API    │   │  SendGrid SMTP   │
   │  (PostgreSQL    │     │  Claude Haiku     │   │  (nodemailer)    │
   │  + Auth)        │     │  AI extraction    │   │  nudges, invites │
   └─────────────────┘     └──────────────────┘   └──────────────────┘
```

### Request Flow — Authentication

Every protected route passes through `requireAuth` middleware, which validates the Supabase JWT from the `Authorization: Bearer` header. `req.userId` and `req.userEmail` are set from the verified token — never from client-supplied query params or body fields.

Workspace-scoped routes additionally call `getWorkspaceMembership(userId, workspaceId)` before touching any data. Manager-only operations (invite, reassign, delete meeting) check `role === 'manager'` before proceeding.

---

## AI Extraction Flow

```
1. User pastes transcript into NewMeetingModal
   (or Chrome extension auto-populates it)

2. POST /extract-preview
   ├── Rate limited: 10 req/min per IP
   ├── Validates transcript length (max 50,000 chars)
   ├── Calls Claude Haiku with structured prompt
   │   └── Extracts: task, owner, deadline (ISO), type
   ├── Fetches workspace members for name matching
   ├── Runs buildMatcher() — exact → first name → email prefix
   └── Returns { commitments[] } — no DB write yet

3. User reviews extracted commitments in the confirm step
   └── Can adjust assignments using the member dropdown

4. POST /save-commitments
   ├── Verifies workspace membership + manager role
   ├── Creates the meeting record
   ├── Inserts all commitments with assigned_to UUIDs
   ├── Sends assignment emails to assigned members (background)
   ├── Creates in-app notifications for assignees
   └── Logs activity to workspace feed
```

The meeting record is intentionally not created until the user confirms. Cancelling the modal leaves zero orphaned data.

---

## Extension Workflow

The Chrome extension is a Manifest V3 extension with three script roles:

| Script | Purpose |
|--------|---------|
| `content.js` | Injected into Meet / Zoom / Teams. Detects transcript availability and captures text. |
| `background.js` | Service worker. Handles cross-origin messaging and stores transcript via `chrome.storage.local`. |
| `auth-sync.js` | Injected into the MeetingDebt web app. Syncs auth state so the extension knows the user is logged in. |
| `popup.js` | Extension popup UI — shows current status, links to dashboard. |

When a meeting ends, the extension writes `{ transcript, timestamp }` to `chrome.storage.local`. The dashboard polls for this on mount and opens the extraction modal automatically if the data is fresh (< 5 minutes old).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Framer Motion 12, GSAP 3 |
| Styling | Plain CSS with custom properties — no framework |
| Auth | Supabase Auth (JWT) |
| Backend | Node.js, Express 5 |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5`) |
| Email | SendGrid via nodemailer (SMTP) |
| Scheduling | node-cron (daily 9 AM ET digest) |
| Rate Limiting | express-rate-limit (100 req/min general, 10 req/min AI) |
| Extension | Chrome Manifest V3 |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Database Schema (key tables)

```
workspaces          id, name, owner_id, code
workspace_members   workspace_id, user_id, role, email, name, nudge_enabled
meetings            id, title, owner_email, user_id, workspace_id, created_at
commitments         id, meeting_id, task, owner, deadline, type, status,
                    user_id, workspace_id, assigned_to, is_personal
invites             id, workspace_id, email, invited_by, token, accepted
notifications       id, user_id, workspace_id, type, message, read
activity_log        id, workspace_id, user_id, actor_name, type, message, meta
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Anthropic API key
- SendGrid account + verified sender email

### 1. Clone

```bash
git clone https://github.com/Aroool/meetingdebt.git
cd meetingdebt
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in values below
npm install
node server.js
```

**`.env` values required:**

```
SUPABASE_URL=
SUPABASE_KEY=          # service role key
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=   # verified sender
FRONTEND_URL=http://localhost:3000
PORT=5001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

**`.env` values required:**

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_URL=http://localhost:5001
```

### 4. Chrome Extension (optional)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. The extension icon appears in the toolbar

The extension auto-detects Google Meet, Zoom, and Teams tabs. Open the MeetingDebt dashboard first so the auth-sync script can share your session.

---

## Project Structure

```
meetingdebt/
├── backend/
│   └── server.js          # All routes, middleware, cron, email
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layouts/   # LayoutA, LayoutB dashboard layouts
│       │   ├── CommitmentRow.jsx   # Portal-based floating menus
│       │   ├── NewMeetingModal.jsx # Extract + confirm flow
│       │   ├── Navbar.jsx
│       │   ├── NotificationBell.jsx
│       │   └── Icons.jsx  # SVG icon system
│       ├── pages/         # Dashboard, Meetings, Commitments,
│       │   │              # MyTasks, Workspace, Profile...
│       └── styles/
│           └── global.css # Full design system via CSS custom properties
└── extension/
    ├── manifest.json
    ├── content.js
    ├── background.js
    ├── auth-sync.js
    └── popup.js
```

---

## Roadmap

- [ ] **Audio transcription** — AssemblyAI integration is stubbed in; direct meeting recording → extraction without needing a text transcript
- [ ] **Slack integration** — post commitment summaries to a channel after each meeting
- [ ] **Recurring commitments** — support weekly / bi-weekly follow-up cadences
- [ ] **Export** — download meeting commitments as CSV or push to Notion / Linear
- [ ] **Comment threads** — per-commitment discussion with @mentions
- [ ] **Mobile view** — responsive layout pass for the dashboard and meetings pages
- [ ] **SSO** — Google and GitHub OAuth via Supabase

---

## Security Notes

- All routes require a verified Supabase JWT via `Authorization: Bearer`
- Workspace data is gated behind membership checks on every route — authenticated users cannot access workspaces they don't belong to
- Role enforcement: manager-only operations (invite, reassign, delete meeting) return 403 to members
- `userId` is always sourced from the verified token (`req.userId`), never from query params or request body
- AI extraction is rate-limited separately from general API traffic (10 req/min)
- CORS is locked to the production domain and localhost only

---

## License

MIT
