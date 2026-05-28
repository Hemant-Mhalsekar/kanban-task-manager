const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const { protect } = require('../middleware/authMiddleware');

// All routes below require a valid JWT
router.use(protect);

// ─── GET /api/cards ────────────────────────────────────────────
// Returns all cards belonging to the logged-in user,
// sorted by column then order position.
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find({ user: req.user.id }).sort({ column: 1, order: 1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cards' });
  }
});

// ─── POST /api/cards ───────────────────────────────────────────
// Creates a new card for the logged-in user.
router.post('/', async (req, res) => {
  const { title, description, column, order, priority, dueDate, labels } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const card = await Card.create({
      title: title.trim(),
      description: description || '',
      column: column || 'todo',
      order: order ?? 0,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: Array.isArray(labels) ? labels : [],
      user: req.user.id,
    });

    res.status(201).json(card);

    // Broadcast to all connected clients
    req.app.get('io')?.emit('card:created', card);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Failed to create card' });
  }
});

// ─── PUT /api/cards/:id ────────────────────────────────────────
// Updates a card. Only the owner can update it.
router.put('/:id', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found or not authorized' });
    }

    const { title, description, column, order, priority, dueDate, labels } = req.body;

    if (title !== undefined) card.title = title.trim();
    if (description !== undefined) card.description = description;
    if (column !== undefined) {
      card.column = column;
      // Stamp completedAt when first moved to done; clear when moved away
      if (column === 'done' && !card.completedAt) {
        card.completedAt = new Date();
      } else if (column !== 'done') {
        card.completedAt = null;
      }
    }
    if (order !== undefined) card.order = order;
    if (priority !== undefined) card.priority = priority;
    if (dueDate !== undefined) card.dueDate = dueDate || null;
    if (labels !== undefined) card.labels = Array.isArray(labels) ? labels : [];

    const updated = await card.save();
    res.json(updated);

    // Broadcast to all connected clients
    req.app.get('io')?.emit('card:updated', updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid card ID' });
    }
    res.status(500).json({ message: 'Failed to update card' });
  }
});

// ─── DELETE /api/cards/:id ─────────────────────────────────────
// Deletes a card. Only the owner can delete it.
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!card) {
      return res.status(404).json({ message: 'Card not found or not authorized' });
    }

    res.json({ message: 'Card deleted successfully', id: card._id });

    // Broadcast to all connected clients
    req.app.get('io')?.emit('card:deleted', { id: card._id });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid card ID' });
    }
    res.status(500).json({ message: 'Failed to delete card' });
  }
});

// ─── POST /api/cards/:id/subtasks ─────────────────────────────────────────────
// Adds a new subtask to a card.
router.post('/:id/subtasks', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user.id });
    if (!card) return res.status(404).json({ message: 'Card not found or not authorized' });

    const { title } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Subtask title is required' });
    }

    card.subtasks.push({ title: String(title).trim() });
    const updated = await card.save();
    res.json(updated);
    req.app.get('io')?.emit('card:updated', updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid card ID' });
    res.status(500).json({ message: 'Failed to add subtask' });
  }
});

// ─── PATCH /api/cards/:id/subtasks/:subtaskId ─────────────────────────────────
// Toggles a subtask's completed status.
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user.id });
    if (!card) return res.status(404).json({ message: 'Card not found or not authorized' });

    const subtask = card.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    subtask.completed = !subtask.completed;
    const updated = await card.save();
    res.json(updated);
    req.app.get('io')?.emit('card:updated', updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: 'Failed to toggle subtask' });
  }
});

// ─── DELETE /api/cards/:id/subtasks/:subtaskId ────────────────────────────────
// Removes a subtask from a card.
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user.id });
    if (!card) return res.status(404).json({ message: 'Card not found or not authorized' });

    const subtask = card.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    subtask.deleteOne();
    const updated = await card.save();
    res.json(updated);
    req.app.get('io')?.emit('card:updated', updated);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
    res.status(500).json({ message: 'Failed to delete subtask' });
  }
});

module.exports = router;
