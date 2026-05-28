const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    column: {
      type: String,
      enum: {
        values: ['todo', 'inprogress', 'done'],
        message: 'Column must be todo, inprogress, or done',
      },
      default: 'todo',
    },
    order: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    labels: {
      type: [String],
      enum: {
        values: ['Bug', 'Feature', 'Design', 'Research', 'Urgent', 'Review'],
        message: 'Invalid label value',
      },
      default: [],
    },
    subtasks: {
      type: [
        {
          _id:       { type: mongoose.Schema.Types.ObjectId, auto: true },
          title:     { type: String, required: [true, 'Subtask title is required'], trim: true },
          completed: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Card must belong to a user'],
    },
  },
  { timestamps: true }
);

// Index for efficient per-user queries sorted by column + order
cardSchema.index({ user: 1, column: 1, order: 1 });

module.exports = mongoose.model('Card', cardSchema);
