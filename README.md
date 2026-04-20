# Expense Tracker

A minimal, production-quality expense tracking application.

**Live Demo:** https://expense-tracker-seven-phi-91.vercel.app/
**Backend API:** https://expense-tracker-2f21.onrender.com

> **Note:** The backend is hosted on Render's free tier and spins down after 15 minutes of inactivity. The first request may take 30–50 seconds to wake up the service.

---

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
│   Next.js Frontend      │  HTTP  │   Rust / Axum Backend    │  SQL   │  Supabase        │
│   (Vercel)              │◄──────►│   (Render)               │◄──────►│  (Postgres)      │
│                         │        │                          │        │                  │
│  App Router + Tailwind  │        │  REST API                │        │  Session Pooler  │
└─────────────────────────┘        └──────────────────────────┘        └──────────────────┘
```

Frontend and backend are separate services connected via HTTP using `NEXT_PUBLIC_API_URL`. There is no Next.js API layer — the Rust backend is the API. The database is a managed Postgres instance on Supabase, accessed through the **Session Pooler** for IPv4 compatibility with hosting providers.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind | Fast DX, SSR when needed, deployed zero-config on Vercel |
| Backend | Rust + Axum + sqlx | Type-safe, memory-safe, async-first |
| Database | Postgres (Supabase) | Managed, free tier, built-in connection pooling |
| Hosting | Vercel (frontend) + Render (backend) | Free tiers, GitHub auto-deploy on push |

---

## Money Handling

All monetary amounts are stored as **integers in cents** (`BIGINT`), never as floating-point numbers.

**Why:** Floating-point arithmetic is unsuitable for money. `0.1 + 0.2` in IEEE 754 is `0.30000000000000004`, not `0.30`. Storing cents as integers eliminates rounding errors entirely. The frontend converts between dollars (user input) and cents (wire format) using integer arithmetic: `Math.round(dollars * 100)`.

---

## Idempotency

**The problem:** A user clicks "Submit" twice, or a network retry fires after a timeout. Without protection, two identical expenses are created.

**The solution:**
1. The frontend generates a UUID (`crypto.randomUUID()`) when the form is filled out — **once per submission intent**, not per keystroke.
2. This UUID is sent as an `Idempotency-Key` HTTP header on every `POST /expenses` request.
3. The backend checks whether that key already exists in the database before inserting.
4. The database enforces `UNIQUE(idempotency_key)` as a hard constraint — the last line of defense against race conditions.
5. If two concurrent requests arrive with the same key, the unique constraint violation is caught and the existing record is returned.
6. The frontend only generates a **new** UUID after a successful submission. On failure, it keeps the same key so retries are safe.

Result: no matter how many times the same request is retried, exactly one expense is created.

---

## Repository Structure

```
expense-tracker/                    (monorepo root)
├── backend-expense-tracker/        Rust/Axum backend
│   ├── src/
│   ├── Cargo.toml
│   └── .env.example
├── expense-tracker/                Next.js frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── schema.sql                      Database schema
└── README.md
```

---

## Local Setup

### Prerequisites
- Rust (stable, 1.75+) with Cargo
- Node.js 20+ with npm
- A Supabase project (free tier works)

### 1. Database

Open the Supabase SQL editor and run `schema.sql` from the project root. This creates the `expenses` table, indexes, and the `UNIQUE(idempotency_key)` constraint.

### 2. Backend

```bash
cd backend-expense-tracker
cp .env.example .env
# Edit .env and set DATABASE_URL to your Supabase Session Pooler URL:
#   postgresql://postgres.xxxxx:PASSWORD@aws-0-xxx.pooler.supabase.com:5432/postgres
cargo run
# Server starts on http://localhost:8080
```

> **Important:** Use the **Session Pooler** URL (`pooler.supabase.com`, port `5432`), not the direct connection. The direct connection is IPv6-only and will fail on most hosts. The Transaction Pooler (port `6543`) also works but breaks sqlx's prepared statements.

### 3. Frontend

```bash
cd expense-tracker
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev
# App opens on http://localhost:3000
```

---

## Production Deployment

Both services auto-deploy on every push to `main`.

### Backend (Render)

1. Create a new **Web Service** on Render and connect the GitHub repo.
2. Configure:
   - **Root Directory:** `backend-expense-tracker`
   - **Runtime:** Rust
   - **Build Command:** `cargo build --release`
   - **Start Command:** `./target/release/expense-tracker-backend`
3. Set environment variables:
   ```
   DATABASE_URL=<Supabase Session Pooler URL>
   RUST_LOG=expense_tracker_backend=info
   ```

Render auto-assigns `PORT` — the backend reads it from the environment and binds to `0.0.0.0`.

> First build takes 10–15 minutes (Rust compile). Subsequent builds are cached and faster.

### Frontend (Vercel)

1. Import the GitHub repo into Vercel.
2. Configure:
   - **Root Directory:** `expense-tracker`
   - **Framework Preset:** Next.js (auto-detected)
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://expense-tracker-2f21.onrender.com
   ```
4. Deploy.

### Auto-Deploy on Push

Every push to `main` triggers:
- Vercel rebuilds the frontend (~2 min)
- Render rebuilds the backend (~10 min for Rust)

Optional build filters can be configured to skip rebuilds when only the other service's files changed.

### CORS Note

The backend currently allows all origins (`Access-Control-Allow-Origin: *`) for simplicity. For stricter production use, restrict this to the Vercel domain by setting `CORS_ORIGIN` and updating `routes.rs`.

---

## Trade-offs (Intentional Simplifications)

| Decision | Rationale |
|---|---|
| No authentication | Out of scope — would add JWT/session management complexity without changing the core correctness story |
| Client-side category list | Predefined list in the frontend; backend filtering by category is fully supported |
| No database migrations tooling | `schema.sql` is run manually; production would use `sqlx migrate` |
| `ANY` CORS origin | Acceptable for demo / free-tier deployment; should be restricted to the Vercel domain in production |
| `sqlx::query_as()` non-macro | Avoids requiring `DATABASE_URL` at compile time; trade-off is no compile-time SQL verification |
| Free-tier hosting | Render free tier spins down after 15 min idle; acceptable for a demo, not for real users |

---

## What's Missing (With More Time)

- **Authentication** — user accounts, expense ownership
- **Edit / Delete** — update or remove individual expenses
- **Pagination** — cursor-based pagination for large datasets
- **Optimistic UI updates** — add to local list before server confirms, roll back on failure
- **Migrations** — `sqlx migrate` with versioned migration files
- **Input sanitisation** — category validation against an allowed list
- **Backend integration tests** — hit a real test database using `sqlx::test`
- **Rate limiting** — per-IP limits on `POST /expenses`
- **Production CORS** — restrict `Access-Control-Allow-Origin` to the frontend domain
- **OpenAPI spec** — auto-generated documentation from the Axum routes
- **Paid hosting tier** — avoid cold-start latency on the backend
