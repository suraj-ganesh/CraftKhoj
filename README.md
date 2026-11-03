# CraftKhoj — Provenance Marketplace

Next.js 15 (App Router) + Prisma/PostgreSQL + Tailwind. A provenance-based marketplace for Nepali heritage crafts.

## Commands

```bash
pnpm dev          # next dev, honors PORT (default 3000)
pnpm build        # prisma generate && next build
pnpm start        # next start
pnpm typecheck    # tsc --noEmit
pnpm db:seed      # seed the database (tsx prisma/seed.ts)
```

## Stack

- **Framework:** Next.js 15 App Router, React 19
- **Database:** PostgreSQL via Prisma ORM (`prisma/schema.prisma`), hosted on Supabase
- **Auth:** HS256 JWT session cookie (`ck_session`), bcrypt password hashing
- **Styling:** Tailwind CSS v4, neo-brutalist design system
- **State:** React Context for the cart; server components read Prisma directly

## Architecture

- `src/app/` — App Router routes. Public market pages plus four role-guarded workzones (`/buyer`, `/studio`, `/verifier`, `/admin`), enforced by `middleware.ts` off the session cookie.
- `src/lib/` — `prisma.ts` (singleton client), `auth.ts` (session tokens), `session.ts` (server-side session reads), `api.ts` (response helpers + `requireUser`), `products.ts` (catalog query builder), `algorithms.ts` (trust score, recommendations, risk score, demand forecasting), `format.ts`.
- `src/components/` — shared shell, cart context/drawer, craft UI primitives, and per-workspace panels.
- `prisma/seed.ts` — demo data: 1 admin, 1 verifier, 2 buyers, 2 artisans, sample catalog, orders. Every account uses password `Password123!`.

## Environment

Copy `.env.example` to `.env` and set `DATABASE_URL` (Supabase direct-connection string) and `JWT_SECRET`. `.env` is gitignored.