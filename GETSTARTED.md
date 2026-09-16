# Bắt đầu — AI Carton Packaging Solution

> Dành cho developer mới vào team. Đọc file này đầu tiên sau khi clone.

---

## 1. Mục lục docs

| File | Đọc khi nào |
|------|-------------|
| **`GETSTARTED.md`** | ← Bạn đang ở đây. Tổng quan, setup, workflow. |
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
| Framework | Next.js 14.2 (App Router) | Fullstack — server components + API routes |
| Styling | TailwindCSS | Utility-first CSS |
| Database & Auth | Supabase (PostgreSQL) | DB, Auth, Storage (file user upload) |
| UI primitives | `@base-ui/react` + shadcn (style `base-nova`) | Button/Select/Modal trong `src/components/ui/` |
| AI/LLM | ai-box (OpenAI-compatible, SDK `openai` v7) | Text: `deepseek-v4-flash-0731` — đề xuất quy cách hộp. Ảnh: `qwen-image-3.0` — mockup in. Không có `AI_API_KEY` → tự fallback `MockProvider` |
| Ảnh thành phẩm | Cloudinary (server-side upload) | Lưu mockup in + khuôn bế có hình in |
| Scripts | `tsx` | Chạy selfcheck `.mts` |
| Deployment | Vercel | Next.js-native hosting |

**Không có backend riêng** — Next.js Route Handlers (`src/app/api/*`) làm backend.

---

## 3. clone & chạy local

### Yêu cầu

- Node.js 18+ (khuyên dùng 20 LTS)
- npm hoặc pnpm
- Supabase CLI (nếu muốn chạy Supabase local)
- Tài khoản Supabase (cloud). API key ai-box **không bắt buộc** — thiếu thì app tự chạy `MockProvider`

### Bước 1 — Clone

```bash
git clone <repo-url>
cd ai-packaging-solution
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

# AI Provider (OpenAI-compatible — ai-box). Thiếu AI_API_KEY → app tự chạy MockProvider
AI_BASE_URL=https://api.ai-box.vn/v1
AI_MODEL=deepseek-v4-flash-0731
AI_API_KEY=your_ai_box_api_key
# Model ảnh cho mockup in (bỏ trống → qwen-image-3.0)
# AI_IMAGE_MODEL=qwen-image-3.0

# Cloudinary — nơi lưu ảnh mockup + khuôn bế có hình in
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
# Tùy chọn: preset "unsigned" → bỏ qua chữ ký HMAC (lách lỗi 401 ở tài khoản mới)
# CLOUDINARY_UPLOAD_PRESET=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **`.env.local`** đã có trong `.gitignore` — không bao giờ commit file này.

### Bước 3 — Database (Supabase cloud — khuyến nghị)

Mỗi dev tạo **Supabase project riêng** (free, 2 projects/account). Không dùng chung dev DB — data collision, reset không ảnh hưởng ai.

1. Mỗi người tạo project tại [supabase.com](https://supabase.com) (Sign up → New project)
2. Copy URL + keys vào `.env.local`
3. Cài Supabase CLI (nếu chưa có): https://supabase.com/docs/guides/cli
4. Link local với project của bạn:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
# project-ref: Supabase Dashboard → Project Settings → General → Reference ID
```

5. Chạy migration + seed:

```bash
npx supabase db push
npm run db:seed
```

- `supabase db push` — chạy 6 migration trong `supabase/migrations/` (init schema + RLS + seed 6 sản phẩm + box_style + `box_styles` + print mockup)
- `npm run db:seed` (= `node scripts/seed.mjs`) — tự đọc `.env.local`, tạo 3 tài khoản test qua Admin API + sync `profiles` + 1 consultation/1 order mẫu (idempotent)

`db:seed` chạy lại an toàn. **Nhưng** `init_schema.sql` mở đầu bằng `DROP TABLE ... CASCADE` — đừng áp lại thủ công migration đó lên DB đã có dữ liệu.

**Sau bước 3 bạn đã có sẵn:**
- 9 bảng + RLS policies (8 bảng init + `box_styles`)
- 6 sản phẩm mẫu (carton 3 lớp, 5 lớp) + 3 kiểu thùng (`rsc_a1`, `am_duong`, `mailer`)
- 3 tài khoản test (xem mục 11)
- 1 consultation mẫu, 1 đơn hàng mẫu

### Khi schema thay đổi

Sửa file trong `supabase/migrations/` hoặc tạo migration mới:

```bash
npx supabase migration new <tên-migration>
# sửa file vừa tạo trong supabase/migrations/
npx supabase db push
```

### Khi seed data thay đổi

Thêm seed INSERT vào migration mới hoặc dùng Supabase Dashboard → SQL Editor.

### Option: Supabase local

```bash
supabase start
supabase db reset     # chỉ chạy migrations — KHÔNG có supabase/seed.sql
npm run db:seed       # → phải chạy thêm bước này mới có tài khoản test
```

Supabase Studio local tại `http://localhost:54323`.

### Bước 4 — Chạy dev

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## 4. Cấu trúc project

```
ai-packaging-solution/
├── AGENT.md                      # Rulebook cho AI coding agent — đọc trước khi code
├── GETSTARTED.md                 # ← file này
├── docs/                         # Tài liệu dự án (ARCHITECTURE, DATABASE_SCHEMA,
│                                 #  DEVELOPMENT_GUIDE, SCREEN_DESCRIPTIONS, UI_RULES, USER_FLOWS)
├── scripts/
│   ├── seed.mjs                  # Tạo 3 tài khoản test + data mẫu (`npm run db:seed`)
│   ├── dieline-selfcheck.mts     # Đối chiếu SVG khuôn bế (`npx tsx ...`)
│   └── mockup-selfcheck.mts      # Check vùng in / artwork / endpoint AI
├── src/
│   ├── middleware.ts             # Gate theo pathname: /dashboard + /staff cần login
│   │                             #  ⚠️ CHƯA check role staff — chỉ check đã đăng nhập
│   ├── app/                      # Next.js App Router (routes — không business logic)
│   │   ├── (public)/             # Route group — public (no auth)
│   │   │   ├── page.tsx          # Landing page (scroll-reveal, hero animation)
│   │   │   ├── consultation/     # AI consultation — form + live result trên 1 màn
│   │   │   │   ├── consultation-form.tsx / -fields.tsx / -schema.ts
│   │   │   │   ├── consultation-live-result.tsx / -ready-state.tsx / -result.tsx
│   │   │   │   ├── print-mockup-panel.tsx / print-mockup-controls.tsx
│   │   │   │   ├── consultation-alternatives.tsx / step-indicator.tsx
│   │   │   │   └── result/       # /consultation/result?id=<uuid> — kết quả share được
│   │   │   ├── dieline-lab/      # /dieline-lab — xem trước khuôn bế (zoom/pan/SVG/PDF)
│   │   │   ├── order/            # Place order (+ print-handoff-notice.tsx)
│   │   │   ├── about/            # Factory info (+ components/)
│   │   │   └── pricing/          # Pricing guide (PriceTierCards + CatalogTable)
│   │   ├── (guest)/              # login/, register/ — redirect đi nếu đã login
│   │   ├── (auth)/dashboard/     # Customer portal: orders/[id]/, history/, reorder/, profile/
│   │   ├── (staff)/staff/        # ⚠️ MỌI trang đang render <UnderDevelopmentPage/>
│   │   ├── api/                  # Route Handlers
│   │   │   ├── ai/recommend/     # → createConsultation → provider.recommend → update
│   │   │   ├── ai/mockup/        # → khuôn bế + /v1/images/edits → Cloudinary (quota 3)
│   │   │   ├── auth/callback/    # Supabase Auth callback
│   │   │   ├── consultations/    ├── orders/ (+ [id]/status, [id]/payment)
│   │   │   └── products/  ├── upload/  └── reorder/
│   │   └── UnderDevelopmentPage.tsx
│   ├── features/                 # Feature modules (self-contained)
│   │   ├── dieline/DielinePreview.tsx
│   │   └── products/             # components/{CatalogTable,PriceTierCards}.tsx, types, utils
│   ├── components/               # Shared components
│   │   ├── ui/                   # primitives: button, input, select, textarea, label,
│   │   │                         #  card, badge, modal, separator, status-badge,
│   │   │                         #  status-timeline, empty-state, error-state, FadeIn
│   │   ├── layout/               # navbar, footer, DashboardNav, StaffSidebar
│   │   ├── modals/               # PascalCase: PaymentConfirmation, CancelOrder, PriceChange,
│   │   │                         #  UploadProof, CustomerQuickView, ProductEditDrawer, ...
│   │   └── order/                # print-preview-strip
│   ├── lib/                      # Shared infrastructure
│   │   ├── supabase/             # client.ts (browser, anon+RLS), server.ts (createClient / createAdminClient)
│   │   ├── data/                 # consultations, orders, order-shared, products, boxes
│   │   ├── ai/                   # index.ts (factory), types.ts, mockup.ts,
│   │   │   │                     #  context.md (prompt — sửa là đổi hành vi AI)
│   │   │   └── providers/        # openai.ts, mock.ts
│   │   ├── dieline/              # index.ts (engine mm→SVG), print-faces.ts
│   │   ├── mockup/               # request.ts, generate.ts, handoff.ts — điều độ gen ảnh
│   │   ├── cloudinary/upload.ts  # signed/unsigned upload server-side
│   │   ├── images/dimensions.ts  # đọc aspect ratio từ header ảnh
│   │   ├── config/               # features, constants, pricing, print-positions
│   │   └── utils.ts              # cn() (clsx + tailwind-merge)
│   └── types/database.ts
├── supabase/
│   ├── config.toml
│   └── migrations/               # 6 file — áp bằng `npx supabase db push`
├── components.json               # shadcn CLI config (style base-nova, iconLibrary phosphor)
├── next.config.mjs               # images.remotePatterns — hiện chỉ picsum.photos
├── .env.example                  # ĐÂY LÀ DANH SÁCH BIẾN THẬT, không phải docs/
└── package.json
```

> **Không tồn tại** (nhiều doc cũ còn nhắc): `src/hooks/`, `supabase/seed.sql`, `public/`, `src/features/{orders,auth,staff}/` — `src/features/consultation/` hiện là folder rỗng, component thật nằm ở `src/app/(public)/consultation/`.

---

## 5. Route groups — vai trò & luồng

| Route group | Auth required | Vai trò |
|-------------|---------------|---------|
| `(public)/` | ❌ | `/`, `/about`, `/pricing`, `/consultation` (form + live result cùng màn), `/consultation/result?id=`, `/dieline-lab`, `/order` |
| `(guest)/` | ❌ (chỉ guest) | `/login`, `/register` — redirect về dashboard nếu đã login |
| `(auth)/` | ✅ | `/dashboard` + `orders/[id]`, `history`, `reorder`, `profile` |
| `(staff)/` | ⚠️ chỉ cần login — **chưa enforce role staff** | `/staff/*` — hiện tất cả là placeholder |

> **Middleware** (`src/middleware.ts`) chỉ gate theo pathname: `/dashboard` + `/staff` yêu cầu đã đăng nhập, `/login` + `/register` redirect khi đã đăng nhập. **Không có chỗ nào check `profiles.role`** — RLS mới chặn được ở tầng DB. Matcher loại asset tĩnh.

Public routes dùng `<Navbar>` + `<Footer>`. Auth routes thêm `<DashboardNav>`. Staff routes dùng `<StaffSidebar>` nhưng **mọi trang `(staff)` đang render `<UnderDevelopmentPage/>`** — chưa có UI nghiệp vụ (modal/drawer trong `src/components/modals/` đã sẵn, chờ page nối vào).

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
  └── AI_API_KEY (ai-box) + CLOUDINARY_API_SECRET → gọi AI + upload ảnh
```

| Key | Ở đâu? | Công dụng |
|-----|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Query qua RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin DB access |
| `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`, `AI_IMAGE_MODEL`) | Server only | Chat recommend + tạo ảnh mockup |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server only | Signed upload ảnh mockup/khuôn bế |
| `CLOUDINARY_UPLOAD_PRESET` | Server only (tùy chọn) | Đặt vào → upload unsigned, bỏ chữ ký HMAC |

### RLS policies

- `products` / `box_styles` — public read (`box_styles`: chỉ `is_active`), admin write
- `consultations` — public insert, customer read/update own, staff read/update all
- `orders` — customer read own, staff read/update all (insert chỉ qua service_role ở server)
- `profiles` — customer read/update own, staff read all
- `order_items`, `order_status_history`, `saved_products`, `reorder_templates` — xem `docs/DATABASE_SCHEMA.md`

> ⚠️ Route handler dùng `createAdminClient()` (service_role) → **bypass RLS**, nên suy cho cùng nó phải tự check `profiles.role` — pattern hiện tại là `isStaff()` trong `src/app/api/orders/[id]/status/route.ts`.

---

## 7. Kiến trúc data flow

### Public data (product catalog)

```
Server Component → Supabase (anon + RLS) → HTML
```

### Form submission (AI consultation)

```
Client Form → POST /api/ai/recommend (anonymous được phép)
  → createConsultation() lưu phôi xuống Supabase TRƯỚC khi gọi AI
  → provider.recommend()  (OpenAIProvider nếu có AI_API_KEY, ngược lại MockProvider)
  → enrich boxStyleImageUrl theo bảng box_styles
  → updateAIRecommendation() → trả JSON + id
  → /consultation/result?id=<id> đọc lại từ DB → link kết quả share được
```

### Print mockup (sau khi có kết quả AI)

```
Client → POST /api/ai/mockup (multipart: consultationId + logo + print position)
  → requestMockupSlot(): CAS trên consultations.mockup_requests, hạn mức 3 lần/tư vấn → 429
  → dựng khuôn bế có vùng in bằng src/lib/dieline → upload Cloudinary → lưu dieline_url
     (lưu TRƯỚC, để AI lỗi thì xưởng vẫn còn file khuôn bế)
  → gọi /v1/images/edits (qwen-image-3.0, 2 ảnh input: khuôn bế + logo)
  → tải bytes về re-host Cloudinary (link AI hết hạn sau 24h)
  → updateMockupAssets() lưu mockup_url
```

Vị trí in hợp lệ **phụ thuộc kiểu thùng** — `src/lib/config/print-positions.ts` (`rsc_a1` → `2_main|4_sides`, `am_duong`/`mailer` → `1_top`), server enforce bằng `isPrintPositionForBoxStyle`. Kết quả hand-off sang form đặt hàng qua `src/lib/mockup/handoff.ts` (copy `mockupUrl`/`dielineUrl` vào `order_items.printing_specs`) và hiển thị bằng `src/components/order/print-preview-strip.tsx`.

> **Storage chia làm hai đường**: file user upload (`/api/upload` — logo, reference, payment-proof, order-file) vào **Supabase Storage**; ảnh AI sinh ra (mockup, khuôn bế) vào **Cloudinary**.

### Order flow

```
Consultation → Place Order → pending → staff_review → confirmed
  → deposit_paid (bank transfer, đơn > 5,000,000đ)
  → production → completed → delivered
  → cancelled — chỉ từ pending | staff_review | confirmed | deposit_paid | production
```

Nguồn thật của thứ tự status: `src/lib/data/order-shared.ts` (`ORDER_STATUS_SEQUENCE`, `HISTORY_STATUSES`); transitions do `STAFF_TRANSITIONS` / `CUSTOMER_TRANSITIONS` trong `src/app/api/orders/[id]/status/route.ts` quy định. `completed` và `delivered` **không** cancel được nữa.

> `POST /api/orders/[id]/payment` **không đổi `status`** — route chỉ ghi `payment_method` + `payment_proof_url`; staff mới là người PATCH status sang `deposit_paid`.

### Payment methods

- **COD** — Thanh toán khi nhận hàng
- **Bank transfer** — Đặt cọc 50% cho đơn > 5,000,000đ (ngưỡng ở `src/lib/config/pricing.ts`)

---

## 8. Development workflow

### Khi mới clone repo (team member)

1. `npm install`
2. Copy `.env.example` → `.env.local`, điền URL + keys của **project riêng**
3. `npx supabase login && npx supabase link --project-ref <ref-của-bạn>`
4. `npx supabase db push && npm run db:seed`
5. `npm run dev`
6. Login với 1 trong 3 tài khoản test (xem mục 11)

### Khi thêm feature mới

1. Tạo feature module: `src/features/<feature>/`
   - `components/`, `hooks/`, `utils.ts`, `types.ts`
2. Tạo page: `src/app/.../page.tsx`
3. Tạo API route (nếu cần): `src/app/api/.../route.ts`
4. Thêm data access: `src/lib/data/<feature>.ts`
5. Thêm config (nếu cần): `src/lib/config/`

### Coding conventions (tóm tắt)

- **TypeScript strict mode** — mọi file
- **File naming** (theo thực tế repo): shared component đặt tên **PascalCase** (`src/components/modals/PriceChange.tsx`, `src/features/dieline/DielinePreview.tsx`); file nằm cạnh page + primitive `components/ui/` giữ **kebab-case** (`consultation-form.tsx`, `ui/badge.tsx`). Tên component luôn PascalCase.
- **Component exports**: `export default function` cho pages, named exports cho shared components
- **CSS**: Tailwind utility classes + semantic tokens — không CSS modules
- **Import order**: React → Next.js → Third-party → Local

### Libraries được dùng

| Mục đích | Library |
|----------|---------|
| UI base | `@base-ui/react` + shadcn CLI (style `base-nova`) — cấu hình ở `components.json` |
| Icons | `@phosphor-icons/react` (không dùng lucide cho icon mới) |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Class merge | `clsx` + `tailwind-merge` → `cn()` helper |
| Animation | `motion` (framer-motion) + `tw-animate-css` |
| AI SDK | `openai` v7 — chỉ để gọi endpoint OpenAI-compatible của ai-box |
| Dates | `date-fns` |
| Scripts | `tsx` (chạy `scripts/*.mts`) |

### Libraries không dùng

- ❌ Redux / React Query — Server Components + Supabase SDK đủ
- ❌ Axios — dùng native `fetch` hoặc Supabase SDK
- ❌ MUI / Chakra / Ant Design — Tailwind + shadcn
- ❌ NextAuth.js — Supabase Auth
- ❌ Lodash — import function riêng nếu cần
- ⚠️ `lucide-react` vẫn còn trong `package.json` và được dùng ở `src/components/ui/select.tsx` — **không thêm chỗ mới**. Icon mới lấy từ `@phosphor-icons/react` (trong Server Component import sâu `@phosphor-icons/react/dist/ssr`).
- ⚠️ `recharts` **chưa cài** — cần cho biểu đồ staff dashboard, chỉ thêm khi làm UI staff thật.

---

## 9. Lệnh thường dùng

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | `next dev --turbo` |
| `npm run build` / `npm start` | Production build (kiểm tra TypeScript) / serve |
| `npm run lint` | `next lint` — ⚠️ repo **chưa có file cấu hình ESLint**, lần chạy đầu sẽ hỏi setup |
| `npx supabase db push` | Áp 6 migration trong `supabase/migrations/` |
| `npm run db:seed` | `node scripts/seed.mjs` — 3 tài khoản test + data mẫu |
| `npx tsx scripts/dieline-selfcheck.mts` | Đối chiếu SVG khuôn bế với bản gốc (thiếu file gốc → skip, exit 0) |
| `npx tsx scripts/mockup-selfcheck.mts` | Check vùng in, artwork fit, size/seed/prompt, endpoint `/v1`, parse header ảnh |

Hai script selfcheck là gate thật: sửa `src/lib/dieline/` hoặc `src/lib/mockup/`, `src/lib/ai/mockup.ts`, `src/lib/config/print-positions.ts` thì phải chạy lại cho xanh trước khi merge.

---

## 10. Câu hỏi thường gặp

**Q: Cần biết gì trước khi code?**
Đọc `AGENT.md` + `docs/DEVELOPMENT_GUIDE.md` + `docs/ARCHITECTURE.md` để hiểu conventions và security model.

**Q: Feature flags ở đâu?**
`src/lib/config/features.ts` — `consultation`, `mockup`, `reorder`, `savedProducts` (đang `true` hết). ⚠️ **Chưa có file nào import** — bật/tắt ở đây hiện không đổi hành vi. Muốn gate mockup thật, dùng `isImageConfigured()` (`src/lib/ai/mockup.ts`).

**Q: Constants (status labels, URLs) ở đâu?**
`src/lib/config/constants.ts` — `ORDER_STATUS_LABELS`, `APP_URLS`, `SITE_NAME`.

**Q: Pricing rules (thresholds, deposit %) ở đâu?**
`src/lib/config/pricing.ts`. Vị trí in hợp lệ theo kiểu thùng: `src/lib/config/print-positions.ts`.

**Q: Sửa prompt AI ở đâu?**
`src/lib/ai/context.md` — file này được đọc lúc runtime bởi `src/lib/ai/providers/openai.ts`. Sửa nó là đổi hành vi AI, không cần đổi code.

**Q: File mới không có `features/` folder tương ứng?**
Tạo mới theo pattern: `src/features/<name>/` với `components/`, `utils.ts`, `types.ts`.

**Q: Cần thay đổi API route?**
Route Handlers ở `src/app/api/` — thin layer, gọi xuống `src/lib/data/`. Business logic không nằm trong route handler.

**Q: Ảnh mockup không hiện được trên UI?**
`next.config.mjs` mới whitelist `picsum.photos` trong `images.remotePatterns`. Ảnh Cloudinary/Supabase đang render bằng `<img>` thô — muốn dùng `next/image` thì thêm hostname vào `remotePatterns`.

**Q: Upload Cloudinary trả 401 "Invalid Signature"?**
Tài khoản Cloudinary mới hay từ chối chữ ký HMAC v1. Tạo preset "unsigned" trong console rồi đặt `CLOUDINARY_UPLOAD_PRESET` — code sẽ bỏ qua chữ ký (`src/lib/cloudinary/upload.ts`).

---

## 11. Tài khoản test (seed)

Sau khi chạy `npm run db:seed`, có sẵn 3 tài khoản:

| Role | Email | Password | Name |
|------|-------|----------|------|
| customer | `test-customer@test.com` | `test123456` | Nguyễn Văn A |
| sales | `test-sales@test.com` | `test123456` | Trần Thị B |
| admin | `test-admin@test.com` | `test123456` | Lê Văn C |

Seed cũng tạo 6 sản phẩm mẫu, 1 consultation mẫu, 1 đơn hàng mẫu.

### Thêm seed data mới or schema change

Tạo migration mới:

```bash
npx supabase migration new <tên>
# sửa file trong supabase/migrations/
npx supabase db push
```

Sửa seed: thêm INSERT vào migration mới hoặc dùng SQL Editor.

Chạy lại an toàn. Team member nào cũng chạy được sau khi pull code mới.