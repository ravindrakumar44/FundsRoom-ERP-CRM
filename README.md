# Nexora — Mini ERP + CRM Operations Portal

> **NEXORA — Operations & Customer Management**  
> A production-grade, full-stack Mini ERP and CRM Operations Portal built for wholesale, industrial manufacturing, and high-velocity distribution enterprises.

---

## Overview

**NEXORA** is a multi-tenant-ready enterprise portal designed to unify **Customer Relationship Management (CRM)**, **Warehouse Inventory Control**, and **Delivery Challan ERP Workflows**. Engineered to eliminate inventory leakage, enforce atomic stock transactions, and provide real-time operational telemetry, NEXORA demonstrates clean architectural patterns, robust role-based access control (RBAC), and a polished modern SaaS user experience.

---

## Features

### 🔐 Authentication & Authorization (RBAC)
- **JWT-based session management** with secure token validation on protected Express API routes.
- **4 Distinct User Roles**:
  - `ADMIN`: Unrestricted global system access across all modules.
  - `SALES`: Customer management, CRM interaction logs, Challan creation and dispatch confirmation.
  - `WAREHOUSE`: Inventory catalog management, low-stock alerts, and manual inventory adjustments (`+IN` / `-OUT`).
  - `ACCOUNTS`: Read-only access to customer ledgers, financial summaries, and delivery challans.
- **Demo Persona Quick-Switcher**: 1-click login and on-the-fly role testing.
- **Password Hashing**: Secure password storage using `bcryptjs` with 10 salt rounds.

### 👥 Customer CRM Module
- Complete B2B customer directory with GSTIN registration, contact coordinates, and segment classification (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- Real-time search by name, business entity, mobile number, and email.
- Account status tracking (`LEAD`, `ACTIVE`, `INACTIVE`).
- **Interactive CRM Follow-Up Activity Log**: Chronological timeline of sales conversations and scheduled next-touch dates with automated reminders.
- **React Hook Form + Zod**: Strict client-side validation with inline error messaging.

### 📦 Product & Inventory Management
- Real-time inventory tracking with automated stock level classification:
  - `In Stock`: Current stock > Minimum stock threshold.
  - `Low Stock Alert`: Current stock $\le$ Minimum stock threshold.
  - `Out of Stock`: Current stock $\le 0$.
- Warehouse bin and storage rack indexing (e.g. `Bay A, Rack 02-B`).
- Filters for product category, stock health status, and location.
- Referential integrity protection preventing deletion of products tied to historical transactions.

### 🔄 Warehouse Stock Movements & Audit Ledger
- Immutable, append-only historical audit trail for every inventory change.
- Directional indicator badges for **Stock Inflow (`+IN`)** and **Stock Outflow (`-OUT`)**.
- Manual stock reconciliation modal with real-time stock balance preview.
- Audit trail capture: product SKU, quantity, reason/reference (PO number, Challan dispatch, return), timestamp, and authoring staff member.

### 📑 Delivery Challan ERP & Dispatch Engine
- Multi-item line builder with live inventory availability checks and dynamic total amount calculations.
- **Challan Snapshot Pattern**: Freezes product name, SKU, and unit rate snapshot at the time of creation, ensuring historical records remain immutable even if catalog prices change later.
- **Atomic Stock Business Logic**:
  - **Draft Challans**: Can be created and modified without locking or deducting warehouse stock.
  - **Challan Confirmation**: Executes an atomic Prisma database transaction that checks stock levels across all line items. If any product is insufficient, the entire operation rolls back with a detailed error message. If valid, stock is decremented and `OUT` stock movements are logged automatically.
  - **Challan Cancellation**: If a confirmed challan is cancelled, deducted inventory is automatically restored back into the warehouse, and `IN` stock restoration movements are logged.
- **Sequential Challan Numbering**: Auto-generates unique identifiers in the format `CH-YYYY-XXXXX` (e.g. `CH-2026-00001`).
- **Enterprise PDF & Printing**: In-browser print stylesheet formatted for industrial dispatch + client-side PDF generation using `jsPDF` and `jspdf-autotable`.

### 📊 Executive Operations Dashboard
- Live KPI cards: Total Customers, Active Leads, Total Inventory Units, Low Stock Alert Count, Out of Stock Count, and Total Confirmed Challans.
- **Interactive Recharts Telemetry**:
  - Area Chart: Monthly confirmed revenue velocity vs draft pipelines.
  - Donut Chart: Customer distribution across wholesale, distributor, and retail channels.
  - Bar Chart: Inventory inflow vs dispatched outflow velocity.
- **Urgent Action Panels**: Critical low-stock reorder warnings, today's pending follow-ups with 1-click CRM view, and recent delivery challans list.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS with custom enterprise design tokens
- **Routing**: React Router v7
- **Server State & Caching**: TanStack React Query v5
- **Form Handling**: React Hook Form
- **Schema Validation**: Zod v3
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **PDF Generation**: jsPDF & jspdf-autotable

### Backend
- **Runtime**: Node.js v20+ with TypeScript
- **Framework**: Express.js 4
- **ORM**: Prisma ORM v6
- **Database**: PostgreSQL
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod v3 (request body & query parameter parsing)
- **Security & Logging**: Helmet, CORS, Morgan

---

## Architecture

```mermaid
graph TB
  subgraph Client_Layer [Frontend Layer - React 18 + Vite]
    UI[NEXORA Single Page Application]
    AuthCtx[Auth Context & Role Persona Switcher]
    QueryClient[TanStack React Query Cache]
    PDFGen[jsPDF Dispatch Generator]
  end

  subgraph API_Gateway [Backend Layer - Node.js + Express]
    Router[Express REST Router]
    AuthGuard[JWT & RBAC Middleware]
    Validator[Zod Schema Validation]
    Services[Service Layer & Business Rules]
    ErrorHandler[Centralized Error Handling]
  end

  subgraph Persistence_Layer [Database Layer]
    PrismaClient[Prisma ORM Client]
    Postgres[(PostgreSQL Database)]
  end

  UI --> AuthCtx
  UI --> QueryClient
  UI --> Router
  Router --> AuthGuard
  AuthGuard --> Validator
  Validator --> Services
  Services --> PrismaClient
  PrismaClient --> Postgres
  Services --> ErrorHandler
```

---

## Database Schema

```mermaid
erDiagram
  User ||--o{ Challan : creates
  User ||--o{ StockMovement : records
  User ||--o{ FollowUp : logs
  Customer ||--o{ Challan : receives
  Customer ||--o{ FollowUp : has
  Product ||--o{ StockMovement : tracks
  Product ||--o{ ChallanItem : snapshots
  Challan ||--|{ ChallanItem : contains

  User {
    string id PK
    string name
    string email UK
    string passwordHash
    Role role
    DateTime createdAt
  }

  Customer {
    string id PK
    string customerName
    string mobile
    string email
    string businessName
    string gstNumber
    CustomerType customerType
    string address
    CustomerStatus status
    DateTime followUpDate
    string notes
  }

  Product {
    string id PK
    string productName
    string sku UK
    string category
    Decimal unitPrice
    int currentStock
    int minimumStock
    string warehouseLocation
  }

  StockMovement {
    string id PK
    string productId FK
    int quantity
    MovementType movementType
    string reason
    string createdBy FK
    DateTime createdAt
  }

  Challan {
    string id PK
    string challanNumber UK
    string customerId FK
    ChallanStatus status
    int totalQuantity
    Decimal totalAmount
    string notes
    string createdBy FK
    DateTime createdAt
  }

  ChallanItem {
    string id PK
    string challanId FK
    string productId FK
    string productNameSnapshot
    string skuSnapshot
    Decimal unitPriceSnapshot
    int quantity
  }

  FollowUp {
    string id PK
    string customerId FK
    string note
    DateTime followUpDate
    string createdBy FK
    DateTime createdAt
  }
```

---

## Project Structure

```
FundsRoom Task/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL Prisma schema with indexes
│   │   └── seed.ts             # Realistic Indian B2B demo seed dataset
│   ├── src/
│   │   ├── config/             # Environment parsing and Prisma client singleton
│   │   ├── controllers/        # REST route controllers
│   │   ├── middleware/         # JWT auth, RBAC authorization, error handling, Zod validation
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic, atomic transactions, snapshot computations
│   │   ├── types/              # TypeScript interface definitions
│   │   ├── utils/              # Challan numbering, standard JSON response wrappers
│   │   ├── validators/         # Zod schemas for all endpoints
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # Server bootstrap and DB connection test
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg         # Clean brand icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── challan/        # Printable challan layout and jsPDF generator
│   │   │   ├── common/         # Button, Badge, Card, Modal, Pagination, StatCard, EmptyState, ConfirmDialog
│   │   │   └── layout/         # Sidebar, Header with alerts, AppLayout wrapper
│   │   ├── context/            # AuthContext (RBAC) and ToastContext (Global notifications)
│   │   ├── pages/              # Login, Dashboard, Customers, CustomerDetail, Products, StockMovements, Challans, CreateChallan, ChallanDetail
│   │   ├── routes/             # AppRoutes with ProtectedRoute guards
│   │   ├── services/           # Axios/Fetch API client + mock engine fallback
│   │   ├── types/              # Frontend TypeScript definitions
│   │   ├── App.tsx             # Root Application Provider
│   │   ├── main.tsx            # DOM mount point
│   │   └── index.css           # Tailwind base styles and print utilities
│   ├── .env.example
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
│
├── postman/
│   ├── nexora_postman_collection.json   # Full API collection with sample payloads
│   └── nexora_postman_environment.json  # Environment variables for local testing
│
├── .github/workflows/
│   └── ci.yml                  # GitHub Actions continuous integration pipeline
├── docker-compose.yml          # Full multi-container Docker compose definition
├── render.yaml                 # Render infrastructure deployment blueprint
└── README.md                   # Complete documentation
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora_db?schema=public"
JWT_SECRET="nexora-super-secret-jwt-key-2026-production-ready"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: PostgreSQL 14+ running locally or a cloud database URL (e.g. Neon, Supabase, Render).

---

## Database Setup

1. Create a PostgreSQL database named `nexora_db`:
   ```sql
   CREATE DATABASE nexora_db;
   ```
2. Verify your `DATABASE_URL` in `backend/.env`.

---

## Prisma Migration

Generate the Prisma Client and apply migrations to your database:

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply Schema Migrations
npm run prisma:migrate
```

---

## Seed Data

Populate the database with realistic demo accounts, Indian B2B customers, product catalog items, historical challans, and stock movements:

```bash
npm run seed
```

---

## Running Backend

```bash
npm run dev:backend
```
- API Base: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

---

## Running Frontend

In a separate terminal:
```bash
npm run dev:frontend
```
- Web Application: `http://localhost:5173`

---

## API Documentation

All API responses follow standard JSON structures:

**Success Response (HTTP 200/201):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response (HTTP 400/401/403/404/500):**
```json
{
  "success": false,
  "error": "Insufficient stock for product MOT-IND-5HP-01. Available: 2, requested: 5.",
  "details": null
}
```

### Key Endpoints Summary

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user and receive JWT token |
| | `GET` | `/api/auth/me` | Get logged-in user profile & role |
| **Dashboard** | `GET` | `/api/dashboard` | Aggregated KPIs, charts, alerts, and recent feeds |
| **Customers** | `GET` | `/api/customers` | Paginated customer list with filters |
| | `POST` | `/api/customers` | Register new customer profile |
| | `GET` | `/api/customers/:id` | Get customer profile & challans history |
| | `PUT` | `/api/customers/:id` | Update customer coordinates / status |
| | `DELETE` | `/api/customers/:id` | Delete customer (Admin only) |
| | `GET` | `/api/customers/:id/follow-ups` | Get customer interaction history |
| | `POST` | `/api/customers/:id/follow-ups` | Log new CRM follow-up note & schedule |
| **Products** | `GET` | `/api/products` | Paginated product list with SKU search & category filter |
| | `GET` | `/api/products/low-stock` | Retrieve products below minimum reorder threshold |
| | `POST` | `/api/products` | Create catalog item |
| | `GET` | `/api/products/:id` | Get product details & recent stock logs |
| | `PUT` | `/api/products/:id` | Update product details & price |
| | `DELETE` | `/api/products/:id` | Delete product (Admin only) |
| **Stock** | `GET` | `/api/stock-movements` | Paginated audit log of IN/OUT movements |
| | `POST` | `/api/stock-movements` | Record manual stock adjustment |
| **Challans** | `GET` | `/api/challans` | List delivery challans with status filters |
| | `POST` | `/api/challans` | Create Challan (Draft or Confirm) |
| | `GET` | `/api/challans/:id` | Get Challan with snapshot items & customer info |
| | `PUT` | `/api/challans/:id` | Update draft challan line items |
| | `POST` | `/api/challans/:id/confirm` | Atomic stock validation & deduction |
| | `POST` | `/api/challans/:id/cancel` | Atomic cancellation & stock recovery |

---

## Postman Collection

A complete Postman collection and environment are provided in the `/postman` directory:
1. Open Postman.
2. Click **Import** $\rightarrow$ select `postman/nexora_postman_collection.json`.
3. Import the environment file `postman/nexora_postman_environment.json`.
4. Execute `1. Login (Admin)` — the test script will automatically set the `{{token}}` variable for all subsequent requests.

---

## Test Credentials

| Persona Role | Email Address | Password | Permissions & Scopes |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@nexora.demo` | `Admin@123` | Universal access across CRM, Inventory, Stock, ERP Challans & Users |
| **Sales Head** | `sales@nexora.demo` | `Sales@123` | Customer CRM, Follow-up notes, Create and Confirm Delivery Challans |
| **Warehouse Ops** | `warehouse@nexora.demo` | `Warehouse@123` | Product Catalog, Low Stock Alerts, Manual Stock Movements (`IN`/`OUT`) |
| **Accounts Lead** | `accounts@nexora.demo` | `Accounts@123` | Read-only access to Challans, Revenue telemetry & Customer accounts |

---

## Deployment

### Docker Deployment (Full Stack in 1 Command)
```bash
docker compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## Deployment Architecture

```mermaid
graph LR
  Vercel[Vercel Global CDN] -->|SPA Static Hosting| Browser[Client Browser]
  Browser -->|HTTPS REST API| Render[Render Web Service - Node.js Express]
  Render -->|Encrypted Connection Pool| Neon[(Neon Serverless PostgreSQL)]
```

### Deploying to Cloud:
1. **Database (Neon / Render Postgres)**:
   - Create a free PostgreSQL instance on [Neon.tech](https://neon.tech) or Render.
   - Copy the connection string to `DATABASE_URL`.
2. **Backend (Render Web Service)**:
   - Connect your GitHub repository.
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start`
   - Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.
3. **Frontend (Vercel)**:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.

---

## Assumptions

1. **Sequential Challan Numbering**: Challans follow the standard format `CH-YYYY-XXXXX` resets annually.
2. **Snapshot Integrity**: Once a delivery challan is confirmed, its snapshot unit price, SKU, and product name remain locked to guarantee auditing compliance.
3. **Currency & Locale**: All monetary values are presented in Indian Rupees (`₹` INR) with Indian comma formatting conventions.

---

## Known Limitations

1. **Bulk CSV Import**: Product catalog and customer lists are currently added via UI and API; batch CSV upload can be incorporated.
2. **Multi-Warehouse Allocation**: The portal supports warehouse bin location tags; multi-facility transfer workflows can be extended.

---

## Future Improvements

1. **Barcode / QR Scanning**: Instant challan dispatch barcode scanning for warehouse fulfillment staff.
2. **Automated WhatsApp / Email Alerts**: Trigger automated delivery notifications and PDF challan attachments via Twilio or SendGrid.
3. **GST E-Way Bill Integration**: Direct integration with the GST portal to generate E-Way bill numbers for shipments exceeding ₹50,000.
