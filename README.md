<h1 align="center">
  <br>
  🗂️ Kanban Task Manager
  <br>
</h1>

<p align="center">
  A full-stack Kanban board built with the MERN stack — drag-and-drop task management with JWT authentication, due dates, priority filtering, real-time search, and a polished dark mode.
</p>

<p align="center">
  <a href="https://kanbantodo-list.netlify.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Site-4f46e5?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo" />
  </a>
  &nbsp;
  <a href="https://github.com/Hemant-Mhalsekar/kanban-task-manager" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Source%20Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/status-live-22c55e?style=for-the-badge" alt="Status: Live" />
</p>

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register & login; token stored in memory (not localStorage) for XSS safety
- 📋 **Three-column Board** — To Do, In Progress, Done — all persisted per user
- 🖱️ **Drag & Drop** — Reorder cards within and across columns using `@hello-pangea/dnd`; positions survive page refresh
- 📅 **Due Dates** — Set due dates on cards; overdue cards get a 🔴 red border, due-today cards show 🟠 orange text
- 🏷️ **Priority Badges** — Color-coded priority labels: 🟢 Low · 🟡 Medium · 🔴 High
- 🔍 **Real-time Search** — Filter cards instantly by title or description across all columns
- 🎛️ **Priority Filter** — Dropdown to narrow the board to a single priority level; search + filter compose together
- ✏️ **Inline Editing** — Click a card title or due date to edit in place; `Enter` to save, `Escape` to cancel
- 🌙 **Dark Mode** — One-click toggle with a sun/moon icon; dark variants applied throughout
- 🗑️ **Delete Cards** — Hover a card to reveal the delete button
- 📱 **Responsive** — Works on mobile and desktop

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square&logo=axios&logoColor=white)
![hello-pangea/dnd](https://img.shields.io/badge/@hello--pangea%2Fdnd-drag%20%26%20drop-ff6b6b?style=flat-square)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![bcryptjs](https://img.shields.io/badge/bcryptjs-hashing-orange?style=flat-square)

### Deployment
![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)
![Vercel](https://img.shields.io/badge/Backend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

---

## 📸 Screenshots

> **Light Mode**

<!-- Replace with actual screenshot -->
![Light Mode Screenshot](./screenshots/light-mode.png)

> **Dark Mode**

<!-- Replace with actual screenshot -->
![Dark Mode Screenshot](./screenshots/dark-mode.png)

> **Search & Filter**

<!-- Replace with actual screenshot -->
![Search Filter Screenshot](./screenshots/search-filter.png)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **MongoDB Atlas** account (or a local MongoDB instance)

---

### 1. Clone the repository

```bash
git clone https://github.com/Hemant-Mhalsekar/kanban-task-manager.git
cd kanban-task-manager
```

---

### 2. Set up the server

```bash
cd server
npm install
```

Create a `server/.env` file (see [Environment Variables](#-environment-variables) below):

```bash
npm run dev   # starts on http://localhost:5000
```

---

### 3. Set up the client

```bash
cd ../client
npm install
```

Create a `client/.env` file (see [Environment Variables](#-environment-variables) below):

```bash
npm run dev   # starts on http://localhost:3000
```

---

### 4. Open in your browser

Navigate to [http://localhost:3000](http://localhost:3000), register an account, and start adding cards.

---

## 🔑 Environment Variables

### `server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/kanban_db?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

| Variable    | Description                                      |
|-------------|--------------------------------------------------|
| `PORT`      | Port the Express server listens on               |
| `MONGO_URI` | MongoDB Atlas connection string                  |
| `JWT_SECRET`| Secret key used to sign/verify JWT tokens        |
| `NODE_ENV`  | Set to `production` when deploying               |

---

### `client/.env`

```env
VITE_API_URL=http://localhost:5000
```

| Variable        | Description                                              |
|-----------------|----------------------------------------------------------|
| `VITE_API_URL`  | Base URL of the backend API (no trailing slash)          |

> In production, set this to your deployed backend URL (e.g. `https://your-api.vercel.app`).

---

## 🌐 Deployment

### Frontend → Netlify

1. Push your code to GitHub.
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
3. Select your repository and configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
4. Add the environment variable under **Site settings → Environment variables**:
   ```
   VITE_API_URL = https://your-api.vercel.app
   ```
5. Deploy. Netlify handles automatic re-deploys on every push to `main`.

---

### Backend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import the repository and configure:
   - **Root Directory:** `server`
   - **Framework Preset:** Other
3. Add environment variables under **Settings → Environment Variables**:
   ```
   MONGO_URI     = <your Atlas connection string>
   JWT_SECRET    = <strong random secret>
   NODE_ENV      = production
   ```
4. Ensure `server/vercel.json` is present for routing (already included in this repo).
5. Deploy.

---

## 📁 Project Structure

```
kanban-task-manager/
├── client/                     # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── api/                # Axios API wrappers
│       │   ├── apiClient.js    # Axios instance with base URL & auth header
│       │   └── cards.js        # CRUD operations for cards
│       ├── components/
│       │   ├── AddCardForm.jsx # New card form (title, description, priority, due date)
│       │   ├── Card.jsx        # Draggable card with inline edit, due date, priority
│       │   ├── Column.jsx      # Droppable column with add-card button
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   ├── AuthContext.jsx # JWT auth state & helpers
│       │   └── BoardContext.jsx
│       └── pages/
│           ├── Dashboard.jsx   # Main board — drag & drop, search, filter
│           ├── Login.jsx
│           └── Register.jsx
│
└── server/                     # Express backend
    ├── config/
    │   └── db.js               # Mongoose connection
    ├── middleware/
    │   └── authMiddleware.js   # JWT protect middleware
    ├── models/
    │   ├── User.js
    │   └── Card.js             # title, description, column, order, priority, dueDate
    ├── routes/
    │   ├── auth.js             # POST /api/auth/register, /api/auth/login
    │   └── cards.js            # CRUD /api/cards
    ├── index.js                # Express app entry point
    └── vercel.json             # Vercel routing config
```

---

## 📡 API Reference

All card endpoints require a valid `Authorization: Bearer <token>` header.

| Method   | Endpoint               | Auth | Description                          |
|----------|------------------------|------|--------------------------------------|
| `POST`   | `/api/auth/register`   | ❌   | Register a new user                  |
| `POST`   | `/api/auth/login`      | ❌   | Login and receive a JWT              |
| `GET`    | `/api/cards`           | ✅   | Fetch all cards for the logged-in user |
| `POST`   | `/api/cards`           | ✅   | Create a new card                    |
| `PUT`    | `/api/cards/:id`       | ✅   | Update a card (title, column, order, priority, dueDate) |
| `DELETE` | `/api/cards/:id`       | ✅   | Delete a card                        |

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Hemant-Mhalsekar">Hemant Mhalsekar</a>
</p>
