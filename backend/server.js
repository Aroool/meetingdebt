const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');


const app = express();
app.set('trust proxy', 1);

// CORS — lock to frontend origin
app.use(cors({
    origin: [
        'https://meetingdebt.com',
        'https://www.meetingdebt.com',
        'https://meetingdebt.vercel.app',
        'http://localhost:3000'
    ],
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'AI extraction rate limit reached. Wait a minute.' },
});
app.use(generalLimiter);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function logActivity(workspaceId, userId, actorName, type, message, meta = {}) {
    try {
        await supabase.from('activity_log').insert({
            workspace_id: workspaceId,
            user_id: userId,
            actor_name: actorName,
            type,
            message,
            meta,
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Activity log error:', err);
    }
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.userId = user.id;
        req.userEmail = user.email;
        req.userName = user.user_metadata?.full_name || user.email?.split('@')[0];
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

// SendGrid transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});

// Shared matchMember function
function buildMatcher(members) {
    return function matchMember(ownerName) {
        if (!ownerName || members.length === 0) return null;
        const lower = ownerName.toLowerCase().trim();
        const exact = members.find(m =>
            m.name?.toLowerCase() === lower ||
            m.email?.toLowerCase().startsWith(lower)
        );
        if (exact) return exact.user_id;
        const firstNameMatch = members.find(m => {
            const memberFirst = m.name?.toLowerCase().split(' ')[0];
            const ownerFirst = lower.split(' ')[0];
            return memberFirst && memberFirst === ownerFirst;
        });
        if (firstNameMatch) return firstNameMatch.user_id;
        const emailMatch = members.find(m =>
            m.email?.toLowerCase().split('@')[0].includes(lower) ||
            lower.includes(m.email?.toLowerCase().split('@')[0])
        );
        return emailMatch?.user_id || null;
    };
}

// Nudge email template
function nudgeEmail(commitment, meetingTitle) {
    return `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">Meeting<span style="color: #16a34a;">Debt</span></span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
        A commitment from your meeting is overdue
      </h2>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
        From: <strong>${meetingTitle}</strong>
      </p>
      <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Commitment</div>
        <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${commitment.task}</div>
        <div style="font-size: 13px; color: #64748b;">
          Owner: <strong>${commitment.owner || 'Unknown'}</strong> · 
          Deadline: <strong>${commitment.deadline || 'No deadline set'}</strong>
        </div>
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
         style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
        View dashboard →
      </a>
      <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        Powered by MeetingDebt — making sure meeting commitments actually happen.
      </p>
    </div>
  `;
}

// Assignment email template
function assignmentEmail(commitment, meeting, memberName) {
    return `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 16px; font-weight: 800; color: #0f172a;">Meeting<span style="color: #16a34a;">Debt</span></span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
        You have a new task${memberName ? `, ${memberName}` : ''}
      </h2>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
        From: <strong>${meeting.title}</strong>
      </p>
      <div style="background: #f0fdf4; border-left: 3px solid #16a34a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">${commitment.task}</div>
        <div style="font-size: 13px; color: #64748b;">
          Deadline: <strong>${commitment.deadline || 'No deadline set'}</strong>
        </div>
      </div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
         style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        View your tasks →
      </a>
      <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
        Powered by MeetingDebt — making sure meeting commitments actually happen.
      </p>
    </div>
  `;
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.json({ message: 'MeetingDebt backend is running!' });
});

// Extract preview
app.post('/extract-preview', aiLimiter, requireAuth, async (req, res) => {
    try {
        const { transcript, meetingTitle, workspaceId } = req.body;
        const userId = req.userId;
        const ownerEmail = req.userEmail;
        if (!transcript) return res.status(400).json({ error: 'Transcript required' });
        if (transcript.length > 50000) return res.status(400).json({ error: 'Transcript too long (max 50,000 characters)' });

        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `You are analyzing a meeting transcript.
Extract all action items, decisions, and blockers.
For each item identify the real name of the person responsible.
Today's date is ${new Date().toISOString().split('T')[0]}.
Convert all relative deadlines like "tomorrow", "Wednesday", "end of week", "Friday" into real ISO dates (YYYY-MM-DD) based on today's date.
If no deadline is mentioned, use null.
Return ONLY valid JSON, nothing else:
{
  "commitments": [
    {
      "task": "description",
      "owner": "name of person",
      "deadline": "YYYY-MM-DD or null",
      "type": "action_item or decision or blocker"
    }
  ]
}
Transcript:
${transcript}`
            }]
        });

        const rawText = response.content[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]);

        let members = [];
        if (workspaceId) {
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('user_id, name, email')
                .eq('workspace_id', workspaceId);
            members = memberData || [];
        }

        const matchMember = buildMatcher(members);
        const commitments = parsed.commitments.map(c => ({
            ...c,
            assigned_to: matchMember(c.owner)
        }));

        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .insert({
                title: meetingTitle || 'Untitled Meeting',
                owner_email: ownerEmail || 'unknown@email.com',
                user_id: userId || null,
                workspace_id: workspaceId || null
            })
            .select()
            .single();

        if (meetingError) throw meetingError;
        return res.json({ meeting, commitments });

    } catch (error) {
        console.error('Extract preview error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Save commitments after manager confirms
app.post('/save-commitments', requireAuth, async (req, res) => {
    try {
        const { meeting, commitments, workspaceId } = req.body;
        const userId = req.userId;

        const commitmentsToInsert = commitments.map(c => ({
            meeting_id: meeting.id,
            task: c.task,
            owner: c.owner,
            deadline: c.deadline,
            type: c.type,
            status: 'pending',
            user_id: userId || null,
            workspace_id: workspaceId || null,
            assigned_to: c.assigned_to || null,
        }));

        const { data, error } = await supabase
            .from('commitments')
            .insert(commitmentsToInsert)
            .select();

        if (error) throw error;

        // Send notifications + emails for each assigned commitment
        for (const commitment of data) {
            if (!commitment.assigned_to) continue;

            const { data: member } = await supabase
                .from('workspace_members')
                .select('email, name')
                .eq('user_id', commitment.assigned_to)
                .single();

            if (!member?.email) continue;

            // Create in-app notification
            try {
                await supabase.from('notifications').insert({
                    user_id: commitment.assigned_to,
                    workspace_id: commitment.workspace_id,
                    type: 'assignment',
                    message: `You were assigned: "${commitment.task}" from ${meeting.title}`,
                });
            } catch (notifErr) {
                console.error('Notification insert failed:', notifErr.message);
            }

            // Send assignment email
            try {
                await transporter.sendMail({
                    from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                    to: member.email,
                    subject: `New task assigned: ${commitment.task}`,
                    html: assignmentEmail(commitment, meeting, member.name)
                });
            } catch (emailErr) {
                console.error('Assignment email failed:', emailErr.message);
            }
        }
        await logActivity(
            workspaceId, userId, 'Manager', 'meeting_created',
            `created meeting "${meeting.title}" with ${data.length} commitments`,
            { meetingId: meeting.id, count: data.length }
        );

        return res.json({ success: true, commitments: data });

    } catch (error) {
        console.error('Save commitments error:', error);
        return res.status(500).json({ error: error.message });
    }
});

app.get('/workspaces', async (req, res) => {
    try {
        const { userId } = req.query;
        const { data: memberships, error } = await supabase
            .from('workspace_members')
            .select('*, workspaces(*)')
            .eq('user_id', userId);

        if (error) throw error;

        const workspaces = memberships.map(m => ({
            ...m.workspaces,
            role: m.role
        }));

        return res.json(workspaces);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Legacy /extract route removed — use /extract-preview + /save-commitments instead

// Get all meetings
app.get('/meetings', requireAuth, async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.userId;
        let query = supabase
            .from('meetings')
            .select('*')
            .order('created_at', { ascending: false });

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get commitments for a specific meeting
app.get('/commitments/:meetingId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('commitments')
            .select('*, meetings(title)')
            .eq('meeting_id', req.params.meetingId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const flat = data.map(c => ({
            ...c,
            meeting_title: c.meetings?.title || null,
        }));
        return res.json(flat);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get all commitments
app.get('/commitments', requireAuth, async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.userId;
        let query = supabase
            .from('commitments')
            .select('*, meetings(title)')
            .order('created_at', { ascending: false });

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        const flat = data.map(c => ({
            ...c,
            meeting_title: c.meetings?.title || null,
        }));
        return res.json(flat);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Update commitment
app.patch('/commitments/:id', requireAuth, async (req, res) => {
    try {
        const { status, assigned_to } = req.body;
        const userId = req.userId;
        const updates = {};
        if (status !== undefined) updates.status = status;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;

        const { data, error } = await supabase
            .from('commitments')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Notify manager when member changes status
        if (status && data.workspace_id) {
            try {
                const { data: workspace } = await supabase
                    .from('workspaces')
                    .select('owner_id')
                    .eq('id', data.workspace_id)
                    .single();

                if (workspace?.owner_id && workspace.owner_id !== userId) {
                    const statusLabel = status === 'completed' ? 'Done' :
                        status === 'blocked' ? 'Blocked' :
                            status === 'overdue' ? 'Overdue' : 'Pending';

                    await supabase.from('notifications').insert({
                        user_id: workspace.owner_id,
                        workspace_id: data.workspace_id,
                        type: 'status_update',
                        message: `${data.owner} marked "${data.task}" as ${statusLabel}`,
                    });
                }
            } catch (notifErr) {
                console.error('Status notification failed:', notifErr.message);
            }
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Manual nudge
app.post('/nudge/:commitmentId', requireAuth, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const { data: commitment, error } = await supabase
            .from('commitments')
            .select('*')
            .eq('id', req.params.commitmentId)
            .single();

        if (error) throw error;

        const { data: meeting } = await supabase
            .from('meetings')
            .select('title')
            .eq('id', commitment.meeting_id)
            .single();

        await transporter.sendMail({
            from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
            to: email,
            subject: `Overdue: ${commitment.task}`,
            html: nudgeEmail(commitment, meeting?.title || 'Your meeting')
        });

        return res.json({ success: true, message: 'Nudge sent!' });
    } catch (error) {
        console.error('Nudge error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Daily cron — 9am
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily nudge check...');
    try {
        const today = new Date().toISOString();
        const { data: overdue } = await supabase
            .from('commitments')
            .select('*')
            .eq('status', 'pending')
            .lt('deadline', today);

        if (!overdue || overdue.length === 0) {
            console.log('No overdue commitments today.');
            return;
        }

        for (const commitment of overdue) {
            let recipientEmail = null;
            let nudgeEnabled = true;

            if (commitment.assigned_to) {
                const { data: member } = await supabase
                    .from('workspace_members')
                    .select('email, nudge_enabled')
                    .eq('user_id', commitment.assigned_to)
                    .single();

                if (member) {
                    recipientEmail = member.email;
                    nudgeEnabled = member.nudge_enabled !== false;
                }
            }

            if (!nudgeEnabled) continue;
            if (!recipientEmail || recipientEmail === 'unknown@email.com') {
                const { data: meeting } = await supabase
                    .from('meetings')
                    .select('owner_email')
                    .eq('id', commitment.meeting_id)
                    .single();
                recipientEmail = meeting?.owner_email;
            }

            if (!recipientEmail || recipientEmail === 'unknown@email.com') continue;

            try {
                const { data: meeting } = await supabase
                    .from('meetings')
                    .select('title')
                    .eq('id', commitment.meeting_id)
                    .single();

                await transporter.sendMail({
                    from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                    to: recipientEmail,
                    subject: `Overdue: ${commitment.task}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #0f172a;">Commitment Overdue</h2>
                            <p style="color: #475569;">Your commitment from <strong>${meeting?.title || 'a meeting'}</strong> is now overdue.</p>
                            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #1e293b; font-weight: 600;">${commitment.task}</p>
                                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Due: ${new Date(commitment.deadline).toLocaleDateString()}</p>
                            </div>
                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Dashboard</a>
                        </div>
                    `
                });
                console.log(`Sent nudge to ${recipientEmail} for task: ${commitment.task}`);
            } catch (err) {
                console.error(`Failed to send mail to ${recipientEmail}:`, err);
            }
        }
    } catch (err) {
        console.error('Cron error:', err);
    }
});

// ─── WORKSPACES ───────────────────────────────────────────────────────────────

app.post('/workspaces', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId;
        const userEmail = req.userEmail;
        const userName = req.userName;
        if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Workspace name is required' });

        // Generate unique code
        let code;
        let codeExists = true;
        while (codeExists) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data } = await supabase.from('workspaces').select('id').eq('code', code).single();
            codeExists = !!data;
        }

        const { data: workspace, error } = await supabase
            .from('workspaces')
            .insert({ name, owner_id: userId, code })
            .select()
            .single();

        if (error) throw error;

        await supabase.from('workspace_members').insert({
            workspace_id: workspace.id,
            user_id: userId,
            role: 'manager',
            email: userEmail,
            name: userName || userEmail?.split('@')[0]
        });

        return res.json({ success: true, workspace });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/workspaces/join-by-code', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.userId;
        const userEmail = req.userEmail;
        const userName = req.userName;

        const { data: workspace, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !workspace) {
            return res.status(404).json({ error: 'Invalid code. Check with your manager.' });
        }

        const { data: existing } = await supabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspace.id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            return res.json({ success: true, workspace, alreadyMember: true });
        }

        await supabase.from('workspace_members').insert({
            workspace_id: workspace.id,
            user_id: userId,
            role: 'member',
            email: userEmail,
            name: userName || userEmail?.split('@')[0]
        });

        return res.json({ success: true, workspace });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/workspaces', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { data: memberships, error } = await supabase
            .from('workspace_members')
            .select('*, workspaces(*)')
            .eq('user_id', userId);

        if (error) throw error;

        const workspaces = memberships.map(m => ({
            ...m.workspaces,
            role: m.role
        }));

        return res.json(workspaces);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/workspaces/:workspaceId/members', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', req.params.workspaceId);

        if (error) throw error;
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/workspaces/:workspaceId/invite', requireAuth, async (req, res) => {
    try {
        const { email, invitedBy, workspaceName } = req.body;
        const { workspaceId } = req.params;

        const { data: invite, error } = await supabase
            .from('invites')
            .insert({ workspace_id: workspaceId, email, invited_by: invitedBy })
            .select()
            .single();

        if (error) throw error;

        const inviteUrl = `${process.env.FRONTEND_URL}/invite/${invite.token}`;

        await transporter.sendMail({
            from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
            to: email,
            subject: `You've been invited to join ${workspaceName} on MeetingDebt`,
            html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 16px; font-weight: 800; color: #0f172a;">Meeting<span style="color: #16a34a;">Debt</span></span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">You've been invited</h2>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
            Join <strong>${workspaceName}</strong> on MeetingDebt — where meeting commitments actually get done.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Accept invitation →
          </a>
        </div>
      `
        });

        await logActivity(
            workspaceId, invitedBy, 'Manager', 'member_invited',
            `invited ${email} to the workspace`,
            { email }
        );

        return res.json({ success: true, invite });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/invites/:token/accept', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const userEmail = req.userEmail;
        const userName = req.userName;

        const { data: invite, error } = await supabase
            .from('invites')
            .select('*')
            .eq('token', req.params.token)
            .eq('accepted', false)
            .single();

        if (error || !invite) {
            return res.status(404).json({ error: 'Invite not found or already used' });
        }

        await supabase.from('workspace_members').insert({
            workspace_id: invite.workspace_id,
            user_id: userId,
            role: 'member',
            email: userEmail,
            name: userName || userEmail?.split('@')[0]
        });

        await supabase.from('invites').update({ accepted: true }).eq('id', invite.id);

        return res.json({ success: true, workspaceId: invite.workspace_id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/workspaces/:workspaceId/role', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { data, error } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', req.params.workspaceId)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return res.json({ role: data.role });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/workspaces/:workspaceId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', req.params.workspaceId)
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Test nudges manually
app.get('/test-nudges', requireAuth, async (req, res) => {
    try {
        const today = new Date().toISOString();
        const { data: overdue } = await supabase
            .from('commitments')
            .select('*')
            .eq('status', 'pending')
            .lt('deadline', today);

        return res.json({
            found: overdue?.length || 0,
            commitments: overdue?.map(c => ({ id: c.id, task: c.task, deadline: c.deadline }))
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

// Mark ALL read — must be before /:id route
app.patch('/notifications/read-all', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .filter('user_id', 'eq', userId)
            .eq('read', false);

        if (error) throw error;
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Mark single notification read
app.patch('/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Get notifications — uses filter() instead of eq() to avoid uuid type mismatch
app.get('/notifications', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .filter('user_id', 'eq', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return res.json(data || []);
    } catch (error) {
        console.error('Notifications error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Update settings (nudge preference)
app.patch('/profile/settings', requireAuth, async (req, res) => {
    try {
        const { nudge_enabled, workspaceId } = req.body;
        if (workspaceId) {
            const { error } = await supabase
                .from('workspace_members')
                .update({ nudge_enabled: !!nudge_enabled })
                .eq('user_id', req.userId)
                .eq('workspace_id', workspaceId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('workspace_members')
                .update({ nudge_enabled: !!nudge_enabled })
                .eq('user_id', req.userId);
            if (error) throw error;
        }
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Delete account permanently
app.post('/profile/delete-account', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('workspace_members').delete().eq('user_id', userId);
        await supabase.from('commitments').delete().eq('user_id', userId);
        await supabase.from('meetings').delete().eq('user_id', userId);
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5001;

app.get('/activity', async (req, res) => {
    try {
        const { workspaceId, limit = 10 } = req.query;
        if (!workspaceId) return res.json([]);

        const { data, error } = await supabase
            .from('activity_log')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Create personal task
app.post('/personal-tasks', requireAuth, async (req, res) => {
    try {
        const { task, deadline, notes, workspaceId } = req.body;
        const userId = req.userId;

        // Get user's name from auth
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        const ownerName = user?.user_metadata?.first_name
            || user?.user_metadata?.full_name?.split(' ')[0]
            || user?.email?.split('@')[0]
            || 'Me';

        const { data, error } = await supabase
            .from('commitments')
            .insert({
                task,
                deadline: deadline || null,
                notes: notes || null,
                status: 'pending',
                user_id: userId,
                workspace_id: workspaceId || null,
                meeting_id: null,
                is_personal: true,
                owner: ownerName,
                assigned_to: userId,
            })
            .select()
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error('Personal task error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Delete personal task
app.delete('/personal-tasks/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('commitments')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.userId)
            .eq('is_personal', true);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get personal tasks
app.get('/personal-tasks', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { data, error } = await supabase
            .from('commitments')
            .select('*')
            .eq('user_id', userId)
            .eq('is_personal', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ── DAILY NUDGE EMAIL ──
async function sendDailyNudges() {
    try {
        console.log('Running daily nudge job...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Get all non-completed commitments
        const { data: commitments, error } = await supabase
            .from('commitments')
            .select('*, meetings(title)')
            .neq('status', 'completed')
            .not('assigned_to', 'is', null);

        if (error) throw error;
        if (!commitments?.length) return;

        // Group by assigned_to user
        const byUser = commitments.reduce((acc, c) => {
            if (!acc[c.assigned_to]) acc[c.assigned_to] = [];
            acc[c.assigned_to].push(c);
            return acc;
        }, {});

        for (const [userId, tasks] of Object.entries(byUser)) {
            try {
                // Get user email
                const { data: { user } } = await supabase.auth.admin.getUserById(userId);
                if (!user?.email) continue;

                const name = user.user_metadata?.first_name
                    || user.user_metadata?.full_name?.split(' ')[0]
                    || user.email.split('@')[0];

                // Split into overdue and due today
                const overdue = tasks.filter(c => {
                    if (!c.deadline) return false;
                    const d = new Date(c.deadline);
                    return !isNaN(d) && d < new Date();
                });

                const dueToday = tasks.filter(c => {
                    if (!c.deadline) return false;
                    const d = new Date(c.deadline);
                    if (isNaN(d)) return false;
                    return d.toISOString().split('T')[0] === todayStr && d >= new Date();
                });

                const upcoming = tasks.filter(c => {
                    if (!c.deadline) return false;
                    const d = new Date(c.deadline);
                    if (isNaN(d)) return false;
                    return d > new Date() && d.toISOString().split('T')[0] !== todayStr;
                });

                // Skip if nothing to report
                if (!overdue.length && !dueToday.length && !upcoming.length) continue;

                const taskRow = (t, urgent = false) => `
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">
              <div style="font-size:13px;font-weight:500;color:${urgent ? '#ef4444' : '#0f172a'}">${t.task}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:3px">
                ${t.meetings?.title || t.meeting_id ? (t.meetings?.title || 'Meeting') : 'Personal task'}
                ${t.deadline && !isNaN(new Date(t.deadline)) ? ` · ${new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
              </div>
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap">
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${urgent ? '#fef2f2' : '#fffbeb'};color:${urgent ? '#ef4444' : '#f59e0b'}">
                ${urgent ? 'Overdue' : 'Due today'}
              </span>
            </td>
          </tr>
        `;

                const upcomingRow = (t) => `
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">
              <div style="font-size:13px;font-weight:500;color:#0f172a">${t.task}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:3px">
                ${t.meetings?.title || 'Personal task'}
                
                
              </div>
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:right">
              <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#f0fdf4;color:#16a34a">Upcoming</span>
            </td>
          </tr>
        `;

                const html = `
          <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
            <div style="margin-bottom:24px;display:flex;align-items:center;gap:8px">
              <div style="width:8px;height:8px;border-radius:50%;background:#16a34a"></div>
              <span style="font-size:16px;font-weight:800;color:#0f172a">Meeting<span style="color:#16a34a">Debt</span></span>
            </div>

            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px">
              Your tasks for today, ${name}
            </h2>
            <p style="font-size:13px;color:#94a3b8;margin-bottom:28px">
              ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>

            ${overdue.length > 0 ? `
              <div style="margin-bottom:20px">
                <div style="font-size:11px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
                  Overdue — ${overdue.length} task${overdue.length > 1 ? 's' : ''}
                </div>
                <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                  ${overdue.map(t => taskRow(t, true)).join('')}
                </table>
              </div>
            ` : ''}

            ${dueToday.length > 0 ? `
              <div style="margin-bottom:20px">
                <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
                  Due today — ${dueToday.length} task${dueToday.length > 1 ? 's' : ''}
                </div>
                <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                  ${dueToday.map(t => taskRow(t, false)).join('')}
                </table>
              </div>
            ` : ''}

            ${upcoming.length > 0 ? `
              <div style="margin-bottom:20px">
                <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
                  Upcoming — ${upcoming.length} task${upcoming.length > 1 ? 's' : ''}
                </div>
                <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
                  ${upcoming.map(t => upcomingRow(t)).join('')}
                </table>
              </div>
            ` : ''}

            <a href="${process.env.FRONTEND_URL}/dashboard"
              style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:9px;text-decoration:none;font-size:14px;font-weight:600;margin-top:8px">
              View dashboard →
            </a>

            <p style="font-size:11px;color:#cbd5e1;margin-top:32px">
              MeetingDebt · You're receiving this because you have open commitments.
            </p>
          </div>
        `;

                await transporter.sendMail({
                    from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                    to: user.email,
                    subject: `Your tasks for today, ${name} — ${overdue.length > 0 ? `${overdue.length} overdue` : `${dueToday.length} due today`}`,
                    html,
                });

                console.log(`Nudge sent to ${user.email}`);
            } catch (userErr) {
                console.error(`Failed for user ${userId}:`, userErr.message);
            }
        }
    } catch (err) {
        console.error('Daily nudge error:', err.message);
    }
}

// Run every day at 9am
cron.schedule('0 9 * * *', sendDailyNudges, {
    timezone: 'America/New_York'
});

// Also expose a manual trigger endpoint for testing
app.get('/trigger-nudge', async (req, res) => {
    await sendDailyNudges();
    return res.json({ success: true, message: 'Nudge job triggered' });
});


app.listen(PORT, () => {
    console.log(`MeetingDebt backend running on port ${PORT}`);
});
