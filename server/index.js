require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: 'https://kanbantodo-list.netlify.app',
  credentials: true
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Auth
app.use('/api/auth', require('./routes/auth'));

// Cards
app.use('/api/cards', require('./routes/cards'));

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
