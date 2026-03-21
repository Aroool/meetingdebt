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

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'MeetingDebt backend is running!' });
});

// Main route — paste transcript, get commitments back
app.post('/extract', async (req, res) => {
    try {
        const { transcript, meetingTitle, ownerEmail, userId, workspaceId } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        // Step 1: Send transcript to Claude
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: `You are analyzing a meeting transcript.
          
Extract all action items, decisions, and blockers.
For each item identify the real name of the person responsible by reading the conversation context.

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "commitments": [
    {
      "task": "description of what needs to be done",
      "owner": "name of person responsible",
      "deadline": "deadline mentioned or null",
      "type": "action_item or decision or blocker"
    }
  ]
}

Transcript:
${transcript}`
                }
            ]
        });

        // Step 2: Parse Claude's response
        const rawText = response.content[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        const parsed = JSON.parse(jsonMatch[0]);

        // Step 3: Save meeting to Supabase
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

        // Step 4: Fetch workspace members for auto-matching
        let members = [];
        if (workspaceId) {
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('user_id, name, email')
                .eq('workspace_id', workspaceId);
            members = memberData || [];
        }

        function matchMember(ownerName) {
            if (!ownerName || members.length === 0) return null;
            const lower = ownerName.toLowerCase().trim();

            // Try exact name match
            const exact = members.find(m =>
                m.name?.toLowerCase() === lower ||
                m.email?.toLowerCase().startsWith(lower)
            );
            if (exact) return exact.user_id;

            // Try first name only match
            const firstNameMatch = members.find(m => {
                const memberFirstName = m.name?.toLowerCase().split(' ')[0];
                const ownerFirstName = lower.split(' ')[0];
                return memberFirstName && memberFirstName === ownerFirstName;
            });
            if (firstNameMatch) return firstNameMatch.user_id;

            // Try email prefix match
            const emailMatch = members.find(m =>
                m.email?.toLowerCase().split('@')[0].includes(lower) ||
                lower.includes(m.email?.toLowerCase().split('@')[0])
            );
            return emailMatch?.user_id || null;
        }

        // Step 5: Save commitments with auto-assigned members
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

        // Step 6: Return everything to frontend
        return res.json({
            success: true,
            meeting,
            commitments
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
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
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get commitments for a specific meeting
app.get('/commitments/:meetingId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('commitments')
            .select('*')
            .eq('meeting_id', req.params.meetingId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all commitments
app.get('/commitments', async (req, res) => {
    try {
        const { userId, workspaceId } = req.query;
        let query = supabase
            .from('commitments')
            .select('*')
            .order('created_at', { ascending: false });

        if (workspaceId && userId) {
            // Member — workspace commitments assigned to them
            query = query.eq('workspace_id', workspaceId).eq('assigned_to', userId);
        } else if (workspaceId) {
            // Manager — all workspace commitments
            query = query.eq('workspace_id', workspaceId);
        } else if (userId) {
            // Solo — their own commitments
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update commitment status
app.patch('/commitments/:id', async (req, res) => {
    try {
        const { status, assigned_to } = req.body;
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
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// SendGrid transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});

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

// Manual nudge endpoint
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

        const meetingTitle = meeting?.title || 'Your meeting';

        await transporter.sendMail({
            from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
            to: email,
            subject: `Overdue: ${commitment.task}`,
            html: nudgeEmail(commitment, meetingTitle)
        });

        res.json({ success: true, message: 'Nudge sent!' });
    } catch (error) {
        console.error('Nudge error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Automated daily cron — 9am every day
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

        console.log(`Sending ${overdue.length} nudge emails...`);

        for (const commitment of overdue) {
            const { data: meeting } = await supabase
                .from('meetings')
                .select('title, owner_email')
                .eq('id', commitment.meeting_id)
                .single();

            // If assigned to a specific member, get their email
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

            await transporter.sendMail({
                from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                to: recipientEmail,
                subject: `Overdue commitment: ${commitment.task}`,
                html: nudgeEmail(commitment, meeting?.title || 'Your meeting')
            });

            console.log(`Nudge sent to ${recipientEmail} for: ${commitment.task}`);
        }
    } catch (err) {
        console.error('Cron error:', err);
    }
});

// Create a workspace
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

        res.json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join workspace by code
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

        // Check if already a member
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

        res.json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get workspaces for a user
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

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get workspace members
app.get('/workspaces/:workspaceId/members', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', req.params.workspaceId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Invite a member by email
app.post('/workspaces/:workspaceId/invite', async (req, res) => {
    try {
        const { email, invitedBy, workspaceName } = req.body;
        const { workspaceId } = req.params;

        const { data: invite, error } = await supabase
            .from('invites')
            .insert({
                workspace_id: workspaceId,
                email,
                invited_by: invitedBy
            })
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
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
            You've been invited to join a workspace
          </h2>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
            You've been invited to join <strong>${workspaceName}</strong> on MeetingDebt — where meeting commitments actually get done.
          </p>
          <a href="${inviteUrl}"
             style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
            Accept invitation →
          </a>
          <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Powered by MeetingDebt — making sure meeting commitments actually happen.
          </p>
        </div>
      `
        });

        res.json({ success: true, invite });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept invite
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

        res.json({ success: true, workspaceId: invite.workspace_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get workspace role for a user
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
        res.json({ role: data.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single workspace
app.get('/workspaces/:workspaceId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', req.params.workspaceId)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

        res.json({
            found: overdue?.length || 0,
            commitments: overdue?.map(c => ({ id: c.id, task: c.task, deadline: c.deadline }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Extract preview — returns commitments without saving meeting yet
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

        // Auto-match members
        let members = [];
        if (workspaceId) {
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('user_id, name, email')
                .eq('workspace_id', workspaceId);
            members = memberData || [];
        }

        function matchMember(ownerName) {
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
            return firstNameMatch?.user_id || null;
        }

        const commitments = parsed.commitments.map(c => ({
            ...c,
            assigned_to: matchMember(c.owner)
        }));

        // Save meeting now, return it with commitments (not saved yet)
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

// Save commitments after manager confirms assignments
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

        // Send assignment emails to members
        for (const commitment of data) {
            if (!commitment.assigned_to) continue;

            const { data: member } = await supabase
                .from('workspace_members')
                .select('email, name')
                .eq('user_id', commitment.assigned_to)
                .single();

            if (!member?.email) continue;

            await transporter.sendMail({
                from: `MeetingDebt <${process.env.SENDGRID_FROM_EMAIL}>`,
                to: member.email,
                subject: `You've been assigned a task from ${meeting.title}`,
                html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 16px; font-weight: 800; color: #0f172a;">Meeting<span style="color: #16a34a;">Debt</span></span>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
              You have a new task
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
            <a href="${process.env.FRONTEND_URL}/dashboard"
               style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              View your tasks →
            </a>
          </div>
        `
            });
        }

        return res.json({ success: true, commitments: data });

    } catch (error) {
        console.error('Save commitments error:', error);
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`MeetingDebt backend running on port ${PORT}`);
});
