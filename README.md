# PortTrack — Container Cargo Tracking System for Import & Export

A MERN stack web application to manage ships, register import/export shipments, and track containers through six steps: **Booked → Loaded → In Transit → Arrived at Port → Customs Clearance → Delivered**.

## Features

- Role-based login: **Admin (Port Officer)**, **Importer**, **Exporter** (JWT auth)
- Ship management: arrival/departure dates, dock number, status (admin)
- Shipment registration with auto-generated tracking IDs (`PT-2026-XXXX`)
- Container tracking with a 6-step status stepper and full status history
- Public tracking search by tracking ID or container ID (no login needed)
- Dashboard: import vs export counts, container status breakdown, recent shipments
- Notifications: owners are notified when an admin updates a container status
- Importers/exporters only see their own cargo

## Project structure

```
porttracking/
├── server.js          # Backend entry point (Express API, port 5000)
├── models/            # Mongoose models: User, Ships, Shipment, Container, Notification
├── routes/            # auth, ships, shipments, containers, track, notifications, dashboard, users
├── middleware/auth.js # JWT protect + role authorize
├── seed.js            # Demo data seeder
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
| POST   | /api/auth/register              | Public  | Register importer/exporter           |
| POST   | /api/auth/login                 | Public  | Login, returns JWT                   |
| GET    | /api/auth/me                    | Logged in | Current user                       |
| GET    | /api/ships                      | Logged in | List ships                         |
| POST   | /api/ships                      | Admin   | Add ship                             |
| PUT    | /api/ships/:id                  | Admin   | Update ship                          |
| DELETE | /api/ships/:id                  | Admin   | Delete ship (blocked if linked)      |
| GET    | /api/shipments                  | Logged in | List shipments (own cargo for non-admin) |
| POST   | /api/shipments                  | Logged in | Register shipment + container      |
| PUT    | /api/shipments/:id              | Logged in | Update shipment                    |
| DELETE | /api/shipments/:id              | Logged in | Delete shipment + its container    |
| GET    | /api/containers                 | Logged in | List containers                    |
| PUT    | /api/containers/:id/status      | Admin   | Update container status (notifies owner) |
| GET    | /api/track/:query               | Public  | Track by tracking ID / container ID  |
| GET    | /api/notifications              | Logged in | My notifications                   |
| PUT    | /api/notifications/read-all     | Logged in | Mark all as read                   |
| GET    | /api/dashboard                  | Logged in | Summary counts                     |
| GET    | /api/users                      | Admin   | List importer/exporter accounts      |

## Security note

Never commit your real `.env` file. Copy `.env.example` to `.env` locally and keep `MONGODB_URI` and `JWT_SECRET` private.
