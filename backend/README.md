# Supreme Cotton — Ledger & Accounting Software

A full-stack accounting and ledger management system built as a Progressive Web App (PWA) for textile trading operations.

## Structure
- `/frontend` — React 18 + TypeScript + Vite PWA app
- `/backend` — Node.js + Express.js API server with Prisma
- `/database` — Prisma schema and seed script

## Requirements
- Node.js 18+
- Docker & Docker Compose

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Run with Docker Compose:
   ```bash
   docker compose up --build
   ```
3. Backend: `http://localhost:5000`
4. Frontend: `http://localhost:4173`

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Notes
- Database migrations and seed data are configured in `/database`.
- The system uses JWT auth, Prisma ORM, and a basic PWA shell.
- This scaffold includes the core architecture for authentication, chart of accounts, parties, purchases, sales, vouchers, and reports modules.
