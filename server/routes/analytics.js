const express = require('express');
const router  = express.Router();
const Card    = require('../models/Card');
const { protect } = require('../middleware/authMiddleware');

// All analytics routes require a valid JWT
router.use(protect);

// ─── GET /api/analytics ────────────────────────────────────────
// Returns productivity stats for the logged-in user.
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    now.setHours(0, 0, 0, 0);

    // Pull all cards for this user in one query
    const cards = await Card.find({ user: userId }).lean();

    const totalTasks     = cards.length;
    const completedTasks = cards.filter((c) => c.column === 'done').length;
    const pendingTasks   = cards.filter((c) => c.column !== 'done').length;
    const completionRate = totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

    // Tasks by priority
    const tasksByPriority = { low: 0, medium: 0, high: 0 };
    cards.forEach((c) => {
      if (tasksByPriority[c.priority] !== undefined) tasksByPriority[c.priority]++;
    });

    // Tasks by column
    const tasksByColumn = { todo: 0, inprogress: 0, done: 0 };
    cards.forEach((c) => {
      if (tasksByColumn[c.column] !== undefined) tasksByColumn[c.column]++;
    });

    // Overdue: dueDate is in the past and card is not done
    const overdueTasks = cards.filter((c) => {
      if (!c.dueDate || c.column === 'done') return false;
      return new Date(c.dueDate) < now;
    }).length;

    // Completed this week: completedAt within last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tasksCompletedThisWeek = cards.filter((c) =>
      c.completedAt && new Date(c.completedAt) >= sevenDaysAgo
    ).length;

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      tasksByPriority,
      tasksByColumn,
      overdueTasks,
      tasksCompletedThisWeek,
    });
  } catch (err) {
    console.error('[analytics]', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

module.exports = router;
