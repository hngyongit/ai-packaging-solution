# Architecture — AI Carton Packaging Solution

> **Tech stack**: Next.js 14+ (App Router) + Supabase + TailwindCSS
> **No separate backend server** — all logic lives in Next.js

---

## 1. Architecture Overview

```
                    ┌──────────────────────────────────────┐
                    │          User's Browser               │
                    │  ┌────────────────────────────────┐   │
                    │  │  Next.js App (Client)           │   │
                    │  │  - Server Components (RSC)      │   │
                    │  │  - Client Components (forms)    │   │
                    │  │  - Supabase anon key (RLS only) │   │
                    │  └──────────┬─────────────────────┘   │
                    └─────────────┼─────────────────────────┘
                                  │
                    ┌─────────────┼─────────────────────┐
                    │             │                      │
                    │  ┌──────────▼──────────┐  ┌───────▼──────┐
                    │  │  Next.js Server      │  │  Supabase    │
                    │  │                      │  │  Auth        │
                    │  │  ┌────────────────┐  │  │  (JWT)       │
                    │  │  │ Server Components│  │  └──────┬───────┘
                    │  │  │ (data fetching)  │  │         │
                    │  │  └────────────────┘  │         │
                    │  │  ┌────────────────┐  │  ┌───────▼──────┐
                    │  │  │ Route Handlers  │──┼──►  Supabase   │
                    │  │  │ /api/*          │  │  │  DB + RLS    │
                    │  │  └───────┬────────┘  │  └──────────────┘
                    │  │          │            │
                    │  │  ┌───────▼────────┐  │
                    │  │  │ External APIs   │  │
                    │  │  │ (OpenAI, etc.)  │  │
                    │  │  └────────────────┘  │
                    │  └──────────────────────┘
                    └──────────────────────────────────────────┘
```

---

## 2. Security Model — How Data is Protected

### Core Principle: Two-Tier Access

```
                    ┌──────────────────────────────────┐
                    │          BROWSER (untrusted)      │
                    │  Supabase anon key                │
                    │  └──► Only RLS-allowed data       │
                    └──────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │          SERVER (trusted)         │
                    │  Supabase service_role key        │
                    │  └──► Full admin access           │
                    │  External API keys (OpenAI, etc.) │
                    └──────────────────────────────────┘
```

### 2.1 Row Level Security (RLS) — Your First Line of Defense

RLS is a **database-level gate**. Every query from the browser goes through RLS.

```sql
-- Example: Customer can only see their own orders
CREATE POLICY "customer_select_own_orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Example: Sales can see all orders
CREATE POLICY "sales_select_all_orders"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));

-- Example: Anyone can submit a consultation request
CREATE POLICY "public_insert_consultation"
  ON consultations FOR INSERT
  WITH CHECK (true);  -- No auth required to submit
```

**RLS rules for this project:**

| Table | Public Access | Auth Required | Notes |
|---|---|---|---|
| `products` | ✅ Read-only | No | Public product catalog |
| `consultations` | ✅ Insert only | No | Anyone can request a quote |
| `orders` | ❌ | Customer: own only | Sales: all |
| `customers` | ❌ | Own profile only | Sales: all |
| `order_history` | ❌ | Customer: own only | Sales: all |

### 2.2 Route Handlers — The Secure Gateway

All external API calls go through Next.js Route Handlers:

```
Browser ──► Route Handler (server) ──► OpenAI API
                  │
                  │  API key stored here only
                  │  Never sent to browser
                  ▼
            Returns result to client
```

```typescript
// app/api/ai/recommend/route.ts
export async function POST(request: NextRequest) {
  // Step 1: Anonymous allowed — no auth required for consultation
  // Auth is only required when placing an order

  // Step 2: Parse request body
  const { productType, dimensions, weight, quantity, phone, email } = await request.json()

  // Step 3: Call AI (API key is server-side only)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'You are a carton packaging consultant. Given product specs, recommend box type, material, and optimal dimensions.'
    }, {
      role: 'user',
      content: JSON.stringify({ productType, dimensions, weight, quantity })
    }]
  })

  // Step 4: Save to DB (via service_role — full access)
  // If user is authenticated, link to their profile. Otherwise anonymous.
  const supabaseServer = createServerSupabaseClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  const consultationData: any = {
    input_specs: { productType, dimensions, weight, quantity },
    ai_recommendation: completion.choices[0].message,
    status: 'ai_processed',
  }
  if (user) consultationData.customer_id = user.id
  await supabaseServer.from('consultations').insert(consultationData)

  // Step 5: Return to client
  return NextResponse.json({ recommendation: completion.choices[0].message })
}
```

### 2.3 What's Exposed vs Protected

| Asset | Exposed to Browser? | How Protected |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Not a secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Designed to be public |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | Never in client code |
| `OPENAI_API_KEY` | ❌ No | Server-only env var |
| DB data (customer own) | ✅ Yes | RLS restricts to their rows |
| DB data (other customers) | ❌ No | RLS blocks cross-user access |
| DB data (admin only) | ❌ No | RLS role check |

### 2.4 Security Checklist

- [ ] RLS enabled on **every** table (default: `FOR SELECT` denied)
- [ ] RLS policies tested via Supabase SQL editor
- [ ] Service role key used **only** in Route Handlers / Server Components
- [ ] No external API keys in `.env.local` committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] Auth middleware protects admin routes
- [ ] Rate limiting on public endpoints (consultation form)

---

## 3. Data Flow Patterns

### 3.1 Public Data (Product Catalog)

```
Server Component ──► Supabase (anon key + RLS) ──► HTML
```

```tsx
// src/app/(public)/page.tsx — Server Component
export default async function HomePage() {
  const supabase = createClient() // server client
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(6)

  return <ProductShowcase products={products} />
}
```

### 3.2 Form Submission (Consultation Request)

```
Client Form ──► POST /api/ai/recommend ──► Server Logic ──► OpenAI API
                                                      │
                                                      ▼
                                                Supabase DB
                                                      │
                                                      ▼
                                            Response to Client
```

### 3.3 Authenticated Data (Customer Dashboard)

```
Client Component (logged in) ──► Supabase (anon key + JWT + RLS)
                                          │
                                          ▼
                                    Only own orders
```

### 3.4 File Upload (Logo / Design File)

```
Client ──► POST /api/upload ──► Route Handler ──► Supabase Storage
                                                      │
                                                      ▼
                                              Returns public URL
```

### 3.5 Consultation → AI → Order Flow

```
Client Form ──► POST /api/ai/recommend ──► Route Handler
                                                  │
                                        ┌─────────┴──────────┐
                                        │ 1. Validate input   │
                                        │ 2. Auth check (opt) │
                                        │ 3. Call OpenAI API  │
                                        │ 4. Save to DB       │
                                        │ 5. Return result    │
                                        └─────────────────────┘
                                                  │
                                                  ▼
                                          Response to Client
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Recommendation Card    │
                                    │  + "Place Order" CTA    │
                                    └─────────────────────────┘
                                                  │
                                                  ▼
                                    POST /api/orders ──► Created
                                    (status: pending)
```

### 3.6 Payment Flow

```
Customer ──► POST /api/orders/[id]/payment ──► Route Handler
                                                      │
                                        ┌──────────────┴──────────────┐
                                        │ 1. Verify order belongs to  │
                                        │    customer                  │
                                        │ 2. Save payment proof URL   │
                                        │ 3. If COD: no change         │
                                        │ 4. If transfer: update       │
                                        │    deposit_paid flag         │
                                        └─────────────────────────────┘
                                                      │
                                                  Notify staff
                                                      │
                                                      ▼
                                           Staff verifies payment
                                           Updates status → production
```

### 3.7 Reorder Flow

```
Customer ──► GET /api/reorder?order_id=XXX ──► Route Handler
                                                      │
                                        ┌──────────────┴──────────────┐
                                        │ 1. Fetch previous order     │
                                        │ 2. Pre-fill all specs       │
                                        │ 3. Customer adjusts qty     │
                                        │ 4. POST /api/orders         │
                                        │    (new order, same specs)  │
                                        └─────────────────────────────┘
                                                      │
                                               New order created
```

### 3.8 Staff Order Status Update

```
Staff ──► PATCH /api/orders/[id]/status ──► Route Handler
                                                  │
                                        ┌──────────┴──────────┐
                                        │ 1. Verify staff role │
                                        │ 2. Validate status   │
                                        │    transition        │
                                        │ 3. Update order      │
                                        │ 4. Insert status     │
                                        │    history entry     │
                                        │ 5. Notify customer   │
                                        │    (via Realtime)    │
                                        └─────────────────────┘

---

## 4. External API Integration Pattern

### 4.1 AI Recommendation (OpenAI)

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  Browser  │     │  Route Handler    │     │  OpenAI API   │
│           │     │                   │     │              │
│  Form     │────►│  1. Auth check    │     │              │
│  submit   │     │  2. Validate      │────►│  GPT-4o-mini  │
│           │     │  3. Build prompt  │     │              │
│           │     │  4. Call OpenAI   │◄────│  Response     │
│           │     │  5. Save to DB    │     │              │
│           │◄────│  6. Return result │     │              │
└──────────┘     └──────────────────┘     └──────────────┘
```

### 4.2 Mockup Rendering (Image Generation / Canvas)

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  Browser  │     │  Route Handler    │     │  Image API    │
│           │     │                   │     │  (FAL/... )   │
│  Upload   │────►│  1. Receive file  │     │              │
│  logo +   │     │  2. Upload to     │────►│  Generate     │
│  specs    │     │     Supabase       │     │  mockup       │
│           │     │     Storage        │◄────│              │
│           │◄────│  3. Return mockup  │     │              │
│  Preview  │     │     URL            │     │              │
└──────────┘     └──────────────────┘     └──────────────┘
```

**Alternative — Client-side mockup**: Use a canvas library (html2canvas, Fabric.js) directly in the browser. No server needed for simple mockups.

---

## 5. Supabase Auth — Role Design

| Role | Access | Pages |
|---|---|---|
| **Anonymous** | View products, submit consultation, view AI recommendation | Landing, consultation form, recommendation result |
| **Customer** | Own orders, own profile, reorder, order history, payment proof upload | Customer dashboard, orders, history, reorder, profile |
| **Sales** | All consultations (review & confirm price), all orders (update status), all customers | Staff dashboard, consultations, orders, customers |
| **Admin** | All sales permissions + product catalog management, settings | Staff dashboard + products management |

Supabase Auth handles JWT. Role is stored in `profiles` table with RLS.

```sql
-- Profiles table for role-based access
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'sales', 'admin')),
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: customer can read own profile
CREATE POLICY "customer_select_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS: sales can read all profiles
CREATE POLICY "sales_select_all_profiles"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('sales', 'admin'));
```

### Order Status State Machine

```
pending → staff_review → confirmed → deposit_paid (if over threshold)
                                     → production → completed → delivered
                                     → cancelled (any stage)
```

| Status | Who sets it | Customer sees |
|---|---|---|
| `pending` | System | ⏳ Đang chờ xác nhận |
| `staff_review` | Staff reviewing | 👀 Staff đang xem xét |
| `confirmed` | Staff | ✅ Đã xác nhận |
| `deposit_paid` | Customer upload + Staff verify | 💰 Đã đặt cọc |
| `production` | Staff | 🔧 Đang sản xuất |
| `completed` | Staff | 📦 Hoàn thành |
| `delivered` | Staff | ✅ Đã giao |
| `cancelled` | Staff | ❌ Đã hủy |

### Payment Methods

| Method | How it works | When |
|---|---|---|
| **COD** | Pay on delivery | Default option |
| **Bank Transfer (full)** | Pay full amount when ordering | Small orders |
| **Bank Transfer (deposit)** | Pay 50% deposit, rest on delivery | Orders over threshold (e.g. 5,000,000đ) |

---

## 6. Performance Considerations

| Concern | Solution |
|---|---|
| **Slow AI API calls** | Route Handlers — user sees loading state, not blocking page render |
| **Database queries** | Server Components fetch data — no client waterfall |
| **Images** | Supabase Storage with CDN + Next.js Image optimization |
| **Realtime updates** | Supabase Realtime (WebSocket) for order status changes |
| **Form validation** | Client-side validation (instant) + server-side validation (secure) |

---

## 7. Error Handling Pattern

```typescript
// app/api/ai/recommend/route.ts — with proper error handling
export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate
    const body = await request.json()
    if (!body.productType || !body.dimensions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // AI call
    const result = await getRecommendation(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 8. Modularity, Scalability & Future-Proofing

### 8.1 Architecture Decision Records

| Decision | Rationale | Future-proofing |
|---|---|---|
| **Feature modules** (`features/`) | Components/hooks/logic co-located by domain | Adding "reviews" feature = new `features/reviews/` folder, no existing code touched |
| **Data access layer** (`lib/data/`) | All Supabase queries in one place per entity | Switching DB or ORM = rewrite `lib/data/` only, UI untouched |
| **AI provider abstraction** (`lib/ai/`) | `AIProvider` interface with multiple implementations | Adding Gemini = new `lib/ai/providers/gemini.ts`, config change |
| **Config-driven business rules** (`lib/config/`) | Pricing, thresholds, feature flags in config | Changing deposit % = edit `lib/config/pricing.ts`, no code change |
| **Thin Route Handlers** | `app/api/*` only validates + delegates | Adding webhook endpoint = new route, existing logic reused |
| **Server Components first** | Data fetching on server, minimal client JS | Adding new page = Server Component, no client state needed |

### 8.2 Adding a new feature — step by step

Example: Adding a "Customer Reviews" feature later:

```
1. features/reviews/
   ├── components/ReviewForm.tsx
   ├── components/ReviewList.tsx
   ├── hooks/useReviews.ts
   └── types.ts

2. lib/data/reviews.ts        ← Data access for reviews table

3. app/api/reviews/route.ts   ← Route Handler (delegates to lib/data)

4. app/(public)/reviews/      ← Page (uses features/reviews components)
```

**Zero changes to existing code.** The old features don't know reviews exist.

### 8.3 Swapping AI provider — step by step

```
1. lib/ai/providers/anthropic.ts   ← New provider implementation
   implements AIProvider interface

2. lib/ai/client.ts                ← Change provider name in config
   const provider = getProvider('anthropic')

3. .env.local                      ← Add ANTHROPIC_API_KEY
```

**Zero changes to feature code.** Consultation feature calls `lib/ai/client.ts` — it doesn't know which provider is behind it.

### 8.4 Changing pricing rules — step by step

```
// lib/config/pricing.ts
export const PRICING = {
  depositThreshold: 5_000_000,    // VND — orders above this need deposit
  depositPercent: 50,              // 50% deposit
  volumeDiscounts: [
    { minQty: 100, discount: 0.05 },   // 5% off
    { minQty: 500, discount: 0.10 },   // 10% off
    { minQty: 1000, discount: 0.15 },  // 15% off
  ],
  minOrderQuantity: 10,
}
```

Changing the deposit threshold from 5M to 3M = one line edit. No code changes.

### 8.5 Feature flags pattern

```typescript
// lib/config/features.ts
export const FEATURES = {
  mockupPreview: true,          // Toggle mockup feature
  reorderReminder: false,       // Coming in Phase 2
  autoPricing: false,           // Staff must confirm price (MVP)
  b2bContractPortal: false,     // Future phase
}

// Usage in components
import { FEATURES } from '@/lib/config/features'

export default function ConsultationResult() {
  return (
    <div>
      <RecommendationCard />
      {FEATURES.mockupPreview && <MockupPreview />}  {/* Hide/Show */}
      <OrderForm />
    </div>
  )
}
```

### 8.6 Scalability considerations

| Concern | Strategy |
|---|---|
| **Database growth** | Supabase indexes, pagination (all list queries), connection pooling |
| **User growth** | Stateless Next.js (scale horizontally on Vercel), Supabase auto-scales |
| **AI API costs** | Cache AI recommendations in DB, only re-query on spec change |
| **Team size** | Feature isolation = parallel development. Each dev works in their own `features/` folder |
| **Mobile app future** | API routes in `app/api/` serve as backend for mobile too. Same `lib/data/` and `lib/ai/` reused |
| **Multiple factories** | `profiles` table has `factory_id` field (future). Add tenant isolation via RLS later |

### 8.7 What NOT to over-engineer for MVP

| Don't | Why |
|---|---|
| Microservices | 4 IT devs, 1 app — monolith in Next.js is perfect |
| Event bus / message queue | Supabase Realtime is enough for MVP |
| Full test suite | Manual testing + basic smoke tests for MVP |
| Multi-tenant | Single factory now, add `factory_id` column later |
| Docker | Vercel deployment is simpler |
| Separate admin app | Admin is just a route group `(staff)/` |

---

## 9. Summary — Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend server? | **No** — Next.js handles it | Simpler deployment, fewer moving parts |
| Security? | **RLS + Route Handlers** | Two-tier: RLS for client, service_role for server |
| External API keys? | **Server-only env vars** | Never exposed to browser |
| AI calls? | **Route Handlers** | Call OpenAI from server, return result to client |
| State management? | **Server Components + Supabase** | No Redux needed for MVP |
| Forms? | **Client Components** | Interactive, but submit to Route Handlers |
| Styling? | **TailwindCSS** | Consistent, fast, Tasteskill-compatible |