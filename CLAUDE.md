# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack web app for posting messages to multiple Telegram channels simultaneously from one interface. Users log in, connect their Telegram bots/channels, compose a message, select channels, and send in one click.

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Vite, React Router v6, Axios
- **Backend:** Node.js, Express.js
- **Database:** SQLite via `better-sqlite3`
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **Telegram:** Native `fetch` to `https://api.telegram.org/bot<token>/sendMessage`

## CI/CD

Use **GitHub Actions** (preferred) or GitLab CI. Pipelines should: install deps → lint → test → build.

## Commands

```bash
# Install all dependencies (root + server + client)
npm run install:all

# Run both server (port 3001) and client (port 5173) concurrently
npm run dev

# Server only
npm run dev --prefix server

# Client only
npm run dev --prefix client

# Build client for production
npm run build --prefix client
```

## Architecture

```
project-root/
├── client/              # Vite + React SPA
│   └── src/
│       ├── pages/       # Login.jsx, Dashboard.jsx
│       └── services/api.js  # All axios calls, attaches JWT from localStorage
├── server/
│   ├── index.js         # Express app entry, CORS, mounts routes
│   ├── database.js      # SQLite setup, runs CREATE TABLE IF NOT EXISTS on startup
│   ├── middleware/auth.js   # JWT verification, sets req.userId
│   └── routes/
│       ├── auth.js      # POST /register, POST /login
│       ├── channels.js  # GET/POST/DELETE /channels (bot_token never sent to client)
│       └── posts.js     # POST /send (calls Telegram API), GET /history
└── database/            # SQLite .db file lives here (gitignored)
```

**Request flow:** Vite dev server proxies `/api/*` → `localhost:3001`. In production, serve the built client from Express or a CDN with the API on a separate origin.

**Telegram requirements:** The bot must be made an admin of the channel with "Post Messages" permission before it can send. Users provide the bot token when connecting a channel — it is stored in the DB but never returned to the client.

## Naming Conventions

- `camelCase` — variables and functions
- `PascalCase` — React components
- `kebab-case` — file names

## Environment

Copy `.env.example` to `server/.env` and set `JWT_SECRET`.
