# PortTrack — Technical Documentation

**PortTrack: A Container Cargo Tracking System for Import & Export**

Live: https://porttracking.vercel.app · Repository: https://github.com/RUMahim/porttracking

---

## 1. System Overview

PortTrack digitises port cargo operations for three user groups:

| Role | Who | What they do |
|---|---|---|
| **Admin (Port Officer)** | Port authority staff | Manage ships & docks, update container statuses, manage user accounts, view the full operations dashboard |
| **Importer** | Trading companies bringing goods in | Register import shipments, track their containers, receive status notifications |
| **Exporter** | Trading companies sending goods out | Register export shipments, track their containers, receive status notifications |
| **Public visitor** | Anyone with a tracking ID | Track a container's live status without an account |

Every container moves through six stages:

**Booked → Loaded → In Transit → Arrived at Port → Customs Clearance → Delivered**

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (one project)                 │
│                                                          │
│  ┌────────────────────┐      ┌───────────────────────┐  │
│  │  React SPA (Vite)  │ ───► │  Express API          │  │
│  │  frontend/         │ /api │  api/index.js         │  │
│  │  (static build)    │      │  (serverless function)│  │
│  └────────────────────┘      └──────────┬────────────┘  │
└─────────────────────────────────────────┼───────────────┘
                                          │ Mongoose (cached connection)
                                  ┌───────▼────────┐
                                  │ MongoDB Atlas  │
                                  │ (M0 cluster)   │
                                  └────────────────┘
```

- **Frontend** — React 19 + React Router + Axios, built by Vite into static files.
  Charts use Recharts; icons use Lucide. In production it calls `/api` on the same origin.
- **Backend** — Node.js + Express 5. `app.js` holds the Express app shared by the local
  dev server (`server.js`, port 5000) and the Vercel serverless entry (`api/index.js`).
  The Mongoose connection is cached across serverless invocations.
- **Database** — MongoDB Atlas (M0 free cluster, Singapore region) via Mongoose 9.
- **Auth** — JWT (30-day expiry) signed with `JWT_SECRET`; passwords hashed with bcrypt.
  Role middleware: `protect` (any logged-in user) and `authorize('admin')` (port officers only).

## 3. Data Model

See the [class diagram](UML.md#1-class-diagram). Five collections:

| Collection | Purpose | Key fields |
|---|---|---|
| `users` | Accounts | name, email (unique), password (bcrypt, hidden by default), role |
| `ships` | Vessels | name, imo (unique), company, arrivalDate, departureDate, dockNumber, status |
| `shipments` | Import/export bookings | trackingId (unique, `PT-YYYY-XXXX`), type, containerId, goodsType, origin, destination, ship → Ship, owner → User |
| `containers` | Physical containers | containerId (unique), shipment → Shipment, weight, goodsType, currentStatus, statusHistory[] |
| `notifications` | Owner alerts | user → User, title, message, trackingId, containerId, isRead |

**Rules enforced by the API**

- Importers/exporters only ever see their own shipments, containers, dashboard counts and notifications (owner filter on every query).
- Creating a shipment automatically creates its container at status `Booked` with the first history entry.
- Only admins can create/update/delete ships, create containers, change container status, and manage users.
- A container status change appends to `statusHistory` and creates a notification for the shipment's owner.
- Deleting a shipment also deletes its container. A ship that still has shipments cannot be deleted.
- Passwords must be at least 6 characters. Admins can reset any user's password from the Users page.

## 4. API Reference

Base URL: `https://porttracking.vercel.app/api` (production) · `http://localhost:5000/api` (local)

All protected endpoints need the header `Authorization: Bearer <JWT>`.
A ready-to-import Postman collection is in [`PortTrack.postman_collection.json`](PortTrack.postman_collection.json).

### Auth

| Method | Endpoint | Access | Body / Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password, role }` — role: importer/exporter/both. Returns user + JWT |
| POST | `/auth/login` | Public | `{ email, password }` — returns user + JWT |
| GET | `/auth/me` | Logged in | Current user |
| PUT | `/auth/change-password` | Logged in | `{ currentPassword, newPassword }` — change own password (min 6 chars) |

### Ships

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/ships` | Logged in | All ships, newest first |
| GET | `/ships/:id` | Logged in | One ship |
| POST | `/ships` | Admin | `{ name, imo, company, arrivalDate, departureDate, dockNumber, status }` |
| PUT | `/ships/:id` | Admin | Update ship |
| DELETE | `/ships/:id` | Admin | 400 if shipments still reference the ship |

### Shipments

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/shipments?search=&type=` | Logged in | Own cargo for non-admins; search matches tracking ID / container / goods |
| GET | `/shipments/:id` | Logged in | One shipment (owner-scoped) |
| POST | `/shipments` | Logged in | Creates shipment **and** its container. Admin may pass `owner`. Auto tracking ID `PT-YYYY-XXXX` |
| PUT | `/shipments/:id` | Logged in | Update (owner-scoped; only admin can reassign owner) |
| DELETE | `/shipments/:id` | Logged in | Deletes shipment + its container |
| GET | `/shipments/track/:trackingId` | Public | Legacy public tracking |

### Containers

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/containers?status=` | Logged in | Own containers for non-admins |
| GET | `/containers/:id` | Logged in | One container with shipment + owner |
| POST | `/containers` | Admin | `{ containerId, shipment, weight, goodsType }` |
| PUT / PATCH | `/containers/:id/status` | Admin | `{ status }` — appends history, notifies owner |
| PUT | `/containers/:id` | Admin | Update container |
| DELETE | `/containers/:id` | Admin | Delete container |

### Tracking, notifications, dashboard, users

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| GET | `/track/:query` | Public | Track by tracking ID **or** container ID → shipment + container + history |
| GET | `/notifications` | Logged in | `{ notifications, unreadCount }` |
| PUT | `/notifications/:id/read` | Logged in | Mark one as read |
| PUT | `/notifications/read-all` | Logged in | Mark all as read |
| GET | `/dashboard` | Logged in | Totals, import/export counts, status breakdown, recent shipments, arriving ships (role-filtered) |
| GET | `/users` | Admin | Importer/exporter accounts (owner picker) |
| GET | `/users?all=1` | Admin | All accounts incl. admins (Users page) |
| PUT | `/users/:id/password` | Admin | `{ password }` — reset a user's password (min 6 chars) |
| DELETE | `/users/:id` | Admin | Delete trader account (admins and self are protected) |

### Error format

```json
{ "message": "Human-readable error" }
```

`400` validation · `401` not logged in / bad credentials · `403` wrong role ·
`404` not found · `409` duplicate unique value (IMO, container ID, tracking ID, email).

## 5. Frontend Pages

| Route | Page | Who |
|---|---|---|
| `/welcome` | Landing page with live tracking search | Public |
| `/track-public` | Public tracking | Public |
| `/login`, `/register` | Auth (demo one-click logins on the login page) | Public |
| `/` | Operations dashboard — stat cards, import/export donut, container pipeline chart, recent shipments, arriving ships | Logged in |
| `/ships` | Ship register (table + add/edit modal) | Logged in (admin edits) |
| `/shipments` | Shipment register (search, type filter, table + create modal) | Logged in |
| `/containers` | Container cards with 6-step stepper; admins update status here | Logged in (admin edits) |
| `/track` | In-app tracking | Logged in |
| `/notifications` | Status-change notifications with unread badge | Logged in |
| `/users` | Account management + password reset | Admin only |

The notification badge polls the API every 30 seconds, so status changes appear
without a manual refresh (near-real-time; true push via WebSockets is future work).

## 6. Local Development

```bash
# Backend (port 5000)
npm install
cp .env.example .env        # set MONGODB_URI and JWT_SECRET
npm run seed                # optional demo data
npm run dev

# Frontend (port 5173)
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm run dev
```

## 7. Testing

```bash
npm test                    # Jest + Supertest against an in-memory MongoDB
```

The suite in `tests/api.test.js` covers auth (register/login/roles), ship CRUD
permissions, shipment + container creation, status updates with notifications,
public tracking, dashboard counts, and admin user management.

## 8. Deployment (Vercel + Atlas)

1. Import the GitHub repo into Vercel (root directory = repo root).
2. Set environment variables: `MONGODB_URI`, `JWT_SECRET`.
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (Vercel egress IPs vary).
4. Deploy — `vercel.json` builds `frontend/` and routes `/api/*` to the serverless function.

## 9. Future Work (from the proposal)

- GPS / IoT container telemetry for true live location
- Multi-port support (Chattogram, Mongla, Payra) with per-port dashboards
- Email/SMS notifications in addition to in-app alerts
- WebSocket push for instant status updates
- Document uploads (bill of lading, customs papers) per shipment
