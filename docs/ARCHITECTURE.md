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
| `box_styles` | ✅ Read-only | No | Lookup kiểu thùng + ảnh preview/mockup (chỉ `is_active`) |
| `consultations` | ✅ Insert only | No | Anyone can request a quote |
| `orders` | ❌ | Customer: own only | Sales: all |
| `profiles` | ❌ | Own profile only | Sales: all |
| `order_status_history` | ❌ | Customer: own only | Sales: all |

> ⚠️ **Policy dạng `auth.jwt() ->> 'role'` hiện ĐANG VÔ HIỆU.** Không có trigger nào
> và không có chỗ nào ghi `role` vào `app_metadata`/custom claims, nên JWT không bao giờ
> mang role. `scripts/seed.mjs` set `profiles.role` cho 3 tài khoản test, còn
> `register/page.tsx` upsert profile **không có role** → mặc định `'customer'` vĩnh viễn.
>
> Quyền thật sự được enforce **ở tầng ứng dụng**: route handler đọc `profiles.role`
> bằng `createAdminClient()` (bypass RLS) rồi tự lọc — `isStaff()` trong
> `src/app/api/upload/route.ts`, `src/lib/data/orders-create.ts:96`
> (`customerId` từ body chỉ staff được truyền — khách đặt cho chính mình),
> `src/app/api/orders/[id]/status/route.ts`.
>
> Trước khi dựa vào RLS cho staff, chọn một trong hai:
> 1. Trigger `handle_new_user` + custom claim `role` vào token, hoặc
> 2. Policy `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('sales','admin'))`
>    — profile tự đọc được row của mình nên suy ra được role ngay trong DB.

### 2.2 Route Handlers — The Secure Gateway

All external API calls go through Next.js Route Handlers:

```
Browser ──► Route Handler (server) ──► ai-box (OpenAI-compatible)
                  │                          Cloudinary
                  │
                  │  AI_API_KEY + CLOUDINARY_API_SECRET live here only
                  │  Never sent to browser
                  ▼
            Returns result to client
```

```typescript
// src/app/api/ai/recommend/route.ts — rút gọn, đúng thứ tự thật
export async function POST(request: NextRequest) {
  // 1. Không auth — tư vấn chạy ẩn danh. Đăng nhập chỉ cần khi đặt hàng.
  const parsed = consultationInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  // 2. Catalog để AI chọn trong danh sách có thật
  const catalog = await getActiveProductOptions()

  // 3. INSERT trước khi gọi AI — có row để theo dõi dù AI fail
  const { id } = await createConsultation(parsed.data)        // status = 'pending'

  // 4. AI (provider chọn theo env, server-only key)
  const recommendation = await getAIProvider().recommend(parsed.data, catalog)

  // 5. Enrich ảnh preview/mockup theo box_style, rồi UPDATE
  await updateAIRecommendation(id, recommendation)            // status = 'ai_processed'

  return NextResponse.json({ consultationId: id, recommendation })
}
```

Hai điểm dễ hiểu sai nếu đọc code mẫu kiểu "all-in-one insert":
- **Insert happens BEFORE the AI call**, và `updateAIRecommendation` là một query riêng — không phải một lần `.insert()` duy nhất.
- `createConsultation` **không set `customer_id`**, kể cả khi người dùng đã đăng nhập. Consultation luôn anonymous; link user → consultation là việc chưa làm.

### 2.3 What's Exposed vs Protected

| Asset | Exposed to Browser? | How Protected |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Not a secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Designed to be public |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | Never in client code |
| `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`, `AI_IMAGE_MODEL`) | ❌ No | Server-only env var |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ❌ No | Server-only env var |
| DB data (customer own) | ✅ Yes | RLS restricts to their rows |
| DB data (other customers) | ❌ No | RLS blocks cross-user access |
| DB data (staff only) | ❌ No | ⚠️ Not RLS — application-level `isStaff()` (xem §2.1) |
| Print assets (mockup/dieline) | ✅ Yes | Public Cloudinary URLs; access guarded by the consultation id being unguessable + ownership check khi thêm giỏ (`consultation.customer_id` đã có mà khác `user.id` → 403, `src/lib/data/cart-add.ts`) |

### 2.4 Security Checklist

- [ ] RLS enabled on **every** table (default: `FOR SELECT` denied)
- [ ] RLS policies tested via Supabase SQL editor
- [ ] Service role key used **only** in Route Handlers / Server Components
- [ ] No external API keys in `.env.local` committed to git
- [ ] `.env.local` in `.gitignore`
- [ ] Middleware chặn route cần đăng nhập (`/dashboard`, `/staff`) — **chưa** chặn theo role
- [ ] Route nào dùng `createAdminClient()` phải tự verify role/ownership (nó bypass RLS)
- [ ] Rate limiting on public endpoints — ⚠️ mới chỉ có `/api/ai/mockup` (trần 3 gen/tư vấn, cột DB + CAS). `/api/ai/recommend` **chưa có** giới hạn gọi lại

---

## 3. Data Flow Patterns

### 3.1 Public Data (Product Catalog)

```
Server Component ──► Supabase (anon key + RLS) ──► HTML
```

```tsx
// src/app/(public)/pricing/page.tsx — Server Component
import { getCatalogProducts } from '@/lib/data/products'

export default async function PricingPage() {
  const products = await getCatalogProducts()
  return <CatalogTable products={products} />
}
```

> Trang chủ `src/app/(public)/page.tsx` là **Client Component tĩnh** (`'use client'`) — không query DB, nội dung hard-code. Nơi đọc danh mục thật là `/pricing` (`getCatalogProducts`), `/shop` (`getStockedProducts`) và `/dashboard/custom` (`getActiveProductOptions` — chọn sản phẩm cơ sở làm neo giá), tất cả qua `lib/data/products.ts`.

### 3.2 Form Submission (Consultation Request)

```
Client Form ──► POST /api/ai/recommend ──► Server Logic ──► ai-box (OpenAI-compatible)
                                                      │
                                                      ▼
                                                Supabase DB
                                                      │
                                                      ▼
                                            Response to Client
```

### 3.3 Authenticated Data (Customer Dashboard)

```
Server Component (logged in) ──► lib/data/orders.ts ──► Supabase (anon key + JWT + RLS)
                                                              │
                                                              ▼
                                                        Only own orders
```

Dashboard là Server Components, dữ liệu đọc qua `lib/data/`, không có client fetch cho dữ liệu đầu. Không có Realtime — trạng thái đổi khi re-render toàn trang.

### 3.4 File Upload (Logo / Design File)

```
Client ──► POST /api/upload ──► Route Handler (cần đăng nhập) ──► Supabase Storage
                                                                       │
                                                                       ▼
                                     logo/reference → public URL
                                     payment-proof/order-file → signed URL (1h)
```

> Đường này **chỉ cho file khách upload**. Ảnh mockup + khuôn bế do server sinh thì sang Cloudinary, không qua `/api/upload` — xem §4.2.

### 3.5 Consultation → AI → Order Flow

```
Client Form ──► POST /api/ai/recommend ──► Route Handler
                                                  │
                                        ┌───────────────────────────────┐
                                        │ 1. zod validate               │
                                        │ 2. INSERT consultation        │
                                        │    (status = pending)         │
                                        │ 3. getAIProvider().recommend()│
                                        │ 4. enrich ảnh box_style       │
                                        │ 5. UPDATE ai_recommendation   │
                                        │    (status = ai_processed)    │
                                        │ 6. 200 {consultationId, ...}  │
                                        └───────────────────────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Kết quả AI             │
                                    │  + panel mockup in       │   (nếu hasPrinting)
                                    │  + "Đặt hàng ngay" CTA   │
                                    └─────────────────────────┘
                                                  │
                                    POST /api/ai/mockup ──► khuôn bế + ảnh mockup
                                                  │
                                                  ▼
                    [Thêm vào giỏ] POST /api/cart {kind:'custom', consultationId}
                    [Mua ngay]     ──► /dashboard/checkout?items=<cartItemId>
                                                  │
                                                  ▼
                                    POST /api/checkout ──► Created
                                    (status: pending; cart + checkout nằm sau
                                     middleware /dashboard nên bắt buộc đăng nhập)
```

Không có bước auth ở bước tư vấn — `consultations.customer_id` để NULL kể cả khi người dùng đã đăng nhập (xem §2.2).

### 3.6 Payment Flow

```
Customer ──► POST /api/orders/[id]/payment ──► Route Handler
                                                      │
                                        ┌──────────────┴──────────────┐
                                        │ 1. Verify order belongs to  │
                                        │    customer                  │
                                        │ 2. CAS on status +           │
                                        │    payment_status + proof   │
                                        │    → 409 nếu raced           │
                                        │ 3. bank_transfer: bắt buộc   │
                                        │    có proof URL              │
                                        │ 4. Ghi payment_method +      │
                                        │    payment_proof_url         │
                                        │    ✗ KHÔNG đổi payment_status│
                                        └─────────────────────────────┘
                                                      │
                                                  Notify staff
                                                      │
                                                      ▼
                                           Staff verifies payment
                                           Updates status → production
```

> ⚠️ Bước "Staff verifies" **chưa có UI**: route `/staff/*` là placeholder và không code
> nào set `payment_status = paid`/`deposit_paid`. Khách submit proof xong thì đơn chỉ
> tiến được khi staff gọi `PATCH /api/orders/[id]/status`. Deposit không do khách chọn:
> server tính `round(total × 50%)` khi `total ≥ DEPOSIT_THRESHOLD` (`lib/config/pricing.ts`).

### 3.7 Reorder Flow

```
Customer ──► /dashboard/reorder?id=XXX (Server Component pre-fill)
                                                      │
                                        ┌──────────────┴──────────────┐
                                        │ 1. Fetch previous order     │
                                        │ 2. Pre-fill all specs       │
                                        │ 3. Customer adjusts qty     │
                                        │ 4. POST /api/reorder        │
                                        │    (new order, same specs)  │
                                        └─────────────────────────────┘
                                                      │
                                               New order created
```

> `/api/reorder` **chỉ có POST** — không có GET handler. Pre-fill happen server-side trong page (`src/app/(auth)/dashboard/reorder/`).

### 3.8 Staff Order Status Update

```
Staff ──► PATCH /api/orders/[id]/status ──► Route Handler
                                                  │
                                        ┌─────────────────────────┐
                                        │ 1. Verify staff role     │
                                        │    (profiles.role read   │
                                        │     with service client) │
                                        │ 2. Validate status       │
                                        │    transition            │
                                        │ 3. Update order          │
                                        │    (optimistic lock      │
                                        │     .eq(status) → 409)   │
                                        │ 4. Insert status         │
                                        │    history entry         │
                                        │ 5. (future) Notify       │
                                        │    customer via Realtime │
                                        └─────────────────────────┘
```

> Bước 5 **chưa làm**: chưa thêm bảng nào vào `supabase_realtime` publication, client
> không có subscription. Khách thấy đổi status bằng cách reload (RSC re-render).
> Chưa có UI staff để gọi PATCH này — route đã sẵn, màn hình chưa.

---

## 4. External API Integration Pattern

### 4.1 AI Recommendation (ai-box — OpenAI-compatible)

```
Browser ──POST /api/ai/recommend──► Route Handler
     │                                  │
     │                             getAIProvider()   (src/lib/ai/index.ts)
     │                                  │
     │              AI_API_KEY trống/placeholder ──► MockProvider (0 network call)
     │                                  │
     │                                  └──► OpenAIProvider ──► ai-box /v1/chat/completions
     │                                            AI_MODEL ?? 'deepseek-v4-flash-0731'
     │                                            system = src/lib/ai/context.md + catalog JSON
     │                                            response_format json_object → zod.parse
     ◄── { consultationId, recommendation }
```

| Env | Mặc định | Vai trò |
|---|---|---|
| `AI_API_KEY` | trống → rớt sang `MockProvider` | key chung cho text + ảnh |
| `AI_BASE_URL` | `https://api.ai-box.vn/v1` | endpoint OpenAI-compatible |
| `AI_MODEL` | `deepseek-v4-flash-0731` | model tư vấn |
| `AI_IMAGE_MODEL` | `qwen-image-3.0` | model ảnh cho mockup in |

System prompt đọc từ `src/lib/ai/context.md` lúc runtime — sửa file đó là đổi hành vi AI
không cần sửa code. Output ép `response_format: { type: 'json_object' }` rồi zod-parse
(`src/lib/ai/providers/openai.ts`). **Không có biến nào tên `OPENAI_API_KEY`** trong dự án.

### 4.2 Print Mockup (ai-box image edits + Cloudinary)

Chỉ chạy khi khách chọn in. Server dựng khuôn bế có hình in bằng SVG thuần
(`src/lib/dieline`), rồi gọi ai-box `/v1/images/edits` (JSON native, 2 ảnh input =
ảnh mockup gốc của kiểu thùng + logo khách) để ra ảnh 3D. URL ảnh AI hết hạn sau
24h nên server tải bytes về và re-host lên Cloudinary ngay.

```
Browser ──POST /api/ai/mockup──► Route Handler (lib/mockup/*)
  { consultationId,                │ 1. validate + ownership, claim slot DB
    printPosition, file|logoUrl }  │ 2. build dieline+artwork SVG ─► Cloudinary
                                   │ 3. ai-box edits [baseImg, logo] ─► PNG url
                                   │ 4. download PNG ─► Cloudinary
                                   │ 5. persist mockup_url/dieline_url/print_faces
  ◄── { logoUrl, mockupUrl, ────────┘
       dielineUrl, printPosition }
```

- Hạn mức chi phí: cột `consultations.mockup_requests` (CAS update, mặc định 3/lượt).
- Vị trí in hợp lệ theo kiểu thùng: `src/lib/config/print-positions.ts`.
- Khi "Đặt hàng ngay", `mockupUrl`/`dielineUrl` copy vào `order_items.printing_specs`
  (JSONB, không cần migration) → UI đơn hàng hiện thumbnail qua `PrintPreviewStrip`.
- Không có rasterizer: dieline lưu SVG gốc (`<image>` nhúng data URI logo), browser
  và xưởng die-cut đều đọc được.
- **Khuôn bế được persist TRƯỚC khi gọi AI** (`onDielineReady`) — AI lỗi vẫn còn file cho xưởng.
- Chế độ upload Cloudinary: có `CLOUDINARY_UPLOAD_PRESET` → unsigned (public_id auto);
  không có → signed HMAC-SHA1 + `overwrite=true`. Thiếu credentials → `503`, UI ẩn mockup
  và **không** chặn đặt hàng. AI fail giữa đường → `502` kèm `dielineUrl`/`logoUrl` đã có.

### 4.3 Dieline Engine — khuôn bế SVG thuần (`src/lib/dieline`)

Thư viện thuần hàm, **không DOM, không dependency đồ họa**: kích thước mm vào, SVG markup
ra. Gọi được từ route handler và test được. Dùng cho hai việc — xem trước/tải khuôn bế ở
`/dieline-lab`, và dựng file khuôn bế có hình in cho xưởng trong luồng mockup (§4.2).

| File | Vai trò |
|---|---|
| `src/lib/dieline/index.ts` | Model + 3 builder (`rsc` / `telescope` / `mailer`) + `toSVG` |
| `src/lib/dieline/print-faces.ts` | Rect vùng in + đặt logo giữa mặt in |
| `src/lib/images/dimensions.ts` | Đọc W/H từ header ảnh (PNG/JPEG/WEBP/GIF/SVG) để lấy tỷ lệ logo |
| `src/features/dieline/DielinePreview.tsx` | UI xem trước: gõ số → vẽ lại, zoom/pan, tải SVG / in |
| `scripts/dieline-selfcheck.mts` | Gate: đối chiếu SVG với bản gốc |

```
rsc        W = glue + 2D + 2R      H = C + R
telescope  2 khay rời: đáy D×R×C, nắp (D+2t+gap) × (R+2t+gap) × (C·pct%)
mailer     1 mảnh, vách cuộn vào trong, cấn kép cách nhau đúng 1×t
```

Input: `D` dài, `C` cao, `R` rộng, `t` độ dày carton, cùng `glue` / `lidGap` /
`lidHeightPct` / `partGap` — tất cả mm. `normalizeInput()` ép giá trị rỗng/NaN về default
và clamp `≥ 0.1`, nên form có thể gửi chuỗi tự do mà engine không vỡ (UI chỉ việc hiện cảnh
báo đỏ, không chặn input).

```
DIELINE_TYPES          rsc | telescope | mailer
build(opts)            → DielineModel
toSVG(m, {dims, labels, fill, artwork}) → string   (width/height tính bằng mm)
viewBoxOf(m, showDims) → { x, y, w, h }            (UI tính zoom)
render(opts, view)     → { model, svg }
```

`DielineModel` trả về: `width`/`height` khổ trải mm, `segs[]` (`k: 'cut' | 'crease'`),
`parts[]` (tên mặt + tag kích thước), `dims[]` đường kích thước, `specs[]` bảng thông số,
`note` giải thích cấu tạo. `BOX_STYLE_TO_DIELINE` nối `box_styles.id` (`rsc_a1` /
`am_duong` / `mailer`) với kiểu dieline — AI chọn kiểu thùng nào thì khuôn bế theo kiểu đó.

**Hình in không tính lại hình học**: `printPlacements()` lọc `model.parts` theo tên mặt
(`2_main` → `Mặt Dài`; `4_sides` → `Mặt Dài` + `Mặt Rộng`; `1_top` → `NẮP`), `fitArtwork()`
thụt lề 10% cạnh ngắn rồi giữ tỷ lệ logo. Logo vẽ **dưới** nét cắt/cấn nên xưởng vẫn đọc
được đường dao. Ba màu nét là hằng số in ấn (`#111827` cắt / `#2563eb` cấn / `#dc2626` kích
thước) — cố ý không lấy từ design token. `src` của `<image>` bắt buộc là data URI tự sinh;
ký tự phá attribute bị chặn bằng regex trước khi chèn vì `esc()` chỉ escape `& < >`.

> Giới hạn hiện tại (đánh dấu `ponytail:` trong code): tỷ lệ logo đọc từ header ảnh nên chưa
> hỗ trợ PDF/AI/EPS; engine chưa có mí/diaplacing và chưa xuất DXF. Xưởng cần định dạng nào
> thì thêm builder vào `BUILDERS`, không đụng UI.

---

## 5. Supabase Auth — Role Design

| Role | Access (thiết kế) | Pages |
|---|---|---|
| **Anonymous** | View products, submit consultation, view AI recommendation | Landing, consultation form, recommendation result, dieline-lab |
| **Customer** | Own orders, own profile, reorder, order history, payment proof upload | Customer dashboard, orders, history, reorder, profile |
| **Sales** | All consultations (review & confirm price), all orders (update status), all customers | *(chưa làm — xem bảng trạng thái dưới)* |
| **Admin** | All sales permissions + product catalog management | *(chưa làm — xem bảng trạng thái dưới)* |

Supabase Auth handles JWT. Role is stored in `profiles.role`.

> ⚠️ **Role chưa bao giờ vào được JWT** — xem ghi chú ở §2.1. Policy `auth.jwt() ->> 'role'`
> bên dưới là thiết kế, hiện chưa có tác dụng; enforce thật nằm ở route handler.
> `register/page.tsx` upsert profile không kèm `role` → mọi user tự đăng ký là `customer`.
> Chỉ tài khoản seed (`scripts/seed.mjs`) có `sales`/`admin`.

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

| Role | Trạng thái triển khai |
|---|---|
| **Anonymous** | ✅ Được xem products/consultation/about/pricing/dieline-lab, submit tư vấn, xem kết quả qua `?id=` |
| **Customer** | ✅ Dashboard, orders, history, reorder, profile, upload proof. Đăng nhập mới đặt hàng được |
| **Sales** | ⚠️ Logic status/role đã có ở `api/orders/[id]/status`; **UI chưa có** — 7 trang `/staff/*` đều render `UnderDevelopmentPage`; `api/consultations` và `api/products` trả 501 |
| **Admin** | ⚠️ Như Sales + quản lý danh mục. `ProductEditDrawer`/`CatalogTable` đã viết nhưng chưa có trang nào nối vào (`/pricing` là trang công khai, dùng `CatalogTable`) |

### Order Status State Machine

Nguồn thật: `ORDER_STATUS_SEQUENCE` (`src/lib/data/order-shared.ts`) cho thứ tự,
`STAFF_TRANSITIONS` / `CUSTOMER_TRANSITIONS` (`src/app/api/orders/[id]/status/route.ts`)
cho phép chuyển trạng thái.

```
pending → staff_review → confirmed → deposit_paid → production → completed → delivered
                         (confirmed có thể nhảy thẳng sang production khi COD)

cancelled: chỉ từ pending | staff_review | confirmed | deposit_paid | production
           completed và delivered là terminal → KHÔNG hủy được
           (customer chỉ tự hủy được từ pending)
```

| Status | Who sets it | Customer sees |
|---|---|---|
| `pending` | System (khi tạo đơn) | Chờ xử lý |
| `staff_review` | Staff | Đang duyệt |
| `confirmed` | Staff | Đã xác nhận |
| `deposit_paid` | **Staff** qua PATCH (customer chỉ upload proof) | Đã đặt cọc |
| `production` | Staff | Đang sản xuất |
| `completed` | Staff | Hoàn thành |
| `delivered` | Staff | Đã giao |
| `cancelled` | Staff, hoặc customer từ `pending` | Đã hủy |

Label hiển thị lấy từ `getOrderStatusLabel()`, màu từ `src/components/ui/status-badge.tsx`
(cancelled đỏ · completed/delivered emerald · production/deposit_paid blue · còn lại amber).
Không hard-code chuỗi label trong JSX.

### Payment Methods

| Method | How it works | When |
|---|---|---|
| **COD** | Pay on delivery | Mặc định, không phí giao (`delivery_fee = 0`) |
| **Bank Transfer** | Server tính số tiền phải chuyển: `round(total × DEPOSIT_PERCENTAGE)` nếu `total ≥ DEPOSIT_THRESHOLD`, ngược lại `deposit = 0` → thanh toán toàn bộ | `DEPOSIT_THRESHOLD = 5.000.000đ`, `VAT_PERCENTAGE = 10%` (`src/lib/config/pricing.ts`) |

---

## 6. Performance Considerations

| Concern | Solution |
|---|---|
| **Slow AI API calls** | Route Handlers — user sees loading state, not blocking page render. Consultation lưu row TRƯỚC khi gọi AI nên request fail không mất dữ liệu |
| **Database queries** | Server Components fetch data — no client waterfall |
| **Images** | Ảnh AI/khuôn bế/kiểu thùng: **Cloudinary** (signed upload server-side). File khách upload qua `/api/upload`: **Supabase Storage**. `next/image` mới allow-list `picsum.photos` (`next.config.mjs`) nên ảnh Cloudinary đang render bằng `<img>` thô — muốn tối ưu thì thêm `remotePatterns` |
| **Realtime updates** | ⚠️ **Chưa dùng.** Không có subscription nào trong `src/`, chưa thêm bảng vào publication. Status đổi hiện thấy khi reload (RSC re-render) |
| **Form validation** | Client-side validation (instant) + server-side validation (secure) — cùng zod schema, server có bản riêng (`consultationInputSchema`) |
| **AI cost control** | Hạn mức gen mockup là cột DB + CAS update (`consultations.mockup_requests`, trần 3) — không đếm ở bộ nhớ, nên không vượt được bằng request song song |

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
1. src/lib/ai/providers/<name>.ts   ← class mới `implements AIProvider`
                                      (AIProvider = { name, recommend(input, catalog) }
                                       — src/lib/ai/types.ts)

2. src/lib/ai/index.ts              ← thêm nhánh chọn provider trong getAIProvider()
                                      (hàm KHÔNG nhận tên; hiện chỉ if/else theo AI_API_KEY)

3. .env.example + .env.local        ← key của provider mới + AI_MODEL / AI_BASE_URL nếu endpoint khác
```

**Zero changes to feature code.** Feature code chỉ gọi `getAIProvider()` (`src/lib/ai/index.ts`) — nó không biết provider phía sau.

Hai giới hạn thật của abstraction hiện tại:
- `AIProvider` chỉ cover **text recommendation**. Tạo ảnh mockup là đường riêng (`src/lib/ai/mockup.ts`, gọi thẳng `/v1/images/edits`), **không** implement interface nào — đổi provider sẽ KHÔNG đổi model ảnh. Muốn đổi cả hai thì phải tách thêm interface cho image provider.
- Không có registry theo tên; selection là điều kiện env cứng trong `getAIProvider()`.

### 8.4 Changing pricing rules — step by step

```typescript
// src/lib/config/pricing.ts — export rời từng const, KHÔNG có object PRICING
export const DEPOSIT_THRESHOLD = 5_000_000 // VND — đơn từ ngưỡng này phải đặt cọc
export const DEPOSIT_PERCENTAGE = 50       // %
export const VAT_PERCENTAGE = 10           // %

export const VOLUME_TIERS = [
  { minQty: 100,   maxQty: 499,  discountPercent: 0 },
  { minQty: 500,   maxQty: 1999, discountPercent: 5 },
  { minQty: 2000,  maxQty: 9999, discountPercent: 10 },
  { minQty: 10000, maxQty: null, discountPercent: 15 },
] as const
```

Đổi ngưỡng cọc 5M → 3M = sửa một dòng. Consumers: `src/lib/data/orders-create.ts` (tính
`deposit_amount` — cả `/api/orders` lẫn `/api/checkout` gọi chung hàm này), `src/features/products/components/CatalogTable.tsx` + `PriceTierCards.tsx`
(cột giá theo tier ở `/pricing`) — cùng đọc một nguồn nên bảng giá và engine tính tiền không
lệch nhau.

Chưa có `minOrderQuantity` trong config — MOQ do AI trả về (`AIRecommendation.moq`).

### 8.5 Feature flags pattern

```typescript
// src/lib/config/features.ts — khai báo vậy, CHƯA được import ở đâu cả
export const features = {
  consultation: true,
  mockup: true,
  reorder: true,
  savedProducts: true,
} as const
```

> ⚠️ Cờ tính năng **chưa nối vào UI** — bật `false` ở đây không đổi hành vi. Bật/tắt mockup
> hiện do **cấu hình env** quyết định: thiếu `AI_API_KEY`/`CLOUDINARY_*` → `/api/ai/mockup`
> trả 503, UI tự ẩn panel (`isImageConfigured()` trong `src/lib/ai/mockup.ts`).
> pattern mong muốn (khi cần dùng thật):
>
> ```tsx
> {features.mockup && <PrintMockupPanel />}
> ```

### 8.6 Scalability considerations

| Concern | Strategy |
|---|---|
| **Database growth** | Supabase indexes, pagination (all list queries), connection pooling |
| **User growth** | Stateless Next.js (scale horizontally on Vercel), Supabase auto-scales |
| **AI API costs** | Cache AI recommendations in DB, only re-query on spec change |
| **Team size** | Feature isolation = parallel development. Each dev works in their own `features/` folder |
| **Mobile app future** | API routes in `app/api/` serve as backend for mobile too. Same `lib/data/` and `lib/ai/` reused |
| **Multiple factories** | Chưa có `factory_id` ở bất kỳ đâu (code hay schema). Đây là ý tưởng tương lai — thêm cột + tenant isolation qua RLS khi thật sự có nhiều xưởng |

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
| Security? | **RLS + Route Handlers** | Two-tier: RLS for client, service_role for server. ⚠️ role-based RLS chưa hoạt động (JWT không có `role`) — enforce ở app layer, xem §2.1 |
| External API keys? | **Server-only env vars** | Never exposed to browser |
| AI calls? | **Route Handlers** | Call ai-box (OpenAI-compatible) từ server, return result to client. Không có key → `MockProvider`, dev chạy được offline |
| State management? | **Server Components + Supabase** | No Redux needed for MVP |
| Forms? | **Client Components** | Interactive, but submit to Route Handlers |
| Styling? | **TailwindCSS** | Consistent, fast, Tasteskill-compatible |
| Ảnh thành phẩm? | **Cloudinary** (server-side upload), không phải Supabase Storage | Ảnh AI cần xử lý/resize phía CDN; Supabase Storage chỉ giữ file khách upload — xem §3.4 và DATABASE_SCHEMA §3 |
| Khuôn bế? | **SVG thuần, tự sinh** (`lib/dieline`) | Không dependency đồ họa, in đúng tỉ lệ mm, xưởng đọc trực tiếp; có selfcheck gate — xem §4.3 |
| AI cost guard? | **Cột DB + CAS** (`mockup_requests`) | Trần 3 gen/tư vấn, chống lạm dụng cả khi có request song song |