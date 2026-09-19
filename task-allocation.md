# Task Allocation — AI Carton Packaging Solution

> 4 Fullstack Devs | Zero File Conflicts | AI + Mockup → Dev A
>
> **Cập nhật hiện trạng (16/09/2026)** — trạng thái dưới là **code trên đĩa**,
> không phải kế hoạch. Cột "Status" mới; Est. giữ nguyên để đối chiếu sprint.

| Status | Nghĩa |
|---|---|
| ✅ | Xong, chạy thật |
| 🟡 | Có code, chưa hoàn chỉnh / chưa nối |
| 🔴 | Stub hoặc chưa tồn tại |

---

## Dev A — AI Consultation + Mockup (You)

**AI + recommendation + mockup — the core value prop.**

| # | Status | Task | Files (đường thật) | Pri | Est. |
|---|---|------|-------|-----|------|
| A1 | ✅ | AI provider abstraction (text) | `src/lib/ai/index.ts`, `providers/openai.ts`, `providers/mock.ts` — ai-box OpenAI-compatible, fallback `MockProvider` khi thiếu `AI_API_KEY` | P0 | 2h |
| A2 | ✅ | AI recommend API route | `src/app/api/ai/recommend/route.ts` — insert `pending` → call AI → update `ai_processed` | P0 | 2h |
| A3 | ✅ | Consultation spec input page | `src/app/(public)/consultation/page.tsx` + `consultation-form.tsx` + `consultation-schema.ts` + `src/components/consultation/fields.tsx` | P0 | 4h |
| A4 | ✅ | Consultation result | `consultation-result.tsx` + `consultation-ready-state.tsx` (render inline cột phải) **và** `result/page.tsx` (`?id=`, deep-link) | P0 | 3h |
| A5 | ✅ | Data access (consultations) | `src/lib/data/consultations.ts` | P0 | 1h |
| A6 | ✅ | AI mockup API route | `src/app/api/ai/mockup/route.ts` — `qwen-image-3.0` + dieline SVG → Cloudinary, quota `mockup_requests` ≤ 3 (CAS, 429) | P1 | 3h |
| A7 | 🔴 **thay đổi phạm vi** | ~~Mockup preview page `/consultation?step=mockup`~~ → **panel trong trang kết quả**: `print-mockup-panel.tsx`, `print-mockup-controls.tsx`. Không còn route `?step=` nào | P1 | 3h |
| A8 | ✅ *(new)* | Dieline engine thuần (mm → SVG) | `src/lib/dieline/*` (`build`/`toSVG`/`viewBoxOf`/`render`, kinds `rsc`/`telescope`/`mailer`), `src/features/dieline/*`, `src/app/(public)/dieline-lab/` | P1 | — |
| A9 | ✅ *(new)* | Print positions per box style | `src/lib/config/print-positions.ts` (`2_main`/`4_sides`/`1_top`) — server ép theo kiểu thùng | P1 | — |
| A10 | ✅ *(new)* | Cloudinary server-side upload | `src/lib/cloudinary/upload.ts` (signed HMAC-SHA1, hoặc unsigned khi có `CLOUDINARY_UPLOAD_PRESET`) | P1 | — |
| A11 | ✅ *(new)* | Print assets vào đơn | `src/lib/data/cart-add.ts` (`customFromConsultation()` copy `mockupUrl`/`dielineUrl`), `src/components/order/print-preview-strip.tsx`, `order_items.printing_specs`. Bản hand-off qua `/order` + `lib/mockup/handoff.ts` đã xoá | P1 | — |

**Files**: `src/lib/ai/*`, `src/lib/dieline/*`, `src/lib/cloudinary/*`, `src/lib/mockup/*`, `src/app/api/ai/*`, `src/app/(public)/consultation/*`, `src/app/(public)/dieline-lab/*`, `src/features/{dieline,consultation,products}/*`, `src/lib/data/consultations.ts`

**Total**: 18h + ~20h (A8–A11) | **Deps**: None — đã xong phần core

---

## Dev B — Order System — ✅ gần hết

| # | Status | Task | Files | Pri | Est. |
|---|---|------|-------|-----|------|
| B1 | ✅ | Orders API (GET list + POST create) | `src/app/api/orders/route.ts` (60 dòng) + `src/lib/data/orders-create.ts` — server re-price, `order_code = ORD-YYYYMMDD-XXXXXXXX`, deposit 50% khi ≥ 5tr, rollback nếu insert items fail. `POST /api/checkout` dùng chung `createOrderWithItems()` | P0 | 2h |
| B2 | ✅ | Order status API | `src/app/api/orders/[id]/status/route.ts` — `STAFF_TRANSITIONS`/`CUSTOMER_TRANSITIONS`, CAS 409 | P0 | 1h |
| B3 | 🟡 | Order payment API | `src/app/api/orders/[id]/payment/route.ts` — **chỉ ghi `payment_method` + `payment_proof_url`**; `payment_status` không bao giờ đổi → cần UI staff verify | P0 | 1h |
| B4 | ✅ | Reorder API | `src/app/api/reorder/route.ts` — `copiedItems`/`skippedItems`, chỉ role `customer` | P1 | 1h |
| B5 | ✅ | Upload API | `src/app/api/upload/route.ts` — 4 purposes, 2 buckets (`logos` public / `order-files` signed 1h) | P0 | 1h |
| B6 | 🗑 Đã nghỉ | Standalone order page — form tạo đơn đã xoá; đơn chỉ tạo qua giỏ (`/dashboard/cart` → `/dashboard/checkout`). `order/page.tsx` còn lại mỗi `redirect('/dashboard/custom')` | P0 | — |
| B6b | ✅ *(new)* | Cart → checkout → custom tab | `/dashboard/cart`, `/dashboard/checkout`, `/dashboard/custom`, `api/cart*`, `api/checkout`, `api/addresses*`, `lib/data/{cart,cart-add,custom-spec,addresses}.ts` | P0 | — |
| B7 | ✅ | Customer orders list | `src/app/(auth)/dashboard/orders/page.tsx` — `?status&page&search&sort`, URL-state modal `?orderId=` (`?modal=create` đã bỏ cùng form tạo đơn) | P0 | 3h |
| B8 | ✅ | Customer order detail | `src/app/(auth)/dashboard/orders/[id]/page.tsx` + `cancel-order-button.tsx` | P0 | 3h |
| B9 | ✅ | Order history | `src/app/(auth)/dashboard/history/page.tsx` (`HISTORY_STATUSES`) | P1 | 2h |
| B10 | ✅ | Reorder page | `src/app/(auth)/dashboard/reorder/page.tsx` + `reorder-form.tsx` (`?id=`) | P1 | 2h |
| B11 | ✅ | Data access (orders) | `src/lib/data/orders.ts` + `src/lib/data/order-shared.ts` (status machine + formatters dùng chung 2 phía) | P0 | 1h |

**Total**: 21h | ⚠️ còn thiếu: không có giới hạn rate trên `/api/orders`, `delivery_fee` luôn 0, VAT chưa cộng

---

## Dev C — Staff Features — 🔴 CHƯA LÀM GÌ

| # | Status | Task | Files | Pri | Est. |
|---|---|------|-------|-----|------|
| C1 | 🔴 | Consultations API | `src/app/api/consultations/route.ts` — **file tồn tại nhưng GET+POST đều trả `501 {message:'Under development'}`** | P0 | 1h |
| C2 | 🔴 | Products API | `src/app/api/products/route.ts` — **501 y hệt** | P0 | 1h |
| C3 | 🔴 | Staff dashboard | `src/app/(staff)/staff/page.tsx` → `<UnderDevelopmentPage />` | P0 | 4h |
| C4 | 🔴 | Staff consultations list | `src/app/(staff)/staff/consultations/page.tsx` → stub | P0 | 2h |
| C5 | 🔴 | Staff consultation review | `src/app/(staff)/staff/consultations/[id]/page.tsx` → stub. Kéo theo: 4 status `staff_reviewed`/`quoted`/`converted`/`closed` của consultations **không code nào set** | P0 | 4h |
| C6 | 🔴 | Staff orders list | `src/app/(staff)/staff/orders/page.tsx` → stub (API `GET /api/orders` phía staff đã dùng được) | P0 | 2h |
| C7 | 🔴 | Staff order detail | `src/app/(staff)/staff/orders/[id]/page.tsx` → stub (PATCH status + payment đã có sẵn API) | P0 | 3h |
| C8 | 🔴 | Staff customers | `src/app/(staff)/staff/customers/page.tsx` → stub; `CustomerQuickView.tsx` đã viết nhưng **không chỗ nào import** | P1 | 2h |
| C9 | 🔴 | Staff products | `src/app/(staff)/staff/products/page.tsx` → stub; `ProductEditDrawer.tsx` + `ProductEditFormFields.tsx` đã viết nhưng **chưa nối** | P1 | 2h |
| C10 | 🟡 | Data access | `src/lib/data/products.ts` ✅ có; `profiles.ts` **không tồn tại** — query profile đang nằm rải trong từng route handler | P0 | 1h |
| C11 | 🔴 *(blocking)* | **Phân quyền staff chưa hoàn chỉnh** | `src/middleware.ts` chỉ check "đã đăng nhập", **không check role** → customer vào được `/staff/*`. RLS policy dùng `auth.jwt() ->> 'role'` trong khi **không có trigger/nhét role vào JWT nào** (đăng ký không set, `scripts/seed.mjs` chỉ ghi `profiles.role`) → policy staff không bao giờ khớp. Chọn 1: (a) `SET ROLE`/app_metadata hook khi auth, hoặc (b) bỏ role-policy RLS, mọi đọc/ghi staff đi qua route handler + `isStaff()` | P0 | 3h |

**Total**: 22h + 3h | **Deps**: C11 phải xong trước C3–C9, nếu không page sẽ query ra rỗng

---

## Dev D — Marketing Pages + Dashboard + Shared Modals

| # | Status | Task | Files (đường thật — doc cũ ghi kebab, code là PascalCase) | Pri | Est. |
|---|---|------|-------|-----|------|
| D1 | 🟡 | ✅ About page | `src/app/(public)/about/page.tsx` — nội dung tĩnh, **hero vẫn dùng ảnh placeholder `picsum.photos`** | P1 | 3h |
| D2 | ✅ | Pricing page | `src/app/(public)/pricing/page.tsx` — đọc `VOLUME_TIERS` từ `lib/config/pricing.ts` | P1 | 3h |
| D3 | ✅ | Customer dashboard | `src/app/(auth)/dashboard/page.tsx` — 3 stats cards + quick actions + recent orders, `<ErrorState />` khi data fail | P0 | 3h |
| D4 | 🟡 | Payment confirmation modal | `src/components/modals/PaymentConfirmation.tsx` — nối ở `dashboard/orders/order-modals.tsx` + `checkout-form.tsx`. ⚠️ `BANK_TRANSFER_DETAILS` **hard-code số TK placeholder** | P0 | 1h |
| D5 | ✅ | Cancel order modal | `src/components/modals/CancelOrder.tsx` — nối qua `cancel-order-button.tsx` | P0 | 1h |
| D6 | 🟡 | Price change modal | `src/components/modals/PriceChange.tsx` — **viết xong, chưa có caller** (chờ C5) | P1 | 1h |
| D7 | 🟡 | Upload payment proof modal | `src/components/modals/UploadProof.tsx` — **chưa có caller** (chờ C7; flow hiện gộp trong D4) | P1 | 1h |
| D8 | 🟡 | Customer quick view modal | `src/components/modals/CustomerQuickView.tsx` — **chưa có caller** (chờ C8) | P1 | 1h |
| D9 | 🟡 | Product edit drawer | `src/components/modals/ProductEditDrawer.tsx` + `ProductEditFormFields.tsx` — **chưa có caller** (chờ C9) | P1 | 1.5h |
| D10 | ✅ | Status badge + timeline | `src/components/ui/status-badge.tsx`, `status-timeline.tsx` (7 cột, icon Phosphor) | P0 | 1h |
| D11 | ✅ | Empty + error state | `src/components/ui/empty-state.tsx`, `error-state.tsx` | P0 | 1h |
| D12 | 🟡 | DB types | `src/types/database.ts` — mới **80 dòng**, chưa phủ đủ 9 bảng. `src/lib/data/order-shared.ts` đang là type nguồn thật cho order | P0 | 1h |
| D13 | ✅ *(new)* | Landing page + motion system | `src/app/(public)/page.tsx` (client, hero sticky `125dvh`, `floatDec`) + `.reveal-init/.is-visible` trong `globals.css` + `prefers-reduced-motion` | P0 | — |
| D14 | ✅ *(new)* | Dashboard nav | `src/components/layout/DashboardNav.tsx` (render trong `src/app/(auth)/layout.tsx`) | P0 | — |
| D15 | 🟡 *(new)* | Feature flags | `src/lib/config/features.ts` — khai báo 4 flag nhưng **0 importer**; tính năng thật bật/tắt bằng env | P2 | — |

**Total**: 17.5h + ~10h | ⚠️ 4 modal (D6–D9) đang "xong mà chưa chạy" — chúng là nợ của Dev C, không phải của D

---

## Sprint Plan (1 Week) — hiện trạng sau sprint

| Day | Dev A (AI) | Dev B (Orders) | Dev C (Staff) | Dev D (Pages + Modals) |
|-----|-----------|----------------|---------------|------------------------|
| **Mon** | ✅ A1 | ✅ B1 | 🔴 C1 (501 stub) | ✅ D3 → D10, D11 |
| **Tue** | ✅ A2 | ✅ B2 + B3 | 🔴 C2 (501) + C4 | 🟡 D1 (ảnh placeholder) |
| **Wed** | ✅ A3 + ✅ A8 dieline | ✅ B6 | 🔴 C3 + C6 | ✅ D2 |
| **Thu** | ✅ A4 + A5 + ✅ A6/A7→panel | ✅ B7 + B8 | 🔴 C5 + C7 | 🟡 D4 + D5 (D6–D9 chưa nối) |
| **Fri** | ✅ A9/A10/A11 + ✅ A13 landing | ✅ B9 + B10 + B11 | 🔴 C8–C9 + 🟡 C10 | 🟡 D12 |
| **Tuần sau** | maintenance | rate-limit + VAT + delivery fee | **C11 → C3 → C5/C7 → còn lại** | nối D6–D9 theo C, sinh `database.ts` đầy đủ |

---

## Key Rules

1. **No file touched by >1 dev** — if you need something from another dev's area, ask, don't edit
2. **Shared components emerge from pages** — Dev D builds StatusBadge + EmptyState while enhancing the dashboard (D3), not as abstract tasks
3. **Modals owned by Dev D** — used by B's order page and C's staff pages, but D builds them
4. **Branch per dev**: `dev-a/ai`, `dev-b/orders`, `dev-c/staff`, `dev-d/pages`
5. **Merge to `develop`** when feature complete
6. *(mới)* Schema đổi → chạy `npx supabase migration new` + `npx supabase db push`, rồi cập nhật `docs/DATABASE_SCHEMA.md` + `src/types/database.ts` + `order-shared.ts` trong cùng PR
7. *(mới)* `init_schema.sql` mở đầu bằng 8 `DROP TABLE ... CASCADE` — **đừng** áp lên project có dữ liệu; dùng migration tăng dần
8. *(mới)* Trước khi merge code gọi Supabase: `npx tsx scripts/dieline-selfcheck.mts` và `npx tsx scripts/mockup-selfcheck.mts`
