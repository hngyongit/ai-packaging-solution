# Task Allocation — AI Carton Packaging Solution

> 4 Fullstack Devs | Zero File Conflicts | AI + Mockup → Dev A

---

## Legend

| Icon | Meaning |
|------|---------|
| 🔴 Not started | File is stub or missing |
| 🟡 In progress | Being worked on |
| ✅ Complete | Fully implemented |

---

## Dev A — AI Consultation + Mockup (You)

**AI + recommendation + mockup — the core value prop.**

| # | Task | Files | Pri | Est. |
|---|------|-------|-----|------|
| A1 | AI provider abstraction | `src/lib/ai/index.ts`, `src/lib/ai/providers/openai.ts`, `src/lib/ai/providers/mock.ts` | P0 | 2h |
| A2 | AI recommend API route | `src/app/api/ai/recommend/route.ts` | P0 | 2h |
| A3 | Consultation spec input page | `src/app/(public)/consultation/page.tsx` | P0 | 4h |
| A4 | Consultation result page | `src/app/(public)/consultation/result/page.tsx` | P0 | 3h |
| A5 | Data access (consultations) | `src/lib/data/consultations.ts` | P0 | 1h |
| A6 | AI mockup API route | `src/app/api/ai/mockup/route.ts` | P1 | 3h |
| A7 | Mockup preview page | `/consultation?step=mockup` | P1 | 3h |

**Files**: `src/lib/ai/*`, `src/app/api/ai/*`, `src/app/(public)/consultation/*`, `src/lib/data/consultations.ts`

**Total**: 18h | **Deps**: None — start immediately

---

## Dev B — Order System

**Orders, payment, reorder, upload — full order lifecycle.**

| # | Task | Files | Pri | Est. |
|---|------|-------|-----|------|
| B1 | Orders API (CRUD) | `src/app/api/orders/route.ts` | P0 | 2h |
| B2 | Order status API | `src/app/api/orders/[id]/status/route.ts` | P0 | 1h |
| B3 | Order payment API | `src/app/api/orders/[id]/payment/route.ts` | P0 | 1h |
| B4 | Reorder API | `src/app/api/reorder/route.ts` | P1 | 1h |
| B5 | Upload API | `src/app/api/upload/route.ts` | P0 | 1h |
| B6 | Standalone order page | `src/app/(public)/order/page.tsx` | P0 | 4h |
| B7 | Customer orders list | `src/app/(auth)/dashboard/orders/page.tsx` | P0 | 3h |
| B8 | Customer order detail | `src/app/(auth)/dashboard/orders/[id]/page.tsx` | P0 | 3h |
| B9 | Order history | `src/app/(auth)/dashboard/history/page.tsx` | P1 | 2h |
| B10 | Reorder page | `src/app/(auth)/dashboard/reorder/page.tsx` | P1 | 2h |
| B11 | Data access (orders) | `src/lib/data/orders.ts` | P0 | 1h |

**Files**: `src/app/api/orders/*`, `src/app/api/reorder/*`, `src/app/api/upload/*`, `src/app/(public)/order/*`, `src/app/(auth)/dashboard/orders/*`, `src/app/(auth)/dashboard/history/*`, `src/app/(auth)/dashboard/reorder/*`, `src/lib/data/orders.ts`

**Total**: 21h

---

## Dev C — Staff Features

**Staff dashboard, consultations, orders, customers, products management.**

| # | Task | Files | Pri | Est. |
|---|------|-------|-----|------|
| C1 | Consultations API | `src/app/api/consultations/route.ts` | P0 | 1h |
| C2 | Products API | `src/app/api/products/route.ts` | P0 | 1h |
| C3 | Staff dashboard (stats + charts) | `src/app/(staff)/staff/page.tsx` | P0 | 4h |
| C4 | Staff consultations list | `src/app/(staff)/staff/consultations/page.tsx` | P0 | 2h |
| C5 | Staff consultation review | `src/app/(staff)/staff/consultations/[id]/page.tsx` | P0 | 4h |
| C6 | Staff orders list | `src/app/(staff)/staff/orders/page.tsx` | P0 | 2h |
| C7 | Staff order detail | `src/app/(staff)/staff/orders/[id]/page.tsx` | P0 | 3h |
| C8 | Staff customers | `src/app/(staff)/staff/customers/page.tsx` | P1 | 2h |
| C9 | Staff products | `src/app/(staff)/staff/products/page.tsx` | P1 | 2h |
| C10 | Data access (products, profiles) | `src/lib/data/products.ts`, `src/lib/data/profiles.ts` | P0 | 1h |

**Files**: `src/app/api/consultations/*`, `src/app/api/products/*`, `src/app/(staff)/*`, `src/lib/data/products.ts`, `src/lib/data/profiles.ts`

**Total**: 22h

---

## Dev D — Marketing Pages + Dashboard + Shared Modals

**Concrete pages: about, pricing, dashboard enhancement. Modals built as part of those pages.**

| # | Task | Files | Pri | Est. |
|---|------|-------|-----|------|
| D1 | About page | `src/app/(public)/about/page.tsx` — hero, story, stats, gallery, equipment | P1 | 3h |
| D2 | Pricing page | `src/app/(public)/pricing/page.tsx` — product catalog table, price tiers | P1 | 3h |
| D3 | Enhance customer dashboard | `src/app/(auth)/dashboard/page.tsx` — add stats cards (total orders, in-progress, saved), recent orders table | P0 | 3h |
| D4 | Payment confirmation modal (M1) | `src/components/modals/payment-confirmation.tsx` — used by order page | P0 | 1h |
| D5 | Cancel order modal (M2) | `src/components/modals/cancel-order.tsx` — used by order detail | P0 | 1h |
| D6 | Price change notification modal (M3) | `src/components/modals/price-change.tsx` — used by staff consultation review | P1 | 1h |
| D7 | Upload payment proof modal (M4) | `src/components/modals/upload-proof.tsx` — used by staff order detail | P1 | 1h |
| D8 | Customer quick view modal (M5) | `src/components/modals/customer-quick-view.tsx` — used by staff customers | P1 | 1h |
| D9 | Product edit drawer (M6) | `src/components/modals/product-edit-drawer.tsx` — used by staff products | P1 | 1.5h |
| D10 | Status badge + timeline components | `src/components/ui/status-badge.tsx`, `src/components/ui/status-timeline.tsx` — build as part of D3 dashboard | P0 | 1h |
| D11 | Empty state + error state components | `src/components/ui/empty-state.tsx`, `src/components/ui/error-state.tsx` — build as part of D3 dashboard | P0 | 1h |
| D12 | Update DB types | `src/types/database.ts` — add full types for all tables | P0 | 1h |

**Files**: `src/app/(public)/about/*`, `src/app/(public)/pricing/*`, `src/app/(auth)/dashboard/page.tsx` (edit), `src/components/modals/*`, `src/components/ui/status-badge.tsx`, `src/components/ui/status-timeline.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/error-state.tsx`, `src/types/database.ts` (edit)

**Total**: 17.5h

---

## Sprint Plan (1 Week)

| Day | Dev A (AI) | Dev B (Orders) | Dev C (Staff) | Dev D (Pages + Modals) |
|-----|-----------|----------------|---------------|------------------------|
| **Mon** | A1 AI provider | B1 Orders API | C1 Consultations API | D3 Dashboard enhancement → extracts D10, D11 naturally |
| **Tue** | A2 Recommend API | B2 Status API + B3 Payment | C2 Products API + C4 List | D1 About page |
| **Wed** | A3 Consultation form | B6 Order page | C3 Staff dashboard + C6 Orders list | D2 Pricing page |
| **Thu** | A4 Result + A5 Data | B7 Orders list + B8 Detail | C5 Review + C7 Detail | D4-D5 Modals (payment, cancel) |
| **Fri** | A6 Mockup API + A7 Page | B9 History + B10 Reorder + B11 Data | C8-C9 Customers + Products + C10 Data | D6-D9 Modals + D12 Types |

---

## Key Rules

1. **No file touched by >1 dev** — if you need something from another dev's area, ask, don't edit
2. **Shared components emerge from pages** — Dev D builds StatusBadge + EmptyState while enhancing the dashboard (D3), not as abstract tasks
3. **Modals owned by Dev D** — used by B's order page and C's staff pages, but D builds them
4. **Branch per dev**: `dev-a/ai`, `dev-b/orders`, `dev-c/staff`, `dev-d/pages`
5. **Merge to `develop`** when feature complete