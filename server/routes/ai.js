const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Card = require('../models/Card');
const { protect } = require('../middleware/authMiddleware');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// All routes require a valid JWT
router.use(protect);

// ─── POST /api/ai/priority ────────────────────────────────────────────────────
// Fetches all cards for the logged-in user, sends them to Groq (Llama 3.3),
// and returns an ordered priority suggestion list.
router.post('/priority', async (req, res) => {
  try {
    // 1. Fetch all cards for the user
    const cards = await Card.find({ user: req.user.id }).sort({ column: 1, order: 1 });

    if (!cards || cards.length === 0) {
      return res.status(200).json({ suggestions: [], empty: true });
    }

    // 2. Build the task list string for the prompt
    const taskList = cards
      .map((c) => {
        const due = c.dueDate
          ? new Date(c.dueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'No due date';
        return `- ID: ${c._id} | Title: "${c.title}" | Priority: ${c.priority} | Status: ${c.column} | Due: ${due}`;
      })
      .join('\n');

    // 3. Build the prompt
    const prompt = `You are a productivity assistant. Analyze these tasks and suggest the optimal order to complete them based on deadline urgency, priority level, and current status.

Tasks:
${taskList}

Return ONLY a JSON array in this format, no extra text:
[
  {
    "_id": "task id",
    "title": "task title",
    "reason": "one short sentence why this should be done first"
  }
]
Order from most urgent to least urgent.`;

    // 4. Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });

    const text = (completion.choices[0]?.message?.content ?? '').trim();

    // 5. Strip markdown code fences if present (```json ... ```)
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // 6. Parse JSON
    let suggestions;
    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error('[AI] Failed to parse Groq response:', text);
      return res.status(500).json({
        message: 'AI returned an unexpected response format. Please try again.',
      });
    }

    // 7. Enrich with priority from DB (so client doesn't need a second fetch)
    const cardMap = new Map(cards.map((c) => [String(c._id), c]));
    const enriched = suggestions.map((s) => ({
      ...s,
      priority: cardMap.get(String(s._id))?.priority ?? 'medium',
    }));

    return res.json({ suggestions: enriched });
  } catch (err) {
    console.error('[AI] Priority route error:', err.message);
    return res.status(500).json({
      message: 'AI suggestions unavailable. Please try again later.',
    });
  }
});

// ─── POST /api/ai/subtasks ────────────────────────────────────────────────────
// Given a card's title and description, returns an array of suggested subtasks.
router.post('/subtasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const prompt = `You are a productivity assistant. Based on this task:
Title: ${String(title).trim()}
Description: ${String(description || '').trim() || 'No description provided'}

Suggest 4-6 practical, specific, and actionable subtasks to complete this task.
Return ONLY a JSON array in this format, no extra text:
[
  { "title": "subtask title" },
  { "title": "subtask title" }
]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });

    const text = (completion.choices[0]?.message?.content ?? '').trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let suggestions;
    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error('[AI] Failed to parse Groq subtask response:', text);
      return res.status(500).json({
        message: 'AI returned an unexpected response format. Please try again.',
      });
    }

    return res.json({ suggestions });
  } catch (err) {
    console.error('[AI] Subtask route error:', err.message);
    return res.status(500).json({
      message: 'AI suggestions unavailable. Please try again later.',
    });
  }
});

module.exports = router;
