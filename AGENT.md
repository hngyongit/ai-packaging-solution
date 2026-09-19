# AGENT.md — AI Carton Packaging Solution

> This file is read by AI coding agents at the start of every session.
> Follow these instructions when generating, reviewing, or modifying code.

---

## Project Overview

**EXE201** — AI Carton Packaging Solution Platform.
A web app where customers input product specs → AI recommends box type/size/material → place order → staff confirms price → factory produces.

**Stack**: Next.js 14+ (App Router) + Supabase (DB, Auth) + TailwindCSS + ai-box (OpenAI-compatible) + Cloudinary (image storage).
**No backend server** — Next.js Route Handlers (`app/api/*`) serve as the backend.
**Closest reference**: A form-based consultation app (not a chat app).

---

## Documentation — Read These First

All docs live in `docs/`. Read the relevant one before coding in that area.

| File | Purpose | Read before... |
|---|---|---|
| **`docs/DEVELOPMENT_GUIDE.md`** | Project setup, folder structure, coding conventions, file size limits, libraries, quality checklist | **Every session** — it defines how to write code here |
| **`docs/ARCHITECTURE.md`** | Security model (RLS, Route Handler two-tier), data flow patterns, role design, state machine, modularity principles | Writing API routes, data access, auth, or payment flows |
| **`docs/DATABASE_SCHEMA.md`** | All SQL tables, columns, RLS policies, indexes, seed data | Writing Supabase queries, migrations, or RLS policies |
| **`docs/USER_FLOWS.md`** | Customer journey, order status state machine, page navigation map, staff flow | Creating pages, designing user flows, or implementing order status |
| **`docs/UI_RULES.md`** | Design tokens, component templates, Tasteskill rules for AI-generated UI | Generating any UI component — use these exact Tailwind classes |
| **`docs/SCREEN_DESCRIPTIONS.md`** | Detailed screen-by-screen descriptions: layout, structure, components, states, modals, design rationale | Building or implementing any screen — read the screen's description first |

---

## 🔍 Code Exploration — Use Codegraph MCP First

This project is indexed by **Codegraph** (`.codegraph/`). When the Codegraph MCP server is available:

1. **Always query Codegraph first** before falling back to `Grep`/`Glob`/file-by-file `Read` loops — `codegraph_explore` answers "how does X work", "where is Y defined", "what calls Z" in one call, with verbatim on-disk source.
2. **Pass a natural-language question or symbol names** (e.g. `middleware auth flow`, `createClient lib/supabase`) — no prior search step needed.
3. **The index can be stale** — it may miss very recent files or route groups. If Codegraph returns nothing or looks outdated for a file you know exists, fall back to normal file tools.
4. Treat source returned by Codegraph as already read — do not re-read those files.

---

## 🎨 UI Generation — Single Source of Truth

**`.agents/skills/design-taste-frontend/SKILL.md`** is the **Tasteskill** — the authoritative design taste system for this project.

**Every time you generate, modify, or review any UI code, you MUST:**

1. **Read the Tasteskill skill first** → `.agents/skills/design-taste-frontend/SKILL.md`
2. **Infer the design direction** using Section 0 (Brief Inference):
   - Declare a one-line **"Design Read"** before any code
   - Set the **Three Dials** (VARIANCE, MOTION, DENSITY) based on the brief
3. **Cross-reference with `docs/UI_RULES.md`** for concrete Tailwind tokens (colors, spacing, typography)
4. **Generate UI following the Tasteskill rules** — layout, motion, typography, density

### How the two work together

| Tasteskill (`.agents/skills/...`) | `docs/UI_RULES.md` |
|---|---|
| **Design direction** — brief inference, Design Read, Three Dials | **Implementation tokens** — concrete Tailwind classes, component templates |
| Sets the aesthetic: "clean industrial", "premium consumer" | Maps to exact values: `blue-600`, `rounded-lg`, `text-sm` |
| Motion system definition (sticky-stack, scroll-reveal, physics) | Motion component templates + Tailwind animation classes |
| Layout rules (hero, nav, bento, zigzag cap) | Layout patterns with exact Tailwind grids |
| Color rules (one palette, no AI purple, shape consistency) | Color tokens + semantic palette |

**The Tasteskill governs the look and feel. `UI_RULES.md` provides the exact implementation tokens.**

### Example workflow

```
1. User asks: "Create the landing page hero"
2. Agent reads Tasteskill → infers "B2B manufacturing landing, trust-first, clean industrial"
3. Agent sets dials: VARIANCE=5, MOTION=3, DENSITY=4
4. Agent reads UI_RULES.md → gets concrete Tailwind tokens
5. Agent generates hero with the inferred design direction
```

### Always declare the design read

Before any UI code, output one line:
```
Design Read: <page kind> for <audience>, with a <vibe> language, leaning toward <aesthetic>.
```

Example:
```
Design Read: Landing page for manufacturing B2B buyers, with a clean industrial language, leaning toward restrained Tailwind + shadcn + factory photography.
```

---

## Key Rules (Abbreviated)

### Folder Structure
```
src/
├── app/                     # Routes only — no business logic
│   ├── (public)/            # Landing, consultation, about, pricing, shop, dieline-lab
│   │   ├── page.tsx         # Landing
│   │   ├── consultation/    # AI form + live result + print-mockup (một màn)
│   │   │   ├── result/      # /consultation/result?id= — bản share được
│   │   │   └── stock/       # /consultation/stock — AI tìm hàng trong kho
│   │   ├── shop/            # Hàng có sẵn trong kho (add to cart / mua ngay)
│   │   ├── order/           # 🗑 redirect('/dashboard/custom') — form tạo đơn đã xoá
│   │   ├── dieline-lab/     # Khuôn bế (dieline) preview
│   │   ├── about/
│   │   └── pricing/
│   ├── (guest)/             # login/, register/ — redirect away if authed
│   ├── (auth)/              # Customer pages (login required)
│   │   └── dashboard/
│   │       ├── cart/        # Giỏ trộn stock + custom
│   │       ├── checkout/    # Chọn địa chỉ đã lưu → tạo đơn
│   │       ├── custom/      # Mẫu đã lưu + tự nhập quy cách
│   │       ├── orders/[id]/
│   │       ├── history/
│   │       ├── reorder/
│   │       └── profile/
│   ├── (staff)/             # Staff-only pages
│   │   └── staff/
│   │       ├── consultations/[id]/
│   │       ├── orders/[id]/
│   │       ├── customers/
│   │       └── products/
│   └── api/                 # Route Handlers (thin layer, delegates to lib/data/)
│       ├── ai/recommend/
│       ├── ai/mockup/
│       ├── cart/            # + [id]/ (PATCH quantity|custom) + count/
│       ├── checkout/        # tạo đơn từ cart + addressId
│       ├── addresses/       # + [id]/ — address book
│       ├── saved-products/  # + [id]/
│       ├── consultations/
│       ├── orders/
│       │   ├── [id]/status/
│       │   └── [id]/payment/
│       ├── products/
│       ├── upload/
│       └── reorder/
├── features/                # Self-contained feature modules
│   ├── consultation/        # ❌ folder rỗng (chỉ còn components/ trống) — UI thật ở app/(public)/consultation
│   ├── dieline/             # DielinePreview.tsx (khuôn bế UI)
│   └── products/            # CatalogTable, PriceTierCards, types, utils
├── components/              # Shared components only
│   ├── ui/                  # shadcn primitives (Button, Input, Card, Modal, etc.)
│   ├── layout/              # navbar, footer, DashboardNav, StaffSidebar
│   ├── modals/              # PascalCase modals (PaymentConfirmation, CancelOrder, ...)
│   ├── consultation/        # fields.tsx — Section/Field/BoxStylePicker/RadioGroup
│   ├── cart/                # use-add-to-cart.ts, custom-cart-actions.tsx
│   ├── checkout/            # address-picker.tsx, address-form-modal.tsx
│   └── order/               # print-preview-strip
└── lib/                     # Shared infrastructure
    ├── data/                # All Supabase queries (single source of truth)
    ├── ai/                  # AI provider abstraction (providers/openai.ts, providers/mock.ts)
    ├── dieline/             # Khuôn bế engine (index.ts, print-faces.ts) — pure, no React
    ├── mockup/              # Mockup in: request/generate
    ├── cloudinary/          # Server-side signed/unsigned image upload
    ├── images/              # dimensions helpers
    ├── config/              # features, pricing, constants, print-positions
    └── supabase/            # Browser + Server clients
```


### Coding Conventions
- **TypeScript strict** — no `any`
- **Server Component by default** — only add `'use client'` when needed (useState, useEffect, onClick, browser APIs)
- **Route Handlers** are thin — validate input, call `lib/data/`, return response
- **File size limits**: Component ≤200 lines, Hook ≤100, Route Handler ≤80, Data file ≤300
- **Reuse before create**: Check `components/ui/` → `features/` → `lib/data/` before writing new code
- **Rule of Three**: 3rd time same logic → extract to shared utility
- **Naming**: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utilities

### Security (Critical!)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe in browser — RLS protects data
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are **server-only** — never in client code
- Every table must have RLS enabled
- Route Handlers verify JWT before returning data

### Supabase Two-Tier Access
```typescript
// Browser (public, RLS-protected)
import { createBrowserClient } from '@supabase/ssr'

// Server (admin, service_role key)
import { createClient } from '@supabase/supabase-js'
```

### Supabase Schema / Database Changes
- When changing schema, RLS policies, indexes, functions, triggers, seed data, or any database object, create or update a Supabase migration in `supabase/migrations/`.
- After the migration is ready, push it to the linked Supabase project with `npx supabase db push` unless the user explicitly asks for local-only work.
- Verify the pushed change with a real query, route check, build, or Supabase CLI command appropriate to the change.
- If the Supabase CLI is not linked or authenticated, stop and report the exact command/error needed to continue.

### Order Status State Machine
```
pending → staff_review → confirmed → deposit_paid (if over threshold)
                                     → production → completed → delivered
                                     → cancelled (any stage)
```

### Payment Methods
- COD (pay on delivery)
- Bank transfer (full or 50% deposit if order > 5,000,000đ)

### AI Recommendation Flow (NOT a chat)
1. Customer fills form with product specs (dimensions, weight, quantity, printing)
2. POST `/api/ai/recommend` → Route Handler calls OpenAI → returns recommendation
3. Customer sees recommendation card → can place order
4. Staff reviews and confirms final price

### Anonymous Consultation Policy
- **AI Consultation**: Anonymous users CAN submit consultation requests (no login required)
- **Placing Order**: Login/register is required when placing an order
- **Session handling**: Anonymous consultations are tracked by device (no user_id). When user later registers, consultations can be linked via phone/email.
- **Route Handler**: `/api/ai/recommend` does NOT require auth for the consultation itself

---

## Libraries to Use

| Category | Library | Notes |
|---|---|---|
| UI | shadcn/ui | Copy-paste Tailwind components. `npx shadcn@latest add <component>` |
| Icons | Phosphor React (`@phosphor-icons/react`) | Priority: Phosphor, HugeIcons, Radix, Tabler. NOT Lucide. |
| Forms | React Hook Form + Zod | `npm install react-hook-form @hookform/resolvers zod` |
| Utilities | clsx + tailwind-merge | `cn()` helper in `lib/utils.ts` |
| Dates | date-fns | `npm install date-fns` |
| Charts | recharts | Staff dashboard only |

## Libraries NOT to Use
- ❌ Redux / React Query — Server Components + Supabase SDK is enough
- ❌ Axios — use native `fetch` or Supabase SDK
- ❌ MUI / Chakra / Ant Design — Tailwind + shadcn covers everything
- ❌ NextAuth.js — Supabase Auth handles auth
- ❌ Lodash — import specific functions only if needed

---

## When Generating Code

1. Read `docs/DEVELOPMENT_GUIDE.md` first for conventions
2. Check `docs/UI_RULES.md` for exact Tailwind classes
3. Check `docs/SCREEN_DESCRIPTIONS.md` for the screen's layout, states, and components
4. Check `docs/DATABASE_SCHEMA.md` for table/column names
5. Check `docs/ARCHITECTURE.md` for security patterns
6. Check `docs/USER_FLOWS.md` for page structure and state machine
7. Keep components ≤200 lines — extract sub-components if needed
8. Never expose API keys in client code
9. Always add RLS policies for new tables
