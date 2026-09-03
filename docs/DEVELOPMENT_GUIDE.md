# Development Guide — AI Carton Packaging Solution

> **EXE201 Project** — Nền tảng AI tư vấn, báo giá, chăm sóc khách hàng và hỗ trợ sản xuất bao bì carton

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Fullstack — server components + API routes |
| **Styling** | TailwindCSS | Utility-first CSS, consistent design system |
| **Database & Auth** | Supabase | PostgreSQL DB, Auth, Storage, Realtime |
| **AI/LLM** | OpenAI API (or equivalent) | Box spec recommendation, consultation logic |
| **Deployment** | Vercel (recommended) | Next.js-native hosting, edge-ready |

### No separate backend server

Next.js Route Handlers (`app/api/*`) serve as the backend. No Express/Fastify/Node.js server needed.

---

## 2. Folder Structure

```
AI_Packaging_solution/
├── docs/                          # Project documentation
│   ├── DEVELOPMENT_GUIDE.md       # ← This file
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── UI_RULES.md
│   ├── SRS.md
│   └── USER_FLOWS.md
│
├── src/
│   ├── app/                       # Next.js App Router (routes only — no business logic)
│   │   ├── (public)/              # Route group — public pages (no auth)
│   │   │   ├── page.tsx           # Landing page (hero, how it works, catalog, trust)
│   │   │   ├── consultation/      # AI consultation step 1: spec input
│   │   │   │   └── result/        # AI consultation step 2: recommendation display
│   │   │   ├── order/             # Place order (from consultation or manual)
│   │   │   ├── about/             # Factory info, trust building
│   │   │   └── pricing/           # Pricing guide (optional)
│   │   │
│   │   ├── (auth)/                # Route group — authenticated pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/         # Customer portal
│   │   │       ├── page.tsx       # Dashboard overview (stats, quick actions)
│   │   │       ├── orders/        # My orders list
│   │   │       │   └── [id]/      # Order detail + tracking
│   │   │       ├── history/       # Order history
│   │   │       ├── reorder/       # Reorder from past orders
│   │   │       └── profile/       # Customer profile
│   │   │
│   │   ├── (staff)/               # Route group — staff (sales/admin) only
│   │   │   ├── dashboard/         # Staff overview (stats, new consults, pending orders)
│   │   │   ├── consultations/     # Review & confirm AI recommendations
│   │   │   │   └── [id]/          # Consultation detail + confirm price
│   │   │   ├── orders/            # All orders management
│   │   │   │   └── [id]/          # Order detail + update status
│   │   │   ├── customers/         # Customer list
│   │   │   └── products/          # Product catalog management
│   │   │
│   │   ├── api/                   # Route Handlers (thin layer — delegates to lib/data)
│   │   │   ├── auth/              # Auth endpoints
│   │   │   ├── ai/
│   │   │   │   ├── recommend/route.ts   # → delegates to features/consultation
│   │   │   │   └── mockup/route.ts      # → delegates to features/consultation
│   │   │   ├── consultations/route.ts   # → delegates to lib/data/consultations
│   │   │   ├── orders/route.ts          # → delegates to lib/data/orders
│   │   │   │   ├── [id]/status/route.ts # → delegates to lib/data/orders
│   │   │   │   └── [id]/payment/route.ts# → delegates to lib/data/orders
│   │   │   ├── products/route.ts        # → delegates to lib/data/products
│   │   │   ├── upload/route.ts          # → delegates to lib/data/upload
│   │   │   └── reorder/route.ts         # → delegates to lib/data/orders
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles + Tailwind
│   │
│   ├── features/                  # ← FEATURE MODULES (self-contained, loosely coupled)
│   │   ├── consultation/          # Consultation + AI recommendation feature
│   │   │   ├── components/
│   │   │   │   ├── SpecInputForm.tsx
│   │   │   │   ├── RecommendationCard.tsx
│   │   │   │   └── MockupPreview.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useConsultation.ts
│   │   │   ├── utils.ts           # Feature-specific business logic
│   │   │   └── types.ts
│   │   │
│   │   ├── orders/                # Order management feature
│   │   │   ├── components/
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── OrderStatusTimeline.tsx
│   │   │   │   └── PaymentForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOrders.ts
│   │   │   ├── utils.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── products/              # Product catalog feature
│   │   │   ├── components/
│   │   │   ├── utils.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── auth/                  # Auth feature
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── staff/                 # Staff dashboard feature
│   │       ├── components/
│   │       │   ├── ConsultationReview.tsx
│   │       │   ├── OrderStatusUpdater.tsx
│   │       │   └── StaffStats.tsx
│   │       ├── hooks/
│   │       └── utils.ts
│   │
│   ├── components/                # SHARED components (reusable across features)
│   │   ├── ui/                    # Base primitives (Button, Input, Card, Badge, Table, Modal...)
│   │   └── layout/                # Shared layout (Header, Footer, Sidebar)
│   │
│   ├── lib/                       # Shared infrastructure
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client (anon key + RLS)
│   │   │   └── server.ts          # Server client (service_role)
│   │   │
│   │   ├── data/                  # ← DATA ACCESS LAYER (single source of truth for DB ops)
│   │   │   ├── consultations.ts   # Consultation CRUD — all Supabase queries here
│   │   │   ├── orders.ts          # Order CRUD — all Supabase queries here
│   │   │   ├── products.ts        # Product queries
│   │   │   ├── profiles.ts        # Profile queries
│   │   │   └── upload.ts          # File upload helpers
│   │   │
│   │   ├── ai/                    # ← AI PROVIDER ABSTRACTION (swap providers easily)
│   │   │   ├── client.ts          # Factory: creates the right provider
│   │   │   ├── types.ts           # AIProvider interface (contract)
│   │   │   └── providers/
│   │   │       ├── openai.ts      # OpenAI implementation
│   │   │       └── mock.ts        # Mock provider for testing
│   │   │
│   │   ├── config/                # ← CONFIGURATION (feature flags, constants)
│   │   │   ├── features.ts        # Feature flags (toggle on/off)
│   │   │   ├── pricing.ts         # Pricing rules (thresholds, deposit %)
│   │   │   └── constants.ts       # App-wide constants
│   │   │
│   │   └── utils.ts               # Generic helpers
│   │
│   ├── hooks/                     # Shared hooks (cross-feature)
│   │   └── useMediaQuery.ts
│   │
│   └── types/                     # Shared types (database-generated)
│       └── database.ts            # Supabase-generated types
│
├── supabase/
│   ├── migrations/                # Database migrations
│   └── seed.sql                   # Seed data
│
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
│
├── .env.local                     # Local environment variables (gitignored)
├── .env.example                   # Environment template
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Key design principles

| Principle | What it means | How it's enforced |
|---|---|---|
| **Feature isolation** | Each feature is self-contained in `features/` | Adding a new feature = create `features/new-feature/`, add routes in `app/`, add data functions in `lib/data/` — never touch existing code |
| **Data access layer** | All DB queries go through `lib/data/` | Route Handlers call `lib/data/` functions, never `supabase.from()` directly. Schema changes = update only `lib/data/` |
| **Provider abstraction** | AI providers are swappable | `lib/ai/client.ts` returns a provider that implements the `AIProvider` interface. Swap OpenAI → Claude = new file in `providers/`, change config |
| **Configuration-driven** | Business rules live in config, not code | `lib/config/pricing.ts` holds thresholds, deposit %. Change pricing = edit config, not business logic |
| **Thin routes** | `app/api/*` only parse requests and delegate | Route Handlers validate input, call `lib/data/`, return response — no business logic

---

## 3. Coding Conventions

### General

- **Language**: TypeScript everywhere — strict mode
- **Components**: Use `export default function` for page components, named exports for shared components
- **File naming**: `kebab-case.tsx` for files, `PascalCase` for component names
- **CSS**: Tailwind utility classes — no CSS modules unless absolutely necessary
- **Imports**: Group order — React → Next.js → Third-party → Local

### Component rules

```tsx
// ✅ Do — Server Component by default
export default async function ProductPage() {
  const products = await getProducts()  // server fetch
  return <ProductList products={products} />
}

// ✅ Do — Client Component only when needed
'use client'
export default function SpecInputForm() {
  // form state, event handlers, client-side logic
}

// ❌ Avoid — 'use client' on every component
// Only add 'use client' when you need: useState, useEffect, event handlers, browser APIs
```

### Server vs Client — decision rule

```
Does the component need:
  - useState / useReducer / useRef?         → Client Component
  - useEffect?                              → Client Component
  - onClick / onChange / onSubmit?           → Client Component
  - browser-only APIs (localStorage, etc.)?  → Client Component
  - None of the above?                       → Server Component (default)
```

### API Route Handlers

```tsx
// app/api/ai/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request
  const body = await request.json()

  // 3. Business logic — call AI, query DB, calculate
  const recommendation = await getBoxRecommendation(body)

  // 4. Return
  return NextResponse.json(recommendation)
}
```

### Supabase client — two-tier pattern

```typescript
// lib/supabase/client.ts — Browser (public)
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// lib/supabase/server.ts — Server (admin)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // 🔒 NEVER exposed to browser
    { cookies: { get: (key) => cookieStore.get(key)?.value } }
  )
}
```

---

## 4. Code Quality Rules

### 4.1 File size limits

| File type | Max lines | Why |
|---|---|---|
| Component file (`.tsx`) | **200 lines** | If bigger, extract sub-components |
| Hook file (`.ts`) | **100 lines** | If bigger, split into multiple hooks |
| Utility file (`.ts`) | **400 lines** | If bigger, split by concern |
| Route Handler (route.ts) | **80 lines** | Thin layer — delegate to `lib/data/` |
| API data file (`lib/data/*.ts`) | **300 lines** | Keep focused on one entity |

**Exception**: Config files, auto-generated types, migrations — no limit.

### 4.2 Reuse before creating new

Before creating a new component, hook, or utility:

```
1. Check components/ui/ — does a base primitive exist?
2. Check features/ — does another feature have similar logic?
3. Check lib/data/ — does the function already exist?
4. If found: refactor to be reusable, don't duplicate
5. If not found: create in the right place
```

**Rule of Three**: If you're writing the same logic a 3rd time, extract it into a shared utility.

### 4.3 Clean code rules

```
✅ DO:
  - One responsibility per component/function
  - Meaningful names: getOrdersByCustomer() not fetchData()
  - Early return for error/edge cases
  - Destructure props at the top of the component
  - Use TypeScript — never `any`
  - Extract magic numbers/strings to named constants
  - Comment WHY, not WHAT (the code says what)
  - Keep functions pure (same input = same output)

❌ DON'T:
  - Components > 200 lines
  - Nested ternaries (use if/else or early return)
  - Side effects in Server Components
  - `console.log` in production
  - Duplicate code (extract it!)
  - Large useEffect blocks (extract to custom hook)
  - Props drilling > 3 levels (use Context or composition)
  - Import * from 'lodash' (tree-shaking fails)
```

### 4.4 File organization rules

```
- One component = one file
- One hook = one file
- Group related components in a folder
- Index file (.ts) for barrel exports
- Name files by what they export, not where they are
```

### 4.5 Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | `PascalCase.tsx` | `OrderCard.tsx` |
| Hook files | `camelCase.ts` | `useOrders.ts` |
| Utility files | `camelCase.ts` | `formatCurrency.ts` |
| Data access files | `camelCase.ts` | `orders.ts` |
| Type files | `camelCase.ts` | `order.ts` |
| CSS classes | Tailwind only | (no custom class names) |
| Database columns | `snake_case` | `customer_id` |
| Environment variables | `UPPER_SNAKE_CASE` | `SUPABASE_SERVICE_ROLE_KEY` |

---

## 5. Environment Variables

| Variable | Where used | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | ✅ Public (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | ✅ Public (safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | 🔒 Secret |
| `OPENAI_API_KEY` | Server only | 🔒 Secret |
| `NEXT_PUBLIC_SITE_URL` | SEO, OG images | ✅ Public |

---

## 6. Git Workflow

```
main          ← Production-ready
  └── develop ← Integration branch
       ├── feat/feature-name  ← Feature branches
       └── fix/bug-name       ← Fix branches
```

**Commit convention**: `type(scope): message`

- `feat(api): add AI recommendation endpoint`
- `feat(ui): add spec input form`
- `fix(db): correct RLS policy on orders`
- `docs: add architecture documentation`
- `chore: update dependencies`

---

## 7. AI-Generated Code Workflow

Since the team works with AI-generated code:

1. **Design the flow** → You (lead) define the user flow, edge cases, and data shape
2. **Write the prompt** → Each team member prompts AI with Tasteskill rules + UI_RULES.md
3. **Review** → Check for: security (no secrets in client), type safety, RLS compliance
4. **Test** → Verify in browser, check Supabase queries
5. **Commit** → Follow commit convention

**Important**: AI-generated code must be reviewed for:
- ❌ Exposed `service_role` key or API keys
- ❌ Missing RLS policies
- ❌ Client Component where Server Component would do
- ✅ Proper TypeScript types
- ✅ Tailwind class consistency (follow UI_RULES.md)

---

## 8. Libraries & Tools

### 8.1 UI Components

| Library | Purpose | When to use |
|---|---|---|
| **TailwindCSS** | Utility-first styling | All styling — no CSS modules |
| **shadcn/ui** | Copy-paste Tailwind components (Button, Input, Dialog, Table, etc.) | Base UI primitives in `components/ui/` |
| **Lucide React** | Icon library (built into shadcn) | All icons |

**Note**: shadcn/ui is NOT a dependency — it's copy-paste. You own the code. Install individual components:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# etc.
```

### 8.2 State Management

| Concern | Solution | Why |
|---|---|---|
| **Server state** (DB data) | React Server Components + Supabase | No client cache needed. Fetch on server, render HTML |
| **Form state** | React Hook Form + Zod | Performant, minimal re-renders, built-in validation |
| **Global UI state** (auth, theme) | React Context (lightweight) | One context for auth, one for theme. No Redux |
| **URL state** (consultation step) | `useSearchParams()` | Step persists in URL — shareable, back-button safe |
| **Complex client state** (future) | Zustand (only if needed) | Only add if Server Components + Context isn't enough |

```bash
# Form handling
npm install react-hook-form @hookform/resolvers zod

# Zustand (only if needed later)
npm install zustand
```

### 8.3 Form Validation

| Library | Purpose | Usage |
|---|---|---|
| **Zod** | Schema validation | Define types + validators in one place |
| **@hookform/resolvers** | Bridge Zod → React Hook Form | `resolver={zodResolver(schema)}` |

```typescript
import { z } from 'zod'

export const consultationSchema = z.object({
  productType: z.string().min(1, 'Required'),
  productLength: z.number().min(1, 'Min 1cm').max(200, 'Max 200cm'),
  productWidth: z.number().min(1).max(200),
  productHeight: z.number().min(1).max(200),
  productWeight: z.number().min(1).max(50000),
  quantity: z.number().min(1, 'Min 1 box'),
  hasPrinting: z.boolean(),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Invalid phone'),
})

export type ConsultationInput = z.infer<typeof consultationSchema>
```

### 8.4 Utility Libraries

| Library | Purpose | Install |
|---|---|---|
| **clsx** | Conditional class names | `npm install clsx` |
| **tailwind-merge** | Merge Tailwind classes without conflicts | `npm install tailwind-merge` |
| **date-fns** | Date formatting & manipulation | `npm install date-fns` |
| **recharts** | Charts for staff dashboard | `npm install recharts` |

**Recommended utility wrapper**:
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}
```

### 8.5 When to install each library

```
MVP Phase 1 (Week 1-2):
  npm install clsx tailwind-merge
  npx shadcn@latest add button input card select table dialog badge

MVP Phase 2 (Week 3-4):
  npm install react-hook-form @hookform/resolvers zod date-fns
  npx shadcn@latest add form

Staff Dashboard (Week 5-6):
  npm install recharts
```

### 8.7 Libraries we explicitly DON'T use

| Library | Why not |
|---|---|
| **Redux / Redux Toolkit** | Overkill — Server Components handle most state |
| **React Query / TanStack Query** | Supabase SDK + Server Components replace it |
| **Axios** | Native `fetch` + Supabase SDK is enough |
| **MUI / Chakra / Ant Design** | Tailwind + shadcn is lighter, more flexible |
| **Lodash** | Import only specific functions if needed, not the whole library |
| **NextAuth.js** | Supabase Auth handles everything (Google, FB, magic link)

---

## 9. Development Setup

```bash
# 1. Install
npm install
npx shadcn@latest add button input card select table dialog badge form

# 2. Environment
cp .env.example .env.local
# Fill in Supabase URL + keys, OpenAI key

# 3. Supabase local (optional)
npx supabase start

# 4. Run
npm run dev
```

---

## 10. Deployment

- **Platform**: Vercel (recommended for Next.js)
- **Environment variables**: Set in Vercel dashboard
- **Supabase**: Use Supabase production project
- **Build**: `npm run build` — vercel auto-detects Next.js

---

## 11. Quality Checklist Before Merge

- [ ] No `console.log` left in production code
- [ ] No API keys in client-side code
- [ ] RLS policies enabled on all tables
- [ ] TypeScript strict mode — no `any` types
- [ ] File within size limits (200 lines component, 80 lines route handler)
- [ ] No duplicate code — checked existing components/data first
- [ ] Early return for error/edge cases
- [ ] One responsibility per component
- [ ] Tailwind classes follow UI_RULES.md conventions
- [ ] Mobile-responsive (Tailwind breakpoints)
- [ ] Loading states for async operations
- [ ] Error boundaries for user-facing components