# CraftKhoj TODO

## Outcome 1 — Responsive provenance-first marketplace shell
- [x] The home page presents CraftKhoj as a provenance-based marketplace for Nepali heritage crafts rather than a generic e-commerce storefront.
- [x] The interface uses the specified neo-brutalist visual direction with bold borders, strong contrast, oversized typography, visible structure, hard offset shadows, and responsive behavior.
- [x] The documented palette is represented with Mint Ice `#C5FFFD`, Sky Blue `#88D9E6`, Lavender Grey `#8B8BAE`, Sage Green `#526760`, and Deep Forest `#374B4A`.
- [x] The public navigation exposes marketplace browse, provenance lookup, artisan stories, and a role-oriented workspace preview.

## Outcome 2 — Craft discovery and seeded product catalog
- [x] Buyers can browse approved-looking sample products with title, description, price, stock/status, category, image, craft details, rating, origin, and artisan information.
- [x] The shop view includes searchable/filterable product discovery and category/sort controls.
- [x] The site includes personalized-looking recommendation content and clear product actions such as view detail and add to cart.
- [x] Out-of-stock/limited inventory signals are surfaced as visible status badges.

## Outcome 3 — Product detail and provenance transparency
- [x] Product detail pages expose artisan identity, workshop location, materials, production method, production date, and a timestamped provenance timeline.
- [x] Approved products display a unique Craft Provenance ID and an explicit verified status.
- [x] Buyers can navigate from a product to its artisan profile and public provenance lookup.
- [x] Provenance copy explains that the record is intended to support authenticity and buyer trust.

## Outcome 4 — Buyer interaction states
- [x] Buyers can add available products to a cart from the landing page, shop, and product detail views.
- [x] The cart shows selected items, quantities, subtotal, and a clear checkout action; adding an item gives visible feedback.
- [x] The public UI includes entry points for login/register, order history, review/report flows, and simulated checkout without claiming real payment-gateway integration.

## Outcome 5 — Artisan, verifier, and administrator visibility
- [x] Artisan profile pages show craft identity, district/workshop, trust score, verification status, and product shelf.
- [x] The workspace preview communicates role-based areas for buyer, artisan, verifier, and administrator users.
- [x] The workspace includes demonstrator metrics for revenue, orders, provenance queue, flagged listings, and low-stock alerts.

## Outcome 6 — Route manifest, diagnostics, and delivery readiness
- [x] `public/manus-routes.json` lists every implemented page route and dynamic route pattern.
- [x] Invalid dynamic artisan IDs render the not-found state rather than silently showing another artisan.
- [x] Verified products include an explicit verification event in their timestamped provenance timeline.
- [x] Public proof metrics are derived from the seeded demo records and labeled as demo counts.
- [x] TypeScript diagnostics are registered through the host-managed runtime before implementation.
- [x] The project should be checked and built successfully before checkpoint delivery.
- [ ] The project should be committed to the canonical `main` branch so the managed platform records the checkpoint.
