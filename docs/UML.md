# PortTrack — UML Diagrams

Diagrams for **PortTrack: A Container Cargo Tracking System for Import & Export**.
Written in [Mermaid](https://mermaid.js.org/) syntax — GitHub renders them directly in this file.
The diagram sources are in [`docs/uml/`](uml/) (`.mmd` files) and can be exported to PNG/SVG
with any Mermaid renderer (e.g. mermaid.live) for use in reports and presentations.

---

## 1. Class Diagram

The five domain classes and their relationships, exactly as implemented in `models/`.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +Role role
        +Date createdAt
        +Date updatedAt
    }

    class Ship {
        +ObjectId _id
        +String name
        +String imo
        +String company
        +Date arrivalDate
        +Date departureDate
        +String dockNumber
        +ShipStatus status
    }

    class Shipment {
        +ObjectId _id
        +String trackingId
        +ShipmentType type
        +String containerId
        +String goodsType
        +String origin
        +String destination
        +ObjectId ship
        +ObjectId owner
    }

    class Container {
        +ObjectId _id
        +String containerId
        +ObjectId shipment
        +Number weight
        +String goodsType
        +ContainerStatus currentStatus
        +StatusEntry[] statusHistory
        +updateStatus(status)
    }

    class StatusEntry {
        +ContainerStatus status
        +Date date
    }

    class Notification {
        +ObjectId _id
        +ObjectId user
        +String title
        +String message
        +String trackingId
        +String containerId
        +Boolean isRead
        +markRead()
    }

    User "1" --> "0..*" Shipment : owns
    User "1" --> "0..*" Notification : receives
    Ship "1" --> "0..*" Shipment : carries
    Shipment "1" *-- "1" Container : has
    Container "1" *-- "1..*" StatusEntry : records
```

**Enumerations**

| Enum | Values |
|---|---|
| `User.role` | `admin` (Port Officer), `importer`, `exporter` |
| `Ship.status` | `Expected`, `Arrived`, `Departed` |
| `Shipment.type` | `import`, `export` |
| `Container.currentStatus` | `Booked`, `Loaded`, `In Transit`, `Arrived at Port`, `Customs Clearance`, `Delivered` |

---

## 2. Sequence Diagram — Container Status Update & Notification

What happens when a Port Officer (Admin) updates a container's status: the container's
history is appended, a notification is created for the shipment owner, and the owner
sees it on their next dashboard visit (the UI polls every 30 seconds).

```mermaid
sequenceDiagram
    actor Officer as Port Officer (Admin)
    participant UI as React Frontend
    participant API as Express API
    participant DB as MongoDB
    actor Owner as Importer / Exporter

    Officer->>UI: Select new status, click "Update status"
    UI->>API: PUT /api/containers/:id/status (JWT)
    API->>API: Verify JWT + admin role
    API->>DB: Load container + linked shipment
    DB-->>API: Container, Shipment (owner)
    API->>DB: Set currentStatus, push statusHistory entry
    API->>DB: Create Notification for shipment owner
    API-->>UI: 200 OK (updated container)
    UI-->>Officer: Toast "MSKU-… is now In Transit"

    Owner->>UI: Open dashboard / wait for poll
    UI->>API: GET /api/notifications (JWT)
    API->>DB: Find notifications for user
    DB-->>API: Notifications + unread count
    API-->>UI: Notification list
    UI-->>Owner: Unread badge + notification card
    Owner->>UI: Click "Track"
    UI->>API: GET /api/track/:trackingId
    API-->>UI: Shipment + container + status history
    UI-->>Owner: 6-step tracking timeline
```

---

## 3. Sequence Diagram — Shipment Registration

```mermaid
sequenceDiagram
    actor User as Importer / Exporter / Admin
    participant UI as React Frontend
    participant API as Express API
    participant DB as MongoDB

    User->>UI: Fill "New shipment" form, submit
    UI->>API: POST /api/shipments (JWT)
    API->>API: Validate fields, generate tracking ID (PT-YYYY-XXXX)
    API->>DB: Create Shipment (owner = current user, or chosen owner for admin)
    API->>DB: Create Container (status Booked + first history entry)
    DB-->>API: Shipment + Container
    API-->>UI: 201 Created
    UI-->>User: Toast with tracking ID, list refreshes
```

---

## 4. Use Case Overview

```mermaid
flowchart LR
    subgraph Actors
        A[Port Officer / Admin]
        I[Importer]
        E[Exporter]
        V[Public Visitor]
    end

    A --> UC1[Manage ships & docks]
    A --> UC2[Update container status]
    A --> UC3[Manage users & reset passwords]
    A --> UC4[View operations dashboard]

    I --> UC5[Register import shipment]
    E --> UC6[Register export shipment]
    I --> UC7[Track own containers]
    E --> UC7
    I --> UC8[Receive status notifications]
    E --> UC8

    V --> UC9[Track by tracking ID - no login]
    V --> UC10[Register importer/exporter account]
```
