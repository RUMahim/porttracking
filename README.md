# PortTrack — Container Cargo Tracking System for Import & Export

A MERN stack web application to manage ships, register import/export shipments, and track containers through six steps: **Booked → Loaded → In Transit → Arrived at Port → Customs Clearance → Delivered**.

## Features

- Role-based login: **Admin (Port Officer)**, **Importer**, **Exporter** (JWT auth)
- Landing page with live public tracking search (no login needed)
- Ship management: arrival/departure dates, dock number, status (admin)
- Shipment registration with auto-generated tracking IDs (`PT-2026-XXXX`)
- Container tracking with a 6-step status stepper and full status history
- Public tracking search by tracking ID or container ID (no login needed)
- Dashboard: import vs export donut chart, container pipeline chart, recent shipments, arriving ships
- Notifications: owners are notified when an admin updates a container status (badge polls every 30s)
- User management (admin): list accounts, reset passwords, delete trader accounts
- Importers/exporters only see their own cargo
- Professional UI: Inter font, SVG logo, Lucide icons, topbar with quick-track search, modal forms, toasts, skeleton loaders

## Project structure

```
porttracking/
├── server.js          # Local dev entry point (Express API, port 5000)
├── app.js             # Express app (shared by local server + Vercel serverless)
├── api/index.js       # Vercel serverless entry point for /api/*
├── vercel.json        # Vercel build + rewrites config
├── models/            # Mongoose models: User, Ships, Shipment, Container, Notification
├── routes/            # auth, ships, shipments, containers, track, notifications, dashboard, users
├── middleware/auth.js # JWT protect + role authorize
├── seed.js            # Demo data seeder
├── tests/             # Jest + Supertest API tests (npm test)
├── docs/              # UML diagrams, technical documentation, Postman collection
└── frontend/          # React (Vite) app, port 5173
```

## Setup

### Backend

```bash
npm install
cp .env.example .env   # then fill in MONGODB_URI and JWT_SECRET
npm run seed           # optional: load demo data
npm run dev            # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev            # http://localhost:5173
```

## Demo accounts (after seeding)

| Role     | Email                    | Password |
|----------|--------------------------|----------|
| Admin    | admin@porttrack.demo     | demo123  |
| Importer | importer@porttrack.demo  | demo123  |
| Exporter | exporter@porttrack.demo  | demo123  |

Demo tracking ID for public search: `PT-2026-1042`

## API overview

| Method | Endpoint                        | Access  | Description                          |
|--------|---------------------------------|---------|--------------------------------------|
| POST   | /api/auth/register              | Public  | Register importer/exporter/both           |
| POST   | /api/auth/login                 | Public  | Login, returns JWT                   |
| GET    | /api/auth/me                    | Logged in | Current user                       |
| PUT    | /api/auth/change-password       | Logged in | Change own password                |
| GET    | /api/ships                      | Logged in | List ships                         |
| POST   | /api/ships                      | Admin   | Add ship                             |
| PUT    | /api/ships/:id                  | Admin   | Update ship                          |
| DELETE | /api/ships/:id                  | Admin   | Delete ship (blocked if linked)      |
| GET    | /api/shipments                  | Logged in | List shipments (own cargo for non-admin) |
| POST   | /api/shipments                  | Logged in | Register shipment + container (admin: registered owner or manual trader name/email)      |
| PUT    | /api/shipments/:id              | Logged in | Update shipment                    |
| DELETE | /api/shipments/:id              | Logged in | Delete shipment + its container    |
| GET    | /api/containers                 | Logged in | List containers                    |
| PUT    | /api/containers/:id/status      | Admin   | Update container status (notifies owner) |
| GET    | /api/track/:query               | Public  | Track by tracking ID / container ID  |
| GET    | /api/notifications              | Logged in | My notifications                   |
| PUT    | /api/notifications/read-all     | Logged in | Mark all as read                   |
| GET    | /api/dashboard                  | Logged in | Summary counts                     |
| GET    | /api/users                      | Admin   | List trader accounts (importer/exporter/both) (`?all=1` for all) |
| PUT    | /api/users/:id/password         | Admin   | Reset a user's password              |
| DELETE | /api/users/:id                  | Admin   | Delete trader account     |

## Documentation

- [Technical documentation](docs/TECHNICAL.md) — architecture, data model, full API reference
- [UML diagrams](docs/UML.md) — class, sequence and use-case diagrams (PNG exports in `docs/uml/`)
- [Postman collection](docs/PortTrack.postman_collection.json) — import into Postman to test the API
- Tests: `npm test` (Jest + Supertest, in-memory MongoDB)

## Deploy on Vercel (full stack, one project)

The repo is ready for a single Vercel project: the React frontend is built from `frontend/` and the Express API runs as a serverless function from `api/index.js` (see `vercel.json`).

1. Import this GitHub repo in Vercel (root directory: repo root).
2. Add environment variables in the Vercel project settings:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random secret
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` so Vercel can connect.
4. Deploy. Frontend and API share one domain; the frontend calls `/api` on the same origin.

To load demo data into the production database, run `npm run seed` locally with the same `MONGODB_URI` in your `.env`.

## Security note

Never commit your real `.env` file. Copy `.env.example` to `.env` locally and keep `MONGODB_URI` and `JWT_SECRET` private.
