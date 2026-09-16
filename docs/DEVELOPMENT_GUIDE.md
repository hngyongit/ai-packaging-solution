# Development Guide — AI Carton Packaging Solution

> **EXE201 Project** — Nền tảng AI tư vấn, báo giá, chăm sóc khách hàng và hỗ trợ sản xuất bao bì carton

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14.2 (App Router) | Fullstack — server components + API routes |
| **Styling** | TailwindCSS | Utility-first CSS, consistent design system |
| **Database & Auth** | Supabase | PostgreSQL DB, Auth, Storage (file upload) |
| **UI primitives** | `@base-ui/react` + shadcn (style `base-nova`) | `src/components/ui/` — KHÔNG phải Radix |
| **AI/LLM** | ai-box (OpenAI-compatible) qua SDK `openai` v7 | Text recommendation (`deepseek-v4-flash-0731`) + ảnh mockup in (`/v1/images/edits`, `qwen-image-3.0`) |
| **Ảnh thành phẩm** | Cloudinary | Mockup in + khuôn bế có hình in, upload server-side |
| **Deployment** | Vercel (recommended) | Next.js-native hosting, edge-ready |

### No separate backend server

Next.js Route Handlers (`app/api/*`) serve as the backend. No Express/Fastify/Node.js server needed.

---

## 2. Folder Structure

> **Single source of truth cho cây thư mục đầy đủ: `GETSTARTED.md` §4.** Ở đây chỉ giữ quy ước tổ chức — cây thư mục chi tiết dễ lỗi thời hơn bất kỳ mục nào khác trong docs.

```
src/
├── middleware.ts                  # Gate theo pathname (login), KHÔNG check role
├── app/                           # ROUTES ONLY — không business logic
│   ├── (public)/                  # / , about, pricing, consultation, dieline-lab, order
│   ├── (guest)/                   # login, register
│   ├── (auth)/dashboard/          # orders/[id], history, reorder, profile
│   ├── (staff)/staff/             # ⚠️ toàn bộ đang render <UnderDevelopmentPage/>
│   ├── api/                       # Route Handlers — thin, delegate xuống lib/data
│   └── globals.css                # Design tokens (oklch CSS vars) + reveal utilities
├── features/                      # Feature modules (self-contained)
│   ├── dieline/DielinePreview.tsx
│   └── products/                  # CatalogTable, PriceTierCards, types, utils
├── components/
│   ├── ui/                        # primitives (base-ui + shadcn, style base-nova)
│   ├── layout/  modals/  order/   # PascalCase cho shared component
├── lib/
│   ├── supabase/                  # client.ts (browser) · server.ts (createClient / createAdminClient)
│   ├── data/                      # ← DATA ACCESS: consultations, orders, order-shared, products, boxes
│   ├── ai/                        # index.ts (factory) · types.ts · mockup.ts · context.md (prompt) · providers/
│   ├── dieline/                   # engine mm→SVG (index.ts, print-faces.ts) — thuần, không React
│   ├── mockup/                    # request · generate · handoff — điều độ gen ảnh mockup
│   ├── cloudinary/                # upload server-side (signed / preset)
│   ├── images/                    # dimensions.ts
│   └── config/                    # features · pricing · constants · print-positions
└── types/database.ts

scripts/                           # seed.mjs · dieline-selfcheck.mts · mockup-selfcheck.mts
supabase/                          # config.toml · migrations/ (KHÔNG có seed.sql)
components.json                    # shadcn CLI (style base-nova, iconLibrary phosphor)
```

**Những thứ các bản doc cũ nhắc tới nhưng KHÔNG tồn tại:** `src/hooks/`, `src/features/{orders,auth,staff}/`, `src/features/consultation/` (folder rỗng — component thật nằm ở `src/app/(public)/consultation/`), `lib/data/{profiles,upload}.ts`, `lib/ai/client.ts`, `supabase/seed.sql`, `public/`, `next.config.ts` (thật là `.mjs`), `docs/SRS.md`.

### Key design principles

| Principle | What it means | How it's enforced |
|---|---|---|
| **Feature isolation** | UI chuyên biệt của 1 screen nằm cạnh screen đó (`app/(public)/consultation/`); thứ dùng chung nhiều nơi mới lên `features/` hoặc `components/` | Thêm feature = tạo folder mới + route + hàm trong `lib/data/` — không sửa code cũ |
| **Data access layer** | Mọi DB query đi qua `lib/data/` | Route Handlers gọi `lib/data/`, không `supabase.from()` trực tiếp. Đổi schema = chỉ sửa `lib/data/` + types |
| **Provider abstraction** | AI provider đổi được | `src/lib/ai/index.ts` (`getAIProvider()`) chọn theo env: có `AI_API_KEY` (khác placeholder) → `OpenAIProvider`, không có → `MockProvider`. Thêm provider = file mới trong `providers/` + 1 nhánh ở `getAIProvider()`. ⚠️ Interface `AIProvider` chỉ cover text recommendation — tạo ảnh mockup (`lib/ai/mockup.ts`) là đường riêng, đổi provider KHÔNG đổi mockup |
| **Configuration-driven** | Business rule nằm trong config | `lib/config/pricing.ts` (ngưỡng cọc), `print-positions.ts` (vùng in theo kiểu thùng), `constants.ts` (labels) |
| **Thin routes** | `app/api/*` chỉ parse + delegate | Validate bằng zod → gọi `lib/data/` → trả response — không business logic |
| **Pure geometry** | Khuôn bế tính toán thuần, không DOM/IO | `lib/dieline/` gọi được từ route handler, test được bằng `scripts/dieline-selfcheck.mts` |

---

## 3. Coding Conventions

### General

- **Language**: TypeScript everywhere — strict mode
- **Components**: Use `export default function` for page components, named exports for shared components
- **File naming** (theo thực tế repo): shared/presentational component → `PascalCase.tsx` (`src/components/modals/PriceChange.tsx`, `src/features/dieline/DielinePreview.tsx`); file cục bộ nằm cạnh page + primitive `components/ui/` → `kebab-case.tsx` (`consultation-form.tsx`, `ui/badge.tsx`); hook/util/type → `camelCase.ts`. Tên component luôn PascalCase.
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

Pattern thật — validate bằng zod, delegate xuống `lib/data/`. Không dùng `createRouteHandlerClient`; server helper là `createClient()` / `createAdminClient()` từ `@/lib/supabase/server`.

```ts
// app/api/ai/recommend/route.ts — public endpoint, KHÔNG gate auth
import { NextRequest, NextResponse } from 'next/server'
import { consultationInputSchema } from '@/lib/data/consultations'
import { getAIProvider } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const parsed = consultationInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { id } = await createConsultation(parsed.data)      // lưu phôi trước khi gọi AI
  const recommendation = await getAIProvider().recommend(parsed.data, catalog)
  await updateAIRecommendation(id, recommendation)
  return NextResponse.json({ id, recommendation })
}
```

Route nào cần session thì tự check và trả 401 (`src/app/api/upload/route.ts`). Route cần role thì đọc `profiles.role` bằng service client rồi tự enforce (`isStaff()` trong `src/app/api/orders/[id]/status/route.ts`) — middleware chỉ check đã login, không check role.

### Supabase client — two-tier pattern

```typescript
// src/lib/supabase/client.ts — Browser: anon key + RLS
import { createBrowserClient } from '@supabase/ssr'

// src/lib/supabase/server.ts — Server, HAI factory trong 1 file
export async function createClient()        // anon key + cookies → đi qua RLS
export async function createAdminClient()   // SUPABASE_SERVICE_ROLE_KEY → bypass RLS
```

Thiếu env → `server.ts` ném `Error('NEXT_PUBLIC_SUPABASE_URL is not set')` chứ không fallback im lặng. `createAdminClient()` tắt `autoRefreshToken`/`persistSession` vì không có session browser.

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

**Vượt ngưỡng đã biết (repo hiện tại)** — targets, không phải chuẩn mực:

| File | Lines | Lý do |
|---|---|---|
| `src/lib/dieline/index.ts` | 669 | Engine port từ `dieline.js`, giữ 1 file để đối chiếu byte-by-byte với `scripts/dieline-selfcheck.mts` |
| `src/features/dieline/DielinePreview.tsx` | 428 | Viewer + controls + downloads; tách được khi UI ổn định |
| `src/app/(public)/page.tsx` | 386 | Landing — từng section tách thành component được |
| `src/app/api/reorder/route.ts` | 384 | Cần xuống `lib/data/` |
| `src/app/api/orders/route.ts` | 341 | Cần xuống `lib/data/` |

→ Khi đụng các file này: không phình thêm; tách hoặc move logic xuống `lib/data/`.

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
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient()` | 🔒 Secret |
| `AI_API_KEY` | `getAIProvider()`, `lib/ai/mockup.ts` — thiếu thì fallback `MockProvider` | 🔒 Secret |
| `AI_BASE_URL` | AI endpoint, default `https://api.ai-box.vn/v1` | 🔒 Secret-adjacent |
| `AI_MODEL` | Text model, default `deepseek-v4-flash-0731` | Public |
| `AI_IMAGE_MODEL` | Mockup image model, default `qwen-image-3.0` | Public |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | `lib/cloudinary/upload.ts` (signed) | 🔒 Secret |
| `CLOUDINARY_UPLOAD_PRESET` | Tùy chọn — đặt vào → upload unsigned, bỏ HMAC | 🔒 Secret |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ có trong `.env.example` nhưng **code chưa đọc** | ✅ Public |

`.env.example` là danh sách biến thật — nguồn chuẩn nếu doc này và code lệch nhau.

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
| **`@base-ui/react`** | Primitive nền tảng cho `components/ui/` | Button/Select/Dialog thật bên dưới — KHÔNG phải Radix |
| **shadcn** (CLI + dep) | Sinh component theo style `base-nova` | Cấu hình ở `components.json`; `npx shadcn@latest add <tên>` |
| **`tw-animate-css`** | Animation utility classes | Đã cài |
| **`@phosphor-icons/react`** | Icon library chính (`iconLibrary: "phosphor"`) | Mọi icon mới. Trong Server Component: deep import `@phosphor-icons/react/dist/ssr` |

Primitive hiện có trong `src/components/ui/`: `button, input, select, textarea, label, card, badge, modal, separator, status-badge, status-timeline, empty-state, error-state, FadeIn`. **Không có** `table`/`form`/`dialog` — bảng tự viết ở `src/features/products/components/CatalogTable.tsx`, modal là `modal.tsx` (wrap Dialog của base-ui).

⚠️ `shadcn` **là dependency thật** (`package.json`), không còn "copy-paste rồi xoá". `lucide-react` còn sót trong `package.json` + đúng 1 file (`components/ui/select.tsx`) — không thêm chỗ mới.

### 8.2 State Management

| Concern | Solution | Why |
|---|---|---|
| **Server state** (DB data) | React Server Components + Supabase | No client cache needed. Fetch on server, render HTML |
| **Form state** | React Hook Form + Zod | Performant, minimal re-renders, built-in validation |
| **Global UI state** (auth, theme) | React Context (lightweight) | One context for auth, one for theme. No Redux |
| **URL state** | `useSearchParams()` — bộ lọc/modal đơn hàng (`?modal=create`, `?orderId=` ở `order-modals.tsx`; `?status&page&search` ở `history/page.tsx`), `?id=` cho trang kết quả tư vấn, `?consultation=` cho print handoff | Shareable, back-button safe |
| **Complex client state** (future) | Zustand (only if needed) | Chưa cài. Chỉ thêm nếu Server Components + Context không đủ |

⚠️ **Không còn "consultation step" trong URL.** Tư vấn là MỘT trang: form cột trái, kết quả AI + panel mockup render inline ở cột phải (`consultation-form.tsx`, `consultation-live-result.tsx`). Bản full-page chia sẻ được là route riêng `/consultation/result?id=`. Doc cũ mô tả `?step=result` / `?step=mockup` — **route đó không tồn tại**.

Semantic state của đơn hàng dùng helper trong `src/lib/data/order-shared.ts` (`canReorderOrder`, `canCustomerCancelOrder`, `getOrderProgress`) — đừng tái dựng điều kiện status trong JSX.

### 8.3 Form Validation

| Library | Purpose | Usage |
|---|---|---|
| **Zod** | Schema validation | Define types + validators in one place |
| **@hookform/resolvers** | Bridge Zod → React Hook Form | `resolver={zodResolver(schema)}` |

Schema có sẵn — **import, đừng định nghĩa lại**:

| Form | Client schema | Server schema |
|---|---|---|
| Tư vấn | `src/app/(public)/consultation/consultation-schema.ts` | `consultationInputSchema` trong `src/lib/data/consultations.ts` |
| Đặt hàng | `src/app/(public)/order/order-schema.ts` | validate trong `src/app/api/orders/route.ts` |

Field thật của form tư vấn (`consultation-schema.ts`): `productType`, `boxStyle` (optional enum — bỏ trống để AI tự chọn), `lengthCm`, `widthCm`, `heightCm`, `weightGrams`, `desiredQuantity`, `hasPrinting`, `notes` (≤100). Kích thước dùng `z.coerce.number()` vì input HTML trả string.

Quy ước: mọi schema số lượng/kích thước khai báo `coerce` + `.positive()` + `.max()` rõ ràng, message tiếng Việt.

### 8.4 Utility Libraries

TẤT CẢ đã ở `package.json` — **không cần `npm install`**, chỉ `npm install` một lần khi mới clone.

| Library | Purpose | Trạng thái |
|---|---|---|
| **clsx** + **tailwind-merge** | `cn()` helper | ✅ đã cài |
| **date-fns** | Date formatting | ✅ đã cài |
| **@phosphor-icons/react** | Icons | ✅ đã cài |
| **motion** + **tw-animate-css** | Animation | ✅ đã cài |
| **openai** v7 | SDK gọi endpoint OpenAI-compatible (ai-box) | ✅ đã cài |
| **@base-ui/react** + **shadcn** | UI primitives | ✅ đã cài |
| **tsx** | Chạy `scripts/*.mts` | ✅ đã cài (dev) |
| **recharts** | Biểu đồ staff dashboard | ❌ chưa cài — chỉ thêm khi làm UI staff thật |
| **zustand** | Client state phức tạp | ❌ chưa cài |
| **lucide-react** | ⚠️ còn sót, dùng ở đúng 1 file (`components/ui/select.tsx`) — không mở rộng |

**Utility wrapper** (`src/lib/utils.ts`):
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Formatting tiền/ngày **không** nằm ở `lib/utils.ts` — dùng `src/lib/data/order-shared.ts`: `formatCurrency` (VND, `Intl.NumberFormat('vi-VN')`), `formatDateTime` (`timeZone: 'Asia/Ho_Chi_Minh'`), `toNumber` (numeric DECIMAL trả về dạng string từ Supabase).

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
# 1. Install (một lần — mọi dependency đã ở package.json)
npm install

# 2. Environment
cp .env.example .env.local
# Điền SUPABASE_* (bắt buộc), AI_API_KEY (tuỳ chọn — thiếu thì chạy MockProvider),
# CLOUDINARY_* (tuỳ chọn — thiếu thì UI ẩn tính năng mockup)

# 3. Database — BẮT BUỘC, nếu không thì không login được (test account tạo bởi seed.mjs)
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push        # 6 migration: schema + RLS + products + box_styles + print mockup
npm run db:seed             # 3 tài khoản test + 1 consultation + 1 order

# 4. Run
npm run dev                 # next dev --turbo

# 5. (tuỳ chọn) Self-check gate cho luồng dieline/mockup
npx tsx scripts/dieline-selfcheck.mts
npx tsx scripts/mockup-selfcheck.mts
```

Không cần `npx shadcn add` cho setup ban đầu — primitive đã commit trong `src/components/ui/`.

---

## 10. Deployment

- **Platform**: Vercel (recommended for Next.js)
- **Environment variables**: set all of §5 in Vercel dashboard. Thiếu `SUPABASE_SERVICE_ROLE_KEY` → mọi route ghi hình. Thiếu `AI_API_KEY` → app vẫn chạy nhưng trả kết quả mock. Thiếu `CLOUDINARY_*` → `/api/ai/mockup` trả 503, UI tự ẩn mockup (đặt hàng vẫn được).
- **Supabase**: use Supabase production project, `npx supabase db push` trước khi deploy
- **Build**: `npm run build` — vercel auto-detects Next.js
- **⚠️ Images**: `next.config.mjs` chỉ whitelist `picsum.photos` trong `images.remotePatterns`. Ảnh Cloudinary/Supabase hiện render bằng `<img>` thô (`src/components/order/print-preview-strip.tsx`). Muốn dùng `next/image` → thêm `res.cloudinary.com` + host Supabase vào `remotePatterns` trước khi deploy.

---

## 11. Quality Checklist Before Merge

- [ ] No `console.log` left in production code
- [ ] No API keys in client-side code — key AI/Cloudinary chỉ đọc trong file server, không `NEXT_PUBLIC_`
- [ ] Không hard-code `https://api.ai-box.vn` — luôn đọc `AI_BASE_URL`
- [ ] RLS policies enabled on all tables (migration mới có bảng = có policy)
- [ ] Route handler dùng `createAdminClient()` phải tự check `profiles.role` / ownership (nó bypass RLS)
- [ ] TypeScript strict mode — no `any` types
- [ ] File within size limits (200 lines component, 80 lines route handler) — xem §4.1 cho ngoại lệ đã biết
- [ ] No duplicate code — checked existing components/data first
- [ ] Early return for error/edge cases
- [ ] One responsibility per component
- [ ] Tailwind classes follow UI_RULES.md conventions (semantic tokens, không palette raw mới)
- [ ] Mobile-responsive (Tailwind breakpoints)
- [ ] Loading states for async operations (`loading.tsx` skeleton)
- [ ] Error boundaries for user-facing components
- [ ] `npx tsx scripts/dieline-selfcheck.mts` xanh — nếu sửa `src/lib/dieline/`
- [ ] `npx tsx scripts/mockup-selfcheck.mts` xanh — nếu sửa `src/lib/mockup/`, `src/lib/ai/mockup.ts`, `src/lib/config/print-positions.ts`
- [ ] Schema đổi → có file trong `supabase/migrations/` + cập nhật `docs/DATABASE_SCHEMA.md` + `src/types/database.ts`