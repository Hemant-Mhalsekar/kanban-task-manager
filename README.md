# TaskPilot

AI-powered Kanban task manager built on the MERN stack, with real-time collaboration, Groq-powered AI assistance, and a productivity analytics dashboard.

**Live demo:** [kanbantodo-list.netlify.app](https://kanbantodo-list.netlify.app)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [Screenshots](#screenshots)
8. [License](#license)

---

## Features

**Authentication**
- JWT-based registration and login
- Protected routes with token persistence via localStorage

**Kanban Board**
- Three-column board: To Do, In Progress, Done
- Drag and drop cards within and across columns via `@hello-pangea/dnd`
- Real-time sync across browser sessions via Socket.io

**Card Management**
- Create cards with title, description, priority, due date, and labels
- Inline title editing directly on the board
- Full card modal with detailed editing, subtask management, and column control
- Priority levels (low, medium, high) with colour-coded left border and dot indicator
- Due date highlighting: overdue in red, due today in amber
- Label tagging with multi-label filter on the board
- Quick "Mark as Done" action on card hover
- Subtask list with individual completion toggling and progress bar preview on the card

**AI Features (Groq — Llama 3.3 70B)**
- Priority Suggestions: ranks all incomplete tasks by urgency, factoring in deadline proximity, current status, and priority level
- Subtask Suggestions: generates exactly five specific, ordered, actionable subtasks from a card's title and description
- Daily Focus Mode: selects the top three tasks to work on today based on overdue status, due date, and priority; includes a configurable countdown timer session

**Search and Filtering**
- Real-time title search with debounce
- Priority filter dropdown
- Multi-label filter with checkbox dropdown

**Analytics**
- Completion rate donut chart
- Tasks by priority bar chart
- Tasks by column bar chart
- Stat cards: total tasks, completed, pending, overdue, completed this week

**Design**
- Permanent dark theme (no toggle)
- Responsive layout

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Utility-first styling |
| `@hello-pangea/dnd` | Drag and drop |
| Recharts | Analytics charts |
| Axios | HTTP client |
| Socket.io-client | Real-time updates |
| Lucide React | Icon library |

### Backend
| Package | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | WebSocket server |
| Mongoose | MongoDB ODM |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| dotenv | Environment config |
| cors | Cross-origin requests |

### Database
- MongoDB Atlas (hosted)

### AI
- Groq API — `llama-3.3-70b-versatile` model

---

## Project Structure

```
kanban-task-manager/
├── client/                     # React frontend (Vite)
│   ├── public/
│   │   └── _redirects          # Netlify SPA routing
│   └── src/
│       ├── api/
│       │   ├── apiClient.js    # Axios instance with base URL
│       │   ├── ai.js           # AI endpoint calls
│       │   ├── analytics.js    # Analytics endpoint calls
│       │   └── cards.js        # Card and subtask API calls
│       ├── components/
│       │   ├── AddCardForm.jsx
│       │   ├── AIPriorityPanel.jsx
│       │   ├── Card.jsx
│       │   ├── CardModal.jsx
│       │   ├── Column.jsx
│       │   ├── FocusMode.jsx
│       │   └── ProtectedRoute.jsx
│       ├── constants/
│       │   └── labels.js       # Label definitions and styles
│       ├── context/
│       │   └── AuthContext.jsx # JWT auth state
│       ├── pages/
│       │   ├── Analytics.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── socket.js           # Socket.io client instance
│       ├── index.css           # Global styles
│       └── main.jsx
│
└── server/                     # Express backend
    ├── config/
    │   └── db.js               # MongoDB connection
    ├── middleware/
    │   └── authMiddleware.js   # JWT verification
    ├── models/
    │   ├── Card.js
    │   └── User.js
    ├── routes/
    │   ├── ai.js               # /api/ai/*
    │   ├── analytics.js        # /api/analytics
    │   ├── auth.js             # /api/auth/*
    │   └── cards.js            # /api/cards/*
    └── index.js                # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A MongoDB Atlas cluster (or local MongoDB instance)
- A [Groq API key](https://console.groq.com)

### Clone the Repository

```bash
git clone https://github.com/Hemant-Mhalsekar/kanban-task-manager.git
cd kanban-task-manager
```

### Install Dependencies

Install server and client dependencies separately:

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Environment Variables

**Server** — create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on. Defaults to `5000`. |
| `MONGO_URI` | MongoDB connection string. Get this from MongoDB Atlas under Connect > Drivers. |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens. Use a long, random string. |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com). Required for all AI features. |
| `NODE_ENV` | Set to `development` locally, `production` in deployment. |

**Client** — create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Express server, without a trailing slash. In production, set this to your deployed backend URL. |

### Run Locally

Open two terminals:

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client
cd client
npm run dev
```

The client runs on `http://localhost:3000` (or the port Vite assigns). The server runs on `http://localhost:5000`.

---

## Deployment

### Frontend — Netlify

1. Connect the `client/` directory to a Netlify site.
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url`

The `client/public/_redirects` file contains `/* /index.html 200` to handle client-side routing.

### Backend — Vercel (or a persistent host)

A `vercel.json` is included in `server/`. Deploy the `server/` directory as a standalone Vercel project and set the environment variables in the Vercel dashboard.

**Note on Socket.io:** Vercel's serverless runtime does not support persistent WebSocket connections. The REST API and AI features will work on Vercel, but real-time board sync requires a server with a persistent process — for example, Render, Railway, fly.io, or a VPS. If you deploy to a serverless host, clients will fall back to polling via the REST API on page load, but live cross-session updates will not function.

---

## API Reference

All routes except `POST /api/auth/register` and `POST /api/auth/login` require a `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account. Body: `{ name, email, password }` |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT. Body: `{ email, password }` |

### Cards

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/cards` | Fetch all cards belonging to the authenticated user |
| `POST` | `/api/cards` | Create a new card |
| `PUT` | `/api/cards/:id` | Update a card's fields (title, description, column, priority, dueDate, labels, order) |
| `DELETE` | `/api/cards/:id` | Delete a card |
| `POST` | `/api/cards/:id/subtasks` | Add a subtask to a card |
| `PATCH` | `/api/cards/:id/subtasks/:subtaskId` | Toggle a subtask's completed status |
| `DELETE` | `/api/cards/:id/subtasks/:subtaskId` | Remove a subtask from a card |

### Analytics

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/analytics` | Returns aggregated stats: total, completed, pending, overdue, completed this week, tasks by priority, tasks by column |

### AI

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ai/priority` | Returns all incomplete tasks ranked by urgency using Groq |
| `POST` | `/api/ai/subtasks` | Returns five suggested subtasks for a given card title and description. Body: `{ title, description }` |
| `POST` | `/api/ai/focus` | Returns the top three tasks recommended for the current day based on deadline and priority |

### Real-time Events (Socket.io)

The server emits the following events to all connected clients after a card mutation:

| Event | Payload | Trigger |
|---|---|---|
| `card:created` | Full card object | Card created via `POST /api/cards` |
| `card:updated` | Full card object | Card updated via `PUT` or subtask routes |
| `card:deleted` | `{ id }` | Card deleted via `DELETE /api/cards/:id` |

---

## Screenshots

Add screenshots to a `screenshots/` directory at the project root and reference them here.

```markdown
![Dashboard](screenshots/dashboard.png)
![Card Modal](screenshots/card-modal.png)
![Focus Mode](screenshots/focus-mode.png)
![Analytics](screenshots/analytics.png)
```

To capture screenshots from the live demo: [kanbantodo-list.netlify.app](https://kanbantodo-list.netlify.app)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
