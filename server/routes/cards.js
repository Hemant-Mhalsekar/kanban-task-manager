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
  const { title, description, column, order, priority } = req.body;

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
      user: req.user.id,
    });

    res.status(201).json(card);
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

    const { title, description, column, order, priority } = req.body;

    if (title !== undefined) card.title = title.trim();
    if (description !== undefined) card.description = description;
    if (column !== undefined) card.column = column;
    if (order !== undefined) card.order = order;
    if (priority !== undefined) card.priority = priority;

    const updated = await card.save();
    res.json(updated);
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
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid card ID' });
    }
    res.status(500).json({ message: 'Failed to delete card' });
  }
});

module.exports = router;
