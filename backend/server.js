const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Test route — just to verify server works
app.get('/', (req, res) => {
    res.json({ message: 'MeetingDebt backend is running!' });
});

// Main route — paste transcript, get commitments back
app.post('/extract', async (req, res) => {
    try {
        const { transcript, meetingTitle, ownerEmail } = req.body;

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
                owner_email: ownerEmail || 'unknown@email.com'
            })
            .select()
            .single();

        if (meetingError) throw meetingError;

        // Step 4: Save commitments to Supabase
        const commitmentsToInsert = parsed.commitments.map(c => ({
            meeting_id: meeting.id,
            task: c.task,
            owner: c.owner,
            deadline: c.deadline,
            type: c.type,
            status: 'pending'
        }));

        const { data: commitments, error: commitError } = await supabase
            .from('commitments')
            .insert(commitmentsToInsert)
            .select();

        if (commitError) throw commitError;

        // Step 5: Return everything to frontend
        res.json({
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
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get commitments for a meeting
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
        const { data, error } = await supabase
            .from('commitments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark commitment as complete
app.patch('/commitments/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase
            .from('commitments')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`MeetingDebt backend running on port ${PORT}`);
});

