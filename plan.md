# CraftKhoj Implementation Plan

## Product scope
CraftKhoj is a responsive provenance-based marketplace for Nepali heritage crafts. This first deliverable is a polished, front-end-first demonstrator with seeded marketplace content and interaction states that make the underlying product workflow legible: browse craft products, inspect provenance, search by Craft Provenance ID, open artisan stories, add items to a cart, and move between public marketplace and role-oriented workspace previews. The server/database capabilities are enabled for future persistence; this slice intentionally keeps core demo data local so the interface is useful even before schema/API work is added.

## Implementation approach
- Use the initialized React + Vite + Tailwind + TypeScript starter and keep the existing Express/tRPC shell intact.
- Model products, artisans, provenance events, categories, and workspace metrics in typed front-end data so the UI can demonstrate the information architecture described in the project documentation.
- Use Wouter for a small route set: `/`, `/shop`, `/product/:id`, `/provenance`, `/artisan/:id`, `/workspace`, and `/404`.
- Build a single responsive shell with a strong desktop navigation, compact mobile header, cart drawer, provenance search card, and toast feedback for key actions.
- Keep the visual system neo-brutalist: Mint Ice page field, Deep Forest typography, Sky Blue actions, 3–4px borders, zero/low radius, and hard offset shadows. Use Space Grotesk for display text and DM Sans for body copy.
- Use remote Unsplash image URLs for seeded craft photography in this prototype; keep all imagery in clearly scoped placements and make content work if images load slowly.
- Add `public/manus-routes.json` before starting the dev server.
- Add a quoted `logoUrl` literal in `app.config.ts` for platform branding metadata.

## Project structure
- `client/src/App.tsx`: route map and providers.
- `client/src/pages/Home.tsx`: primary marketplace landing page and browse experience.
- `client/src/pages/Shop.tsx`: product catalog with category/filter controls.
- `client/src/pages/ProductDetail.tsx`: product overview, artisan, provenance timeline, and cart action.
- `client/src/pages/Provenance.tsx`: public Craft Provenance ID lookup experience.
- `client/src/pages/ArtisanProfile.tsx`: artisan story and product shelf.
- `client/src/pages/Workspace.tsx`: role-oriented dashboard preview with sales/verification modules.
- `client/src/lib/craft-data.ts`: typed seeded data, helper functions, and UI copy.
- `client/src/components/craft/`: reusable marketplace shell, cards, badges, buttons, and cart drawer.
- `client/src/index.css`: design tokens, typography, neo-brutalist utility styles, and responsive layout rules.
- `public/manus-routes.json`: complete page-route manifest for the website.
- `plan.md` and `TODO.md`: implementation decisions and acceptance outcomes.

## Design direction
Three candidate styles:
1. **Neo-Brutalist Field Notes** — 0.06 probability: editorial craft labels, hard shadows, and documentary UI blocks.
2. **Quiet Museum Ledger** — 0.18 probability: restrained serif typography and gallery-like spacing.
3. **Digital Bazaar** — 0.05 probability: dense commerce controls with colorful market signage.

### Chosen style: Neo-Brutalist Field Notes

- **Design Movement:** Neo-brutalism interpreted through Nepali craft documentation, workshop labels, and field notebooks.
- **Core Principles:** make origin visible; show structure honestly; use tactile blocks; keep every action legible.
- **Color Philosophy:** White is now the primary site field at the user’s direction, keeping the marketplace clear and gallery-like; Sky Blue creates an optimistic signal for actions; Deep Forest grounds the interface with reliability; Lavender Grey and Sage Green are restrained evidence colors rather than decoration.
- **Layout Paradigm:** staggered editorial bands with a split hero, horizontal story rails, and asymmetric proof panels instead of a centered grid-heavy storefront.
- **Signature Elements:** oversized numbered section labels, blue provenance stamps, and hard shadow cards that feel like clipped archive notes.
- **Interaction Philosophy:** clicks should feel physical—buttons lift against their hard shadow, filters visibly change the collection, and provenance detail opens like a record rather than a modal gimmick.
- **Animation:** restrained 140–180ms lifts on buttons/cards, gentle image scale on hover, and a slow marquee-like evidence strip; no floating or soft-glow effects.
- **Typography System:** Space Grotesk 700/800 for display and labels; DM Sans 400/500/700 for body and controls. Headlines are tight and compact; evidence metadata uses uppercase tracking.
- **Brand Essence:** “A more honest way to buy the handmade.” Personality: grounded, curious, accountable.
- **Brand Voice:** Headlines are direct and human; CTAs name the proof or next step. Example lines: “Every object leaves a trail.” / “See who made it before you make it yours.”
- **Wordmark & Logo:** a compact `CK` monogram built as two interlocking archival brackets, paired with a wordmark in Space Grotesk; the bracket motif reappears as provenance corners.
- **Signature Brand Color:** Mint Ice `#C5FFFD`, owned through its near-electric coolness and used as the page field rather than a generic white canvas.

### User-directed visual refinement

The primary site and hero background use white. Craft image windows in the shop use a consistent 1:1 square ratio across desktop and mobile so the collection reads as a coherent catalog.

## Serving and future backend
The initialized server/database configuration remains enabled. This deliverable serves the UI through the existing `pnpm dev` command and leaves the Drizzle schema/router ready for subsequent persistence work. No external secrets or payment integrations are required for this interface slice.
