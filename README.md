# Kanban Task Manager

A full-stack Kanban board built with the MERN stack. Organize tasks across three columns — **To Do**, **In Progress**, and **Done** — with drag-and-drop reordering, inline editing, and per-user authentication.

![Kanban Board](https://img.shields.io/badge/status-live-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Live Demo

- **Frontend:** [https://your-app.vercel.app](https://your-app.vercel.app)
- **API:** [https://your-api.onrender.com](https://your-api.onrender.com)

> Replace these links with your actual deployment URLs after deploying.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS v4   |
| Routing   | React Router v6                   |
| Drag & Drop | @hello-pangea/dnd               |
| HTTP      | Axios                             |
| Backend   | Node.js, Express                  |
| Database  | MongoDB Atlas (Mongoose)          |
| Auth      | JWT (jsonwebtoken) + bcryptjs     |
| Deploy    | Vercel (client) + Render (server) |

---

## Features

- **Authentication** — Register and login with JWT. Token stored in memory (not localStorage) for XSS safety.
- **Kanban Board** — Three columns: To Do, In Progress, Done.
- **Drag & Drop** — Reorder cards within and across columns. Positions persist after page refresh.
- **Inline Editing** — Click a card title to edit it. Save with Enter or blur, cancel with Escape.
- **Add Cards** — Inline form per column with title, description, and priority.
- **Delete Cards** — Hover a card to reveal the delete button.
- **Priority Badges** — Color-coded: 🟢 Low, 🟡 Medium, 🔴 High.
- **Protected Routes** — Dashboard requires authentication; unauthenticated users are redirected.
- **Per-user Data** — Each user only sees and manages their own cards.

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/kanban-task-manager.git
cd kanban-task-manager
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/kanban_db
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

```bash
npm run dev       # starts on http://localhost:5000
```

### 3. Set up the client

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev       # starts on http://localhost:3000
```

### 4. Open in browser

Visit [http://localhost:3000](http://localhost:3000) → Register → Start adding cards.

---

## Deployment

### Backend → Render

1. Push your code to GitHub.
2. Create a new **Web Service** on [render.com](https://render.com).
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Add environment variables in the Render dashboard:
   ```
   MONGO_URI     = <your Atlas connection string>
   JWT_SECRET    = <strong random secret>
   NODE_ENV      = production
   PORT          = 10000
   ```

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com).
2. Set:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
3. Add environment variable:
   ```
   VITE_API_URL = https://your-api.onrender.com
   ```
4. Deploy.

---

## Project Structure

```
kanban-task-manager/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # Axios wrappers (apiClient.js, cards.js)
│       ├── components/      # Card, Column, AddCardForm, ProtectedRoute
│       ├── context/         # AuthContext, BoardContext
│       └── pages/           # Login, Register, Dashboard
└── server/                  # Express backend
    ├── config/              # db.js (Mongoose connection)
    ├── middleware/          # authMiddleware.js (JWT protect)
    ├── models/              # User.js, Card.js
    └── routes/              # auth.js, cards.js
```

---

## API Endpoints

| Method | Endpoint               | Auth | Description            |
|--------|------------------------|------|------------------------|
| POST   | /api/auth/register     | No   | Register new user      |
| POST   | /api/auth/login        | No   | Login, receive JWT     |
| GET    | /api/cards             | Yes  | Get all cards for user |
| POST   | /api/cards             | Yes  | Create a card          |
| PUT    | /api/cards/:id         | Yes  | Update a card          |
| DELETE | /api/cards/:id         | Yes  | Delete a card          |

---


## License

MIT
