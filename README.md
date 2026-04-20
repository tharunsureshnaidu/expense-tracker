# Expense Tracker

A minimal, production-quality expense tracking application.

---

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   Next.js Frontend      │  HTTP  │   Rust / Axum Backend    │
│   (Vercel)              │◄──────►│   (Railway / Render)     │
│                         │        │                          │
│  App Router + Tailwind  │        │  REST API  ──► Supabase  │
└─────────────────────────┘        └──────────────────────────┘
```

Frontend and backend are **separate services**. The frontend calls the Rust backend over HTTP using `NEXT_PUBLIC_API_URL`. There is no Next.js API layer — the backend is the API.

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

## Local Setup

### Prerequisites
- Rust (stable, 1.75+) with Cargo
- Node.js 20+ with npm
- A Supabase project (free tier works)

### 1. Database

Open the Supabase SQL editor and run `schema.sql` from the project root.

### 2. Backend

```bash
cd backend-expense-tracker
cp .env.example .env
# Fill in DATABASE_URL from your Supabase connection string
cargo run
# Server starts on http://localhost:8080
```

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

## Production Setup

### Backend (Railway or Render)

1. Connect your repository to Railway or Render.
2. Set the root directory to `backend-expense-tracker`.
3. Set environment variables:
   ```
   DATABASE_URL=<Supabase connection string>
   PORT=8080
   RUST_LOG=expense_tracker_backend=info
   ```
4. The service auto-builds with `cargo build --release` and runs the binary.

### Frontend (Vercel)

1. Connect your repository to Vercel.
2. Set the root directory to `expense-tracker`.
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
4. Deploy — Vercel handles the rest.

### CORS Note
The backend currently allows all origins (`Access-Control-Allow-Origin: *`). For production, restrict this to your Vercel domain by setting `CORS_ORIGIN` in the backend environment and updating `routes.rs`.

---

## Trade-offs (Intentional Simplifications)

| Decision | Rationale |
|---|---|
| No authentication | Out of scope — would add JWT/session management complexity without changing the core correctness story |
| Client-side filtering for categories | The dropdown uses a predefined list; backend filtering by category is fully supported for future use |
| No database migrations tooling | For simplicity, `schema.sql` is run manually; production would use `sqlx migrate` or a migration service |
| `ANY` CORS origin in dev | Acceptable for local development; should be restricted in production |
| `sqlx::query_as()` non-macro | Avoids requiring `DATABASE_URL` at compile time; trade-off is no compile-time SQL verification |

---

## What's Missing (With More Time)

- **Authentication** — user accounts, expense ownership
- **Edit / Delete** — update or remove individual expenses
- **Pagination** — cursor-based pagination for large datasets
- **Optimistic UI updates** — add to local list before server confirms, roll back on failure
- **Migrations** — `sqlx migrate` with versioned migration files
- **Input sanitisation** — category validation against an allowed list
- **Backend tests** — integration tests with a test database using `sqlx::test`
- **Rate limiting** — per-IP limits on `POST /expenses`
- **Production CORS** — restrict `Access-Control-Allow-Origin` to the frontend domain
- **OpenAPI spec** — auto-generated documentation from the Axum routes
