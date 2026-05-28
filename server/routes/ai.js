const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Card = require('../models/Card');
const { protect } = require('../middleware/authMiddleware');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// All routes require a valid JWT
router.use(protect);

// ── Shared helper: strip markdown fences & parse JSON with one retry ──────────
async function parseAIJson(text, retryFn) {
  const clean = (raw) =>
    raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(clean(text));
  } catch {
    // Retry once
    console.log('[AI] First parse failed — retrying AI call once');
    try {
      const retryText = await retryFn();
      return JSON.parse(clean(retryText));
    } catch (e) {
      throw new Error(`JSON parse failed after retry: ${e.message}`);
    }
  }
}

// ─── POST /api/ai/priority ────────────────────────────────────────────────────
router.post('/priority', async (req, res) => {
  const t0 = Date.now();
  console.log(`[AI] priority → model: ${MODEL}`);
  try {
    // Fetch all cards (exclude done so we focus on actionable tasks)
    const all = await Card.find({ user: req.user.id }).sort({ column: 1, order: 1 }).lean();

    if (!all || all.length === 0) {
      return res.status(200).json({ suggestions: [], empty: true });
    }

    // Limit to 10 tasks to avoid token limits — prioritise incomplete first
    const incomplete = all.filter((c) => c.column !== 'done');
    const done       = all.filter((c) => c.column === 'done');
    const cards      = [...incomplete, ...done].slice(0, 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskList = cards
      .map((c) => {
        let dueInfo = 'No due date';
        if (c.dueDate) {
          const due = new Date(c.dueDate);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.round((due - today) / 86400000);
          if (diffDays < 0)       dueInfo = `OVERDUE by ${Math.abs(diffDays)} day(s)`;
          else if (diffDays === 0) dueInfo = 'Due TODAY';
          else if (diffDays === 1) dueInfo = 'Due TOMORROW';
          else                     dueInfo = `Due in ${diffDays} days`;
        }
        const statusLabel = c.column === 'inprogress' ? 'In Progress' : c.column === 'done' ? 'Done' : 'To Do';
        return `- ID: ${c._id} | Title: "${c.title}" | Priority: ${c.priority} | Status: ${statusLabel} | Deadline: ${dueInfo}`;
      })
      .join('\n');

    const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `You are a productivity assistant. Today is ${todayStr}.

Analyze these tasks and rank them from MOST to LEAST urgent to complete. Apply these rules:
1. OVERDUE tasks always rank first — they are critical.
2. Tasks due today or tomorrow rank above everything else except overdue.
3. "In Progress" tasks rank higher than "To Do" tasks at the same priority level.
4. High priority + no deadline ranks above low/medium priority + far deadline.
5. "Done" tasks rank last.

Tasks:
${taskList}

Return ONLY a JSON array — no markdown, no extra text:
[
  {
    "_id": "task id",
    "title": "task title",
    "reason": "one sentence: state deadline urgency + why it's ranked here"
  }
]`;

    const makeCall = async () => {
      const c = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.3,
      });
      return (c.choices[0]?.message?.content ?? '').trim();
    };

    const text = await makeCall();
    let suggestions;
    try {
      suggestions = await parseAIJson(text, makeCall);
    } catch (parseErr) {
      console.error('[AI] priority parse error:', parseErr.message);
      return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' });
    }

    // Enrich with priority from DB
    const cardMap = new Map(all.map((c) => [String(c._id), c]));
    const enriched = suggestions.map((s) => ({
      ...s,
      priority: cardMap.get(String(s._id))?.priority ?? 'medium',
    }));

    console.log(`[AI] priority done in ${Date.now() - t0}ms — ${enriched.length} suggestions`);
    return res.json({ suggestions: enriched });
  } catch (err) {
    console.error('[AI] Priority route error:', err.message);
    return res.status(500).json({ message: 'AI suggestions unavailable. Please try again later.' });
  }
});

// ─── POST /api/ai/subtasks ────────────────────────────────────────────────────
router.post('/subtasks', async (req, res) => {
  const t0 = Date.now();
  console.log(`[AI] subtasks → model: ${MODEL}`);
  try {
    const { title, description } = req.body;
    const trimmedTitle = String(title ?? '').trim();

    // Input validation
    if (!trimmedTitle || trimmedTitle.length < 3) {
      return res.status(400).json({ message: 'Task title must be at least 3 characters.' });
    }

    const prompt = `You are a productivity assistant. Break down this task into exactly 5 actionable subtasks.

Task title: ${trimmedTitle}
Task description: ${String(description || '').trim() || 'No description provided'}

Rules for subtasks:
1. Return EXACTLY 5 subtasks — not 4, not 6.
2. Each subtask must be specific and actionable — avoid vague items like "research the topic" or "think about it".
3. Order the subtasks logically — what should be done first, second, etc.
4. Each subtask should be a concrete action starting with a verb (e.g. "Write", "Create", "Review", "Set up").

Return ONLY a JSON array — no markdown, no extra text:
[
  { "title": "First specific subtask" },
  { "title": "Second specific subtask" },
  { "title": "Third specific subtask" },
  { "title": "Fourth specific subtask" },
  { "title": "Fifth specific subtask" }
]`;

    const makeCall = async () => {
      const c = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.5,
      });
      return (c.choices[0]?.message?.content ?? '').trim();
    };

    const text = await makeCall();
    let suggestions;
    try {
      suggestions = await parseAIJson(text, makeCall);
    } catch (parseErr) {
      console.error('[AI] subtasks parse error:', parseErr.message);
      return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' });
    }

    console.log(`[AI] subtasks done in ${Date.now() - t0}ms — ${suggestions.length} subtasks`);
    return res.json({ suggestions });
  } catch (err) {
    console.error('[AI] Subtask route error:', err.message);
    return res.status(500).json({ message: 'AI suggestions unavailable. Please try again later.' });
  }
});

// ─── POST /api/ai/focus ──────────────────────────────────────────────────────
router.post('/focus', async (req, res) => {
  const t0 = Date.now();
  console.log(`[AI] focus → model: ${MODEL}`);
  try {
    // Fetch all incomplete cards
    const cards = await Card.find({
      user: req.user.id,
      column: { $ne: 'done' },
    }).sort({ column: 1, order: 1 }).lean();

    const count = cards?.length ?? 0;

    // If fewer than 3 incomplete tasks, return all of them directly (no AI needed)
    if (count === 0) {
      return res.status(200).json({ tooFew: true, count: 0 });
    }
    if (count < 3) {
      const today0 = new Date(); today0.setHours(0, 0, 0, 0);
      const enriched = cards.map((c) => ({
        _id:      c._id,
        title:    c.title,
        priority: c.priority,
        dueDate:  c.dueDate ?? null,
        reason:   'Selected because you have fewer than 3 incomplete tasks.',
      }));
      console.log(`[AI] focus skipped (only ${count} tasks) in ${Date.now() - t0}ms`);
      return res.json({ focus: enriched, fewTasks: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const taskList = cards
      .map((c) => {
        let dueInfo = 'No due date';
        if (c.dueDate) {
          const due = new Date(c.dueDate);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.round((due - today) / 86400000);
          if (diffDays < 0)       dueInfo = `OVERDUE by ${Math.abs(diffDays)} day(s) — critical!`;
          else if (diffDays === 0) dueInfo = 'Due TODAY — urgent!';
          else if (diffDays === 1) dueInfo = 'Due TOMORROW — act soon';
          else                     dueInfo = `Due in ${diffDays} days`;
        }
        const statusLabel = c.column === 'inprogress' ? 'In Progress' : 'To Do';
        return `- ID: ${c._id} | Title: "${c.title}" | Priority: ${c.priority} | Status: ${statusLabel} | Deadline: ${dueInfo}`;
      })
      .join('\n');

    const prompt = `You are a productivity assistant. Today is ${todayStr}.

Select the TOP 3 most important tasks the user should focus on TODAY. Apply these priority rules strictly:
1. OVERDUE tasks first — always. They are past their deadline.
2. Tasks due today or tomorrow come next.
3. High-priority tasks that are "In Progress" rank above tasks still in "To Do".
4. Never include tasks from the "done" column (they are already excluded).
5. If all tasks have no deadline, prefer high priority → in-progress → medium → low.

Tasks (all are incomplete):
${taskList}

Return ONLY a JSON array of exactly 3 items — no markdown, no extra text:
[
  {
    "_id": "task id",
    "title": "task title",
    "reason": "one sentence: why this should be focused on today"
  }
]`;

    const makeCall = async () => {
      const c = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.3,
      });
      return (c.choices[0]?.message?.content ?? '').trim();
    };

    const text = await makeCall();
    let focus;
    try {
      focus = await parseAIJson(text, makeCall);
    } catch (parseErr) {
      console.error('[AI] focus parse error:', parseErr.message);
      return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' });
    }

    // Enrich with priority + dueDate from DB
    const cardMap = new Map(cards.map((c) => [String(c._id), c]));
    const enriched = focus.map((f) => ({
      ...f,
      priority: cardMap.get(String(f._id))?.priority ?? 'medium',
      dueDate:  cardMap.get(String(f._id))?.dueDate  ?? null,
    }));

    console.log(`[AI] focus done in ${Date.now() - t0}ms — ${enriched.length} tasks selected`);
    return res.json({ focus: enriched });
  } catch (err) {
    console.error('[AI] Focus route error:', err.message);
    return res.status(500).json({ message: 'AI focus unavailable. Please try again later.' });
  }
});

module.exports = router;
