# CraftKhoj — Implementation Plan

## Current state

CraftKhoj is a Next.js 15 App Router application backed by Prisma/PostgreSQL.
The earlier Vite + Express/tRPC/Drizzle plan is retired — its source tree was
removed from the repo. This file was rewritten to match the delivered architecture.

## Product scope

A provenance-based marketplace for Nepali heritage crafts: browse and search
products, inspect provenance records, look up by Craft Provenance ID, read
artisan stories, add to a cart, and move between the public marketplace and
four role-oriented workzones.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Prisma ORM over PostgreSQL (Supabase), with a seeded demo catalog
- JWT session auth (`ck_session` cookie) + bcrypt passwords
- Tailwind CSS v4, neo-brutalist design system

## Project structure

- `src/app/` — App Router routes. Public market pages plus `/buyer`, `/studio`,
  `/verifier`, `/admin` workzones gated by `middleware.ts`.
- `src/lib/` — `prisma.ts`, `auth.ts`, `session.ts`, `api.ts`, `products.ts`,
  `algorithms.ts`, `format.ts`.
- `src/components/` — shared shell, cart context/drawer, craft UI primitives,
  per-workspace panels.
- `prisma/schema.prisma`, `prisma/seed.ts` — schema and demo data.

## Design direction

### Chosen style: Neo-Brutalist Field Notes

- **Design Movement:** Neo-brutalism interpreted through Nepali craft documentation, workshop labels, and field notebooks.
- **Core Principles:** make origin visible; show structure honestly; use tactile blocks; keep every action legible.
- **Color Philosophy:** White is now the primary site field at the user's direction, keeping the marketplace clear and gallery-like; Sky Blue creates an optimistic signal for actions; Deep Forest grounds the interface with reliability; Lavender Grey and Sage Green are restrained evidence colors rather than decoration.
- **Layout Paradigm:** staggered editorial bands with a split hero, horizontal story rails, and asymmetric proof panels instead of a centered grid-heavy storefront.
- **Signature Elements:** oversized numbered section labels, blue provenance stamps, and hard shadow cards that feel like clipped archive notes.
- **Interaction Philosophy:** clicks should feel physical—buttons lift against their hard shadow, filters visibly change the collection, and provenance detail opens like a record rather than a modal gimmick.
- **Animation:** restrained 140–180ms lifts on buttons/cards, gentle image scale on hover, and a slow marquee-like evidence strip; no floating or soft-glow effects.
- **Typography System:** Space Grotesk 700/800 for display and labels; DM Sans 400/500/700 for body and controls. Headlines are tight and compact; evidence metadata uses uppercase tracking.
- **Brand Essence:** "A more honest way to buy the handmade." Personality: grounded, curious, accountable.
- **Brand Voice:** Headlines are direct and human; CTAs name the proof or next step. Example lines: "Every object leaves a trail." / "See who made it before you make it yours."
- **Wordmark & Logo:** a compact `CK` monogram built as two interlocking archival brackets, paired with a wordmark in Space Grotesk; the bracket motif reappears as provenance corners.
- **Signature Brand Color:** Mint Ice `#C5FFFD`, owned through its near-electric coolness and used as the page field rather than a generic white canvas.

### User-directed visual refinement

The primary site and hero background use white. Craft image windows in the shop use a consistent 1:1 square ratio across desktop and mobile so the collection reads as a coherent catalog.

## Open items

- `public/manus-routes.json` route manifest is not generated (TODO Outcome 6).
- No commits on `main` yet — the managed-platform checkpoint is unrecorded.
- `auth.ts` falls back to a plaintext dev default if `JWT_SECRET` is unset; set a real secret before deploying.