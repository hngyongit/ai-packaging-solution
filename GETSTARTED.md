# Bắt đầu — AI Carton Packaging Solution

> Dành cho developer mới vào team. Đọc file này đầu tiên sau khi clone.

---

## 1. Mục lục docs

| File | Đọc khi nào |
|------|-------------|
| **`docs/GETSTARTED.md`** | ← Bạn đang ở đây. Tổng quan, setup, workflow. |
| `docs/DEVELOPMENT_GUIDE.md` | Trước khi code — conventions, folder structure, coding rules, libraries. |
| `docs/ARCHITECTURE.md` | Trước khi viết API route, data access, auth — security model, two-tier access, data flow. |
| `docs/DATABASE_SCHEMA.md` | Trước khi query Supabase — tables, columns, RLS policies, indexes. |
| `docs/USER_FLOWS.md` | Trước khi tạo page mới — customer journey, order state machine, navigation map. |
| `docs/UI_RULES.md` | Trước khi tạo UI component — design tokens, Tailwind classes, component templates. |
| `docs/SCREEN_DESCRIPTIONS.md` | Khi cần specification chi tiết từng màn hình. |

---

## 2. Project overview

**EXE201** — Nền tảng AI tư vấn, báo giá, đặt hàng bao bì carton.

```
Khách hàng → nhập thông số sản phẩm → AI đề xuất hộp (kích thước/chất liệu/giá)
→ đặt hàng → staff xác nhận giá → sản xuất → giao hàng
```

### Stack

| Layer | Công nghệ | Mục đích |
|-------|-----------|----------|
| Framework | Next.js 14+ (App Router) | Fullstack — server components + API routes |
| Styling | TailwindCSS | Utility-first CSS |
| Database & Auth | Supabase (PostgreSQL) | DB, Auth, Storage, Realtime |
| AI/LLM | OpenAI API | Đề xuất quy cách hộp |
| Deployment | Vercel | Next.js-native hosting |

**Không có backend riêng** — Next.js Route Handlers (`src/app/api/*`) làm backend.

---

## 3. clone & chạy local

### Yêu cầu

- Node.js 18+ (khuyên dùng 20 LTS)
- npm hoặc pnpm
- Supabase CLI (nếu muốn chạy Supabase local)
- Tài khoản Supabase (cloud) + OpenAI API key

### Bước 1 — Clone

```bash
git clone <repo-url>
cd AI_Packaging_solution
npm install
```

### Bước 2 — Environment

```bash
cp .env.example .env.local
```

Sửa `.env.local`:

```env
# Supabase (lấy từ Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **`.env.local`** đã có trong `.gitignore` — không bao giờ commit file này.

### Bước 3 — Database (Supabase)

**Option A: Dùng Supabase cloud (khuyến nghị)**

1. Tạo project tại [supabase.com](https://supabase.com)
2. Copy URL + keys vào `.env.local`
3. Chạy migration (nếu có) hoặc apply schema từ `docs/DATABASE_SCHEMA.md`
4. Bật RLS trên tất cả tables theo policies trong `docs/DATABASE_SCHEMA.md`

**Option B: Supabase local**

```bash
supabase start
supabase db push
```

Supabase Studio mở tại `http://localhost:54323`.

### Bước 4 — Chạy dev

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## 4. Cấu trúc project

```
AI_Packaging_solution/
├── docs/                        # Tài liệu dự án
├── src/
│   ├── app/                     # Next.js App Router (routes — không business logic)
│   │   ├── (public)/            # Route group — public (no auth)
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── consultation/    # AI consultation form
│   │   │   │   └── result/      # AI recommendation result
│   │   │   ├── order/           # Place order
│   │   │   ├── about/           # Factory info
│   │   │   └── pricing/         # Pricing guide
│   │   ├── (guest)/             # Route group — guest-only (login, register)
│   │   ├── (auth)/              # Route group — cần login
│   │   │   └── dashboard/       # Customer portal
│   │   │       ├── orders/
│   │   │       ├── history/
│   │   │       ├── reorder/
│   │   │       └── profile/
│   │   ├── (staff)/             # Route group — staff only
│   │   │   └── staff/
│   │   │       ├── consultations/
│   │   │       ├── orders/
│   │   │       ├── customers/
│   │   │       └── products/
│   │   └── api/                 # Route Handlers
│   │       ├── ai/recommend/    # → gọi OpenAI → trả recommendation
│   │       ├── ai/mockup/       # → generate mockup
│   │       ├── consultations/   # CRUD consultations
│   │       ├── orders/          # + status, payment
│   │       ├── products/
│   │       ├── upload/
│   │       └── reorder/
│   │
│   ├── features/                # Feature modules (self-contained)
│   │   ├── consultation/        # components/, hooks/, utils.ts, types.ts
│   │   ├── orders/
│   │   ├── products/
│   │   ├── auth/
│   │   └── staff/
│   │
│   ├── components/              # Shared components
│   │   ├── ui/                  # shadcn/ui primitives (Button, Input, Card...)
│   │   └── layout/              # Header, Footer, Sidebar, DashboardNav
│   │
│   ├── lib/                     # Shared infrastructure
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client (anon key + RLS)
│   │   │   └── server.ts        # Server client (service_role key)
│   │   ├── data/                # Data access layer — DB queries
│   │   ├── ai/                  # AI provider abstraction (OpenAI, mock)
│   │   ├── config/              # Feature flags, constants, pricing rules
│   │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│   │
│   ├── hooks/                   # Shared hooks
│   └── types/                   # Shared types
│       └── database.ts          # Supabase-generated types
│
├── supabase/                    # Supabase config + migrations
├── public/                      # Static assets
├── .env.example
├── .env.local                   # Gitignored — local env vars
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

---

## 5. Route groups — vai trò & luồng

| Route group | Auth required | Vai trò |
|-------------|---------------|---------|
| `(public)/` | ❌ | Landing, consultation, about, pricing, order placement |
| `(guest)/` | ❌ (chỉ guest) | Login, register — redirect về dashboard nếu đã login |
| `(auth)/` | ✅ | Dashboard, orders, history, reorder, profile |
| `(staff)/` | ✅ staff role | Quản lý consultations, orders, customers, products |

Public routes dùng `<Navbar>` + `<Footer>`. Auth routes thêm `<DashboardNav>` sidebar. Staff routes thay bằng `<StaffSidebar>`.

### Anonymous consultation

- **AI Consultation**: Không cần login — anonymous có thể submit consultation request
- **Placing Order**: Phải login/register để đặt hàng
- **Session handling**: Anonymous consultations tracked by device. Khi user register sau, có thể link qua phone/email.

---

## 6. Security model (tóm tắt)

### Two-tier Supabase access

```
Browser (untrusted)
  └── anon key → chỉ data RLS cho phép

Server (trusted)
  └── service_role key → full admin access
  └── OPENAI_API_KEY → gọi OpenAI
```

| Key | Ở đâu? | Công dụng |
|-----|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Query qua RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin DB access |
| `OPENAI_API_KEY` | Server only | Gọi OpenAI API |

### RLS policies

- `products` — public read, admin write
- `consultations` — public insert, customer read own, staff read all
- `orders` — customer read own, staff read all
- `profiles` — customer read/update own, staff read all

---

## 7. Kiến trúc data flow

### Public data (product catalog)

```
Server Component → Supabase (anon + RLS) → HTML
```

### Form submission (AI consultation)

```
Client Form → POST /api/ai/recommend → Route Handler
  → gọi OpenAI API
  → lưu xuống Supabase (service_role)
  → trả kết quả về client
```

### Order flow

```
Consultation → Place Order → staff_review → confirmed
  → deposit_paid (nếu > 5,000,000đ)
  → production → completed → delivered
  → cancelled (bất kỳ stage nào)
```

### Payment methods

- **COD** — Thanh toán khi nhận hàng
- **Bank transfer** — Đặt cọc 50% cho đơn > 5,000,000đ

---

## 8. Development workflow

### Khi thêm feature mới

1. Tạo feature module: `src/features/<feature>/`
   - `components/`, `hooks/`, `utils.ts`, `types.ts`
2. Tạo page: `src/app/.../page.tsx`
3. Tạo API route (nếu cần): `src/app/api/.../route.ts`
4. Thêm data access: `src/lib/data/<feature>.ts`
5. Thêm config (nếu cần): `src/lib/config/`

### Coding conventions (tóm tắt)

- **TypeScript strict mode** — mọi file
- **File naming**: `kebab-case.tsx` — component files; `PascalCase` cho component names
- **Component exports**: `export default function` cho pages, named exports cho shared components
- **CSS**: Tailwind utility classes — không CSS modules
- **Import order**: React → Next.js → Third-party → Local

### Libraries được dùng

| Mục đích | Library |
|----------|---------|
| UI base | shadcn/ui (components/ui/) + Tailwind |
| Icons | `@phosphor-icons/react` (không dùng lucide cho icon mới) |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Class merge | `clsx` + `tailwind-merge` → `cn()` helper |
| Animation | `motion` (framer-motion) |
| Dates | `date-fns` |

### Libraries không dùng

- ❌ Redux / React Query — Server Components + Supabase SDK đủ
- ❌ Axios — dùng native `fetch` hoặc Supabase SDK
- ❌ MUI / Chakra / Ant Design — Tailwind + shadcn
- ❌ NextAuth.js — Supabase Auth
- ❌ Lodash — import function riêng nếu cần

---

## 9. Chạy production build

```bash
npm run build
npm start
```

Build output kiểm tra lỗi TypeScript + ESLint.

---

## 10. Câu hỏi thường gặp

**Q: Cần biết gì trước khi code?**
Đọc `docs/DEVELOPMENT_GUIDE.md` + `docs/ARCHITECTURE.md` để hiểu conventions và security model.

**Q: Feature flags ở đâu?**
`src/lib/config/features.ts` — toggle consultation, mockup, reorder, savedProducts.

**Q: Constants (status labels, URLs) ở đâu?**
`src/lib/config/constants.ts` — `ORDER_STATUS_LABELS`, `APP_URLS`, `SITE_NAME`.

**Q: Pricing rules (thresholds, deposit %) ở đâu?**
`src/lib/config/pricing.ts`.

**Q: File mới không có `features/` folder tương ứng?**
Tạo mới theo pattern: `src/features/<name>/` với components/, hooks/, utils.ts, types.ts.

**Q: Cần thay đổi API route?**
Route Handlers ở `src/app/api/` — thin layer, gọi xuống `src/lib/data/`. Business logic không nằm trong route handler.