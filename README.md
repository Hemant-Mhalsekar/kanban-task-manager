# MERN Kanban Task Manager

A full-stack Kanban board application built with the MERN stack.

## Project Structure

```
kanban-task-manager/
├── client/               # React (Vite + Tailwind CSS) frontend
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context (global state)
│   │   └── pages/        # Page-level components
│   └── vite.config.js
└── server/               # Node.js + Express backend
    ├── config/           # MongoDB connection
    ├── middleware/        # Error handler, async wrapper
    ├── models/            # Mongoose models
    ├── routes/            # Express route handlers
    └── index.js
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Backend

```bash
cd server
cp .env.example .env   # edit MONGO_URI
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

- Frontend: http://localhost:3000  
- Backend:  http://localhost:5000  
- Health check: GET http://localhost:5000/

## Tech Stack

| Layer    | Technology                       |
|----------|----------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4  |
| HTTP     | Axios                            |
| Backend  | Node.js, Express 4               |
| Database | MongoDB, Mongoose 8              |
