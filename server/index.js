require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');

// Connect to MongoDB
connectDB();

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────
// NOTE: Vercel's serverless runtime does not support persistent
// WebSocket connections. Run this server on a long-lived host
// (Render, Railway, fly.io, a VPS) to use real-time sync.
const io = new Server(server, {
  cors: {
    origin: [
      'https://kanbantodo-list.netlify.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[socket] client connected — id: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected — id: ${socket.id}`);
  });
});

// Attach io to the app so routes can access it via req.app.get('io')
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    'https://kanbantodo-list.netlify.app',
    'http://localhost:3000',
  ],
  credentials: true,
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
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
