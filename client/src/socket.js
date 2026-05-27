import { io } from 'socket.io-client';

// Connect once — module-level singleton.
// autoConnect: false means the socket won't try to connect until
// Dashboard explicitly calls socket.connect() on mount, and
// socket.disconnect() on unmount. This avoids a stale connection
// lingering after the user logs out.
const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  // Socket.io will try WebSocket first, then fall back to polling.
  // NOTE: Vercel serverless functions don't support persistent WebSockets;
  // deploy the backend to a long-lived host (Render, Railway, fly.io)
  // for real-time sync to work in production.
  transports: ['websocket', 'polling'],
});

export default socket;
