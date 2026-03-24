const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
app.post('/extract-preview', async (req, res) => {
    try {
        const { transcript, meetingTitle, ownerEmail, userId, workspaceId } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Transcript required' });

        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `You are analyzing a meeting transcript.
Extract all action items, decisions, and blockers.
For each item identify the real name of the person responsible.
Return ONLY valid JSON, nothing else:
{
  "commitments": [
    {
      "task": "description",
      "owner": "name of person",
      "deadline": "deadline or null",
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
app.post('/save-commitments', async (req, res) => {
    try {
        const { meeting, commitments, userId, workspaceId } = req.body;

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

        return res.json({ success: true, commitments: data });

    } catch (error) {
        console.error('Save commitments error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Legacy extract route
app.post('/extract', async (req, res) => {
    try {
        const { transcript, meetingTitle, ownerEmail, userId, workspaceId } = req.body;
        if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `You are analyzing a meeting transcript.
Extract all action items, decisions, and blockers.
Return ONLY valid JSON:
{
  "commitments": [
    { "task": "...", "owner": "...", "deadline": "... or null", "type": "action_item or decision or blocker" }
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

        let members = [];
        if (workspaceId) {
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('user_id, name, email')
                .eq('workspace_id', workspaceId);
            members = memberData || [];
        }

        const matchMember = buildMatcher(members);
        const commitmentsToInsert = parsed.commitments.map(c => ({
            meeting_id: meeting.id,
            task: c.task,
            owner: c.owner,
            deadline: c.deadline,
            type: c.type,
            status: 'pending',
            user_id: userId || null,
            workspace_id: workspaceId || null,
            assigned_to: matchMember(c.owner)
        }));

        const { data: commitments, error: commitError } = await supabase
            .from('commitments')
            .insert(commitmentsToInsert)
            .select();

        if (commitError) throw commitError;
        return res.json({ success: true, meeting, commitments });

    } catch (error) {
        console.error('Extract error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Get all meetings
app.get('/meetings', async (req, res) => {
    try {
        const { userId, workspaceId } = req.query;
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
app.get('/commitments/:meetingId', async (req, res) => {
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
app.get('/commitments', async (req, res) => {
    try {
        const { userId, workspaceId } = req.query;
        let query = supabase
            .from('commitments')
            .select('*, meetings(title)')
            .order('created_at', { ascending: false });

        if (workspaceId && userId) {
            query = query.eq('workspace_id', workspaceId).eq('assigned_to', userId);
        } else if (workspaceId) {
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
app.patch('/commitments/:id', async (req, res) => {
    try {
        const { status, assigned_to, userId } = req.body;
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
app.post('/nudge/:commitmentId', async (req, res) => {
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
            const { data: meeting } = await supabase
                .from('meetings')
                .select('title, owner_email')
                .eq('id', commitment.meeting_id)
                .single();

            let recipientEmail = meeting?.owner_email;
            if (commitment.assigned_to) {
                const { data: member } = await supabase
                    .from('workspace_members')
                    .select('email')
                    .eq('user_id', commitment.assigned_to)
                    .single();
                if (member?.email) recipientEmail = member.email;
            }

            if (!recipientEmail || recipientEmail === 'unknown@email.com') continue;

            try {
                await transporter.sendMail({
                    from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                    to: recipientEmail,
                    subject: `Overdue: ${commitment.task}`,
                    html: nudgeEmail(commitment, meeting?.title || 'Your meeting')
                });
                console.log(`Nudge sent to ${recipientEmail}`);
            } catch (emailErr) {
                console.error('Nudge email failed:', emailErr.message);
            }
        }
    } catch (err) {
        console.error('Cron error:', err);
    }
});

// ─── WORKSPACES ───────────────────────────────────────────────────────────────

app.post('/workspaces', async (req, res) => {
    try {
        const { name, userId, userEmail, userName } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

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

app.post('/workspaces/join-by-code', async (req, res) => {
    try {
        const { code, userId, userEmail, userName } = req.body;

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

app.get('/workspaces/:workspaceId/members', async (req, res) => {
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

app.post('/workspaces/:workspaceId/invite', async (req, res) => {
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

        return res.json({ success: true, invite });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/invites/:token/accept', async (req, res) => {
    try {
        const { userId, userEmail, userName } = req.body;

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

app.get('/workspaces/:workspaceId/role', async (req, res) => {
    try {
        const { userId } = req.query;
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

app.get('/workspaces/:workspaceId', async (req, res) => {
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
app.get('/test-nudges', async (req, res) => {
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
app.patch('/notifications/read-all', async (req, res) => {
    try {
        const { userId } = req.body;
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
app.patch('/notifications/:id/read', async (req, res) => {
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
app.get('/notifications', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.json([]);

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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`MeetingDebt backend running on port ${PORT}`);
});
