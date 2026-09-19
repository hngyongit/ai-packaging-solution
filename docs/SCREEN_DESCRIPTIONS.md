# Screen Descriptions — AI Carton Packaging Solution

> **Đọc trước khi sửa**: Tài liệu này mô tả màn hình **đúng như code đang có trên đĩa**
> (`src/app/**/page.tsx` + component thật), không phải mô tả thiết kế ước muốn. Ký hiệu:
>
> - ✅ = đã triển khai, hành vi khớp mô tả
> - ⚠️ = **doc cũ sai** (đã khắc phục trong lần rà này) hoặc có chỗ lệch so với thiết kế gốc
> - 🚧 = **CHƯA TRIỂN KHAI** — mô tả bên dưới là spec ý đồ, code thật chỉ là placeholder
>
> **Design Read**: B2B manufacturing platform cho seller online + SME Việt Nam, ngôn ngữ
> công nghiệp tối giản: Tailwind + component kiểu shadcn + ảnh thật.
>
> **Three Dials**: `VARIANCE: 5` (trust-first, layout lệch), `MOTION: 3` (scroll-reveal là chính),
> `DENSITY: 4` (thoáng, cho người đọc không chuyên).
>
> **Tasteskill Source**: `.agents/skills/design-taste-frontend/SKILL.md`
> **UI Implementation**: `docs/UI_RULES.md` · **Routes + flows**: `docs/USER_FLOWS.md` · **Kỹ thuật**: `docs/ARCHITECTURE.md`

---

## Table of Contents

- [How to Read This Document](#how-to-read-this-document)
- [PUBLIC ROUTES](#public-routes)
  - [1. Landing Page (`/`)](#1-landing-page-)
  - [2. Consultation — một trang (`/consultation`)](#2-consultation--m-trang-consultation)
  - [3. Consultation — kết quả full-page (`/consultation/result`)](#3-consultation--k-qu-qu-full-page-consultationresult)
  - [4. Print Mockup Panel (bản vẽ khuôn bế + ảnh in)](#4-print-mockup-panel-b-n-v-khu-n-b--nh-in)
  - [5. Pricing (`/pricing`)](#5-pricing-pricing)
  - [6. Dieline Lab (`/dieline-lab`)](#6-dieline-lab-dieline-lab)
  - [7. Order — đã nghỉ (`/order` → redirect)](#7-order--đã-nghỉ-order-redirect)
  - [8. About (`/about`)](#8-about-about)
  - [9. Login (`/login`)](#9-login-login)
  - [10. Register (`/register`)](#10-register-register)
- [AUTHENTICATED — CUSTOMER](#authenticated--customer)
  - [11. Customer Dashboard (`/dashboard`)](#11-customer-dashboard-dashboard)
  - [12. My Orders (`/dashboard/orders`)](#12-my-orders-dashboardorders)
  - [13. Order Detail (`/dashboard/orders/[id]`)](#13-order-detail-dashboardordersid)
  - [14. Order History (`/dashboard/history`)](#14-order-history-dashboardhistory)
  - [15. Reorder (`/dashboard/reorder`)](#15-reorder-dashboardreorder)
  - [16. Profile (`/dashboard/profile`)](#16-profile-dashboardprofile)
- [AUTHENTICATED — STAFF 🚧](#authenticated--staff-)
  - [17. Staff Dashboard (`/staff`)](#17-staff-dashboard-staff-)
  - [18. Staff Consultations (`/staff/consultations` + `/[id]`)](#18-staff-consultations-staffconsultations--id-)
  - [19. Staff Orders (`/staff/orders` + `/[id]`)](#19-staff-orders-stafforders--id-)
  - [20. Staff Customers (`/staff/customers`)](#20-staff-customers-staffcustomers-)
  - [21. Staff Products (`/staff/products`)](#21-staff-products-staffproducts-)
- [MODALS & OVERLAYS](#modals--overlays)
  - [M1. Payment Confirmation Modal](#m1-payment-confirmation-modal)
  - [M2. Cancel Order Modal](#m2-cancel-order-modal)
  - [M3. Price Change Notification Modal](#m3-price-change-notification-modal)
  - [M4. Upload Payment Proof Modal](#m4-upload-payment-proof-modal)
  - [M5. Customer Quick View Modal (Staff)](#m5-customer-quick-view-modal-staff)
  - [M6. Product Quick Edit Drawer (Staff)](#m6-product-quick-edit-drawer-staff)
  - [M7. Modal nối bằng URL trong `/dashboard/orders`](#m7-modal-ni-b-ng-url-trong-dashboardorders)
- [SHARED LAYOUTS](#shared-layouts)
  - [L1. Public Layout](#l1-public-layout)
  - [L2. Customer Dashboard Layout](#l2-customer-dashboard-layout)
  - [L3. Staff Layout](#l3-staff-layout)
  - [L4. Guest Layout](#l4-guest-layout)
- [UNIVERSAL COMPONENTS](#universal-components)
- [Appendix A — Route → code](#appendix-a--route--code)
- [Appendix B — Status → tiếng Việt](#appendix-b--status--ti-ng-vi-t)
- [Appendix C — Link chết & khoảng trống](#appendix-c--link-ch-t--kho-ng-tr-ng)

---

## How to Read This Document

Mỗi màn có:

| Mục | Nội dung |
|---|---|
| **Purpose** | Màn này để làm gì, ai dùng |
| **Route** | URL thật trên đĩa |
| **Code** | File `page.tsx` + component chính |
| **Layout** | Layout dùng chung nào (L1–L4) |
| **Structure** | Breakdown từ trên xuống |
| **Fields / Copy** | Label + placeholder + text lỗi **đúng như trong code** |
| **States** | Loading / empty / error / edge case |
| **Modals** | Overlay có thể xuất hiện |
| **Ghi chú** | Quyết định layout, motion, và ⚠️ lệch so với thiết kế gốc |

> ⚠️ **Cảnh báo chung cho cả tài liệu**: mọi chuỗi UI trong bài là kết quả đọc trực tiếp
> từ file `.tsx`. Nếu code đổi, sửa lại file này — đừng sửa file này để "khớp" một thiết kế
> chưa làm.

---

## PUBLIC ROUTES

---

### 1. Landing Page (`/`) ✅

**Purpose**: Ấn tượng đầu, đẩy khách vào `/consultation`, tạo niềm tin bằng nhà máy.

**Route**: `/`
**Code**: `src/app/(public)/page.tsx` — `'use client'`, hàm `HomePage`. Toàn bộ trang là
**một client component** (không có fetch server-side nào; sản phẩm displayed là hardcode).
**Layout**: L1

---

#### Structure (top to bottom)

```
┌───────────────────────────────────────────────────────────────┐
│  NAVBAR (sticky, bg-white/80 backdrop-blur-md) — xem L1       │
│  AI Carton | Trang chủ | Tư vấn | Về chúng tôi | Bảng giá     │
│                                          [Đăng nhập][Đăng ký] │
├───────────────────────────────────────────────────────────────┤
│  HERO — <section> cao 125dvh, nội dung sticky top-0           │
│                                                               │
│  Ảnh trang trí (aria-hidden, PNG Cloudinary, animate floatDec)│
│    landing_dec3.png / landing_dec2.png / landing_dec1.png     │
│                                                               │
│  Eyebrow:  "Giải pháp đóng gói thông minh"                    │
│  H1:       "Bao bì carton theo yêu cầu — Báo giá AI           │
│             trong 30 giây"                                    │
│  Subtext:  "Nhập thông số sản phẩm, AI đề xuất hộp carton     │
│             tối ưu — kích thước, chất liệu, giá cả.           │
│             Đặt hàng ngay."                                   │
│  [Tìm kiếm Bắt đầu tư vấn miễn phí] -> /consultation          │
│  "Xem sản phẩm ->" ----------------------> ⚠️ /about           │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  "Cách hoạt động" — H2 + 3 card, grid-cols-1 md:grid-cols-3   │
│    [Khối] 1 "Nhập thông số sản phẩm"                          │
│    [Ánh sáng] 2 "AI đề xuất hộp tối ưu"                       │
│    [Xe tải] 3 "Đặt hàng & nhận hàng"                          │
├───────────────────────────────────────────────────────────────┤
│  "Sản phẩm của chúng tôi" — 3 card TĨNH (không fetch DB)      │
│    ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│    │ 3_layer.png│ │ 5_layer.png│ │ e_flute.png│               │
│    │ Carton     │ │ Carton     │ │ Carton     │               │
│    │ 3 lớp     │ │ 5 lớp      │ │ sóng E     │                │
│    │ B-flute    │ │ BC-flute   │ │ E-flute    │               │
│    │ Từ 3,000đ  │ │ Từ 5,500đ  │ │ Từ 4,000đ  │               │
│    └────────────┘ └────────────┘ └────────────┘               │
│  "Xem tất cả sản phẩm ->" -----> /pricing                     │
├───────────────────────────────────────────────────────────────┤
│  "Nhà máy của chúng tôi" — split 2 cột                        │
│    ┌─────────────────────────┐  Stats:                        │
│    │ ⚠️ KHUNG CHỠ XÁM       │   5000+  Khách hàng              │
│    │  aspect-[4/3] bg-gray-200│  10+     năm Kinh nghiệm      │
│    │  + icon [Khối] giữa     │   3000m² Nhà máy               │
│    └─────────────────────────┘  63     tỉnh Phủ sóng          │
│    "Xem thêm ->" ------------------------------> /about       │
├───────────────────────────────────────────────────────────────┤
│  CTA cuối trang                                               │
│  H2 "Sẵn sàng đặt bao bì cho sản phẩm của bạn?"               │
│  "Nhập thông số, AI đề xuất ngay — miễn phí."                 │
│  [Tìm kiếm "Bắt đầu tư vấn ngay"] -> /consultation            │
├───────────────────────────────────────────────────────────────┤
│  FOOTER — xem L1                                              │
└───────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Code thật | Ghi chú |
|---|---|---|
| Navbar | `src/components/layout/navbar.tsx` | sticky `h-16`, 4 link + auth block |
| Hero | `page.tsx` inline | `h-[125dvh]` + `sticky top-0 h-[100dvh] pt-24 pb-16` |
| Ảnh hero | `landing_dec1/2/3.png` trên Cloudinary | raw `<img>`, `aria-hidden`, `floatDec` 4s/1s/2s |
| Steps | 3 hardcoded object | icon `Cube` / `MagnifyingGlass` / `Truck` |
| Product cards | 3 hardcoded card | ảnh `3_layer`/`5_layer`/`e_flute` Cloudinary |
| Factory | placeholder `div` xám | ⚠️ không phải ảnh thật |
| Footer | `src/components/layout/footer.tsx` | |

#### States

| State | Render | Ghi chú |
|---|---|---|
| **Loading** | Không có skeleton — trang client-only, dựng ngay | Ảnh loading tự nhiên |
| **Loaded** | Toàn bộ như mockup trên | |
| **Error** | ⚠️ Không có `error.tsx` cho route group `(public)` | Ảnh lỗi → khung trống |
| **Catalog rỗng** | Không liên quan — 3 card hardcode | `getCatalogProducts()` không được gọi ở đây |
| **Mobile** | 1 cột, hamburger `aria-label="Open menu"` (⚠️ tiếng Anh) | `overflow-x-clip` trên wrapper |

#### Modals
Không có.

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Motion** | `MOTION: 3` nhưng **nhiều hơn doc cũ nói**: injected `@keyframes heroSlideUp` + `floatDec`; mọi block dưới hero bọc `<div data-reveal className="reveal">` + `IntersectionObserver` (`.reveal-init` → `.is-visible`); có phiên bản `prefers-reduced-motion` và hand-off tween bằng `requestAnimationFrame` khi scroll tới hero |
| **⚠️ Doc cũ sai** | Không có **logo wall**, không có **FAQ accordion**, không có **contact form**, không có **video nhà máy**. Ảnh hero là PNG Cloudinary, không phải ảnh nền phủ toàn bộ |
| **⚠️ Link sai** | Nút phụ hero `"Xem sản phẩm →"` trỏ `/about` (không phải `/pricing` hay catalogue) |
| **Typography** | `Inter` (root layout), không phải Geist. H1 `text-4xl md:text-5xl lg:text-6xl` |
| **Eyebrow** | 1 cái ở hero — hạn ngạch `≤ ceil(5/3)` vẫn hợp lệ |

---

### 2. Consultation — một trang (`/consultation`) ✅

**Purpose**: Khách nhập thông số → AI trả kết quả **ngay trên cùng màn hình**, không đổi route.

**Route**: `/consultation`
**Code**:
- `src/app/(public)/consultation/page.tsx` — Server Component, gọi `getBoxStyles()` rồi render
  `<ConsultationForm boxStyles={...} />` (`src/app/(public)/consultation/consultation-form.tsx`, `'use client'`)
- Fields: `src/components/consultation/fields.tsx` (export `Section`, `Field`, `InlineError`, `BoxStylePicker`, `RadioGroup`) — dùng chung với form quy cách tự nhập
- Kết quả: `consultation-live-result.tsx` (`LiveResultPanel`) + `consultation-ready-state.tsx`
- Validate: `consultation-schema.ts` (zod)

**Layout**: L1

> ⚠️ **Doc cũ sai ở đây**: không có route `/consultation?step=result` hay `/consultation?step=mockup`.
> Consultation là **một trang**. Bản kết quả toàn màn hình là route riêng
> `/consultation/result?id=<uuid>` (§3). Không có `StepIndicator` trên trang này (§3 ghi rõ).

---

#### Structure (top to bottom)

```
┌────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                        │
├────────────────────────────────────────────────────────────────┤
│  max-w-6xl — grid gap-6, lg:grid-cols-[1.2fr_1fr]              │
│                                                                │
│  H1 "Tư vấn bao bì thông minh"                                 │
│  "Nhập thông số sản phẩm, AI đề xuất thùng carton phù hợp      │
│   ngay tại đây."                                               │
│                                                                │
│  CỘT TRÁI (form)          │  CỘT PHẢI (aside,                  │
│                           │   lg:sticky top-6 self-start)      │
│  Section "Thông tin sản   │  ┌──── KẾT QUẢ AI ────────────┐    │
│  phẩm"                    │  │ [StatusBadge]               │   │
│   Sản phẩm cần đóng gói   │  │  idle   -> "Điền thông số   │   │
│   Kiểu thùng [picker]     │  │           bên trái"         │   │
│   Dài | Rộng | Cao (cm)   │  │  loading-> skeleton pulse   │   │
│   Trọng lượng (grams)     │  │  error  -> "Không thể       │   │
│   Số lượng thùng          │  │           phân tích"+Thử lại│   │
│  Section "In ấn"          │  │  ready  -> ConsultationResult│  │
│   Có cần in lên thùng?    │  └─────────────────────────────┘   │
│   ( ) Có   ( ) Không      │                                    │
│  Section "Ghi chú thêm"    │                                   │
│   Yêu cầu thêm (<=100 chữ)│                                    │
│                           │                                    │
│  [Robot "Yêu cầu AI tư vấn"] / "Đang phân tích..."             │
├────────────────────────────────────────────────────────────────┤
│  FOOTER                                                        │
└────────────────────────────────────────────────────────────────┘
```

#### Fields / Copy (đúng chuỗi trong code)

| Field | Label | Placeholder / helper | Validate (`consultation-schema.ts`) |
|---|---|---|---|
| `productType` | `Sản phẩm cần đóng gói` | `VD: Loa, thiết bị điện tử, đồ gia dụng` | `Vui lòng nhập sản phẩm cần đóng gói` · max 200 |
| `boxStyle` | `Kiểu thùng` | helper `Chọn kiểu thùng hoặc để trống, AI sẽ chọn kiểu phù hợp nhất.` · pill `Để AI tự chọn kiểu` (icon Sparkle) | optional, enum `rsc_a1 / am_duong / mailer` |
| `lengthCm` | `Dài` (`aria-label="Chiều dài (cm)"`) | — | `Nhập chiều dài (cm)` / `Chiều dài không hợp lệ` · max 9999 |
| `widthCm` | `Rộng` (`aria-label="Chiều rộng (cm)"`) | — | tương tự |
| `heightCm` | `Cao` (`aria-label="Chiều cao (cm)"`) | — | tương tự |
| `weightGrams` | `Trọng lượng (grams)` | `VD: 500` | `Nhập trọng lượng (g)` · max 999999 |
| `desiredQuantity` | `Số lượng thùng` | `VD: 1000` | `.int()` · `Nhập số lượng thùng` · max 1000000 |
| `hasPrinting` | `Có cần in lên thùng?` | hint `Sau khi AI trả kết quả, bạn upload logo và chọn vị trí in để xem ảnh mockup thực tế.` | RadioGroup `Có` / `Không` |
| `notes` | `Yêu cầu thêm (tối đa 100 chữ)` | — | `Ghi chú tối đa 100 chữ` (đếm theo whitespace token) |

`BoxStylePicker` hover vào 1 kiểu → tooltip `motion/react` hiện ảnh preview 200×150 của
`box_styles.image_url`. Kiểu lấy từ DB (`getBoxStyles()`), rỗng thì fallback
`FALLBACK_BOX_STYLES` trong `src/lib/data/boxes.ts`.

#### Flow gọi API

| Bước | Chi tiết |
|---|---|
| 1 | `POST /api/ai/recommend` với `consultationToInput(values)` |
| 2 | API validate `consultationInputSchema`, đọc catalog (`404 No products available` nếu trống), insert `consultations` |
| 3 | `getAIProvider().recommend()` → enrich `boxStyleImageUrl` từ `box_styles` (fallback `rsc_a1`) → `updateAIRecommendation` set `status='ai_processed'` |
| 4 | Client render `ConsultationReadyState` trong `LiveResultPanel`, giữ `consultationId` để deep-link sang `/consultation/result?id=` |

> ⚠️ Chưa có rate-limit cho `/api/ai/recommend` (chỉ `/api/ai/mockup` có). Xem
> `docs/ARCHITECTURE.md` §Open questions.

#### States

| State | Render |
|---|---|
| **Idle** | `IdleState`: `Điền thông số bên trái` / `AI sẽ đưa ra đề xuất thùng carton tại đây, ngay trên cùng màn hình.` |
| **Loading** | `LoadingState` — skeleton `animate-pulse`, badge `Đang phân tích` |
| **Error** | `ErrorState` — `Không thể phân tích` + nút `Thử lại` |
| **Ready** | `ReadyState` → `ConsultationReadyState` (mini stats, giá, lời khuyên, độ tin cậy, panel mockup, alternatives, CTA) |
| **Badge labels** | `Hoàn tất` / `Đang phân tích` / `Lỗi` / `Chưa có` |

#### Modals
Không có modal. Panel mockup in (§4) render **inline** trong cột phải khi `hasPrinting = true`.

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Layout** | 2 cột `1.2fr_1fr`; cột phải sticky để kết quả luôn trong tầm mắt → đó là lý do **không cần route "step=result"** |
| **Không hỏi** | Vị trí in + logo **không** nằm ở form này (kiểu thùng có thể do AI chọn → danh sách mặt in hợp lệ chỉ biết sau khi có kết quả). Xem comment trong `consultation-schema.ts` và §4 |
| **Legacy** | `consultationInputSchema` vẫn nhận `preferredLayers` / `fluteType` cho client cũ — bị ignore downstream. Không còn UI nào gửi 2 field đó |
| **⚠️ Gap** | `AIRecommendation.leadTimeDays` được tính nhưng **không screen nào render** |
| **⚠️ Gap** | `StepIndicator` (`Nhập thông số · Kết quả · Đặt hàng`) chỉ được render ở §3, nghĩa là trên `/consultation` không bao giờ hiện |

---

### 3. Consultation — kết quả full-page (`/consultation/result`) ✅

**Purpose**: Bản in toàn trang của kết quả AI, deep-link được (khách quay lại bằng link /
mở lại từ email). Không có link nội bộ nào trỏ tới → ⚠️ **orphan route**, chỉ vào được bằng URL.

**Route**: `/consultation/result?id=<uuid>`
**Code**: `src/app/(public)/consultation/result/page.tsx` (`dynamic = 'force-dynamic'`,
đọc `searchParams.id`, `getConsultation(id)`, truyền `initialMockup={{logoUrl, mockupUrl, dielineUrl}}`)
→ `src/app/(public)/consultation/consultation-result.tsx`
**Layout**: L1

---

#### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                        │
├────────────────────────────────────────────────────────────────┤
│  [1 Nhập thông số] --- [2 Kết quả] --- [3 Đặt hàng]            │
│   ^ StepIndicator current={2} — screen DUY NHẤT có nó          │
│                                                                │
│  H1 "AI đã phân tích sản phẩm của bạn!"                        │
│                                                                │
│  ┌── BẢNG THÔNG SỐ ────────────────────────────────────────┐   │
│  │ Kiểu thùng        Thùng carton đối khẩu - RSC / A1       │  │
│  │ Kích thước       40 x 30 x 30 cm                        │   │
│  │ Số lớp           3                                      │   │
│  │ Sóng             B                                       │  │
│  │ Chất liệu        ...                                     │  │
│  │ In ấn            2 mặt chính                             │  │
│  │ Bọc bảo vệ       ...                                     │  │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  Giá ước tính · Số lượng tối thiểu · Lời khuyên của AI         │
│  Xem các lựa chọn khác (n)                                     │
│  [Panel Mockup in — xem §4]                                    │
│                                                                │
│  [Thêm vào giỏ]  [Mua ngay]  [Lưu làm mẫu]                     │
│  "Sau khi đặt hàng, nhân viên của chúng tôi sẽ xác nhận giá    │
│   và thời gian sản xuất trong vòng 24h."                       │
├────────────────────────────────────────────────────────────────┤
│  FOOTER                                                        │
└────────────────────────────────────────────────────────────────┘
```

#### States

| State | Render |
|---|---|
| `id` thiếu | `ErrorCard`: `Thiếu mã tư vấn.` |
| Không tìm thấy / không có `ai_recommendation` | `ErrorCard`: `Không tìm thấy kết quả tư vấn. Vui lòng thử lại.` |
| Lỗi khác | H1 `Không hiển thị được` + nút `Bắt đầu tư vấn lại` → `/consultation` |
| Thành công | Như mockup trên |

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Trùng lặp** | `consultation-result.tsx` (full-page) và `consultation-ready-state.tsx` (inline) là **hai bản render khác nhau** của cùng một `AIRecommendation`. Copy CTA giống nhau, bố cục khác. Sửa 1 chỗ phải nhớ sửa chỗ kia |
| **CTA** | `CustomCartActions` (`src/components/cart/custom-cart-actions.tsx`) — `Thêm vào giỏ` + `Mua ngay`, payload `{kind:'custom', consultationId, productId: rec.suggestedProductId, quantity: rec.moq, hasPrinting}`. Cả hai disabled khi `blockedByMockup`. `Mua ngay` = thêm giỏ rồi `router.push('/dashboard/checkout?items=<id>')`. **Cần đăng nhập** (API trả 401 → hint rồi redirect `/login`). Bên cạnh là `Lưu làm mẫu` → `saved_products` |

---

### 4. Print Mockup Panel (bản vẽ khuôn bế + ảnh in) ✅

**Purpose**: Sau khi AI trả kết quả và khách chọn có in → upload logo, chọn vị trí in, sinh
ảnh mockup + file khuôn bế.

**Route**: không phải route riêng — component con của §2 (cột phải) và §3
**Code**:
- `src/app/(public)/consultation/print-mockup-panel.tsx` — `PrintMockupPanel`
- `print-mockup-controls.tsx` — `PrintPositionField`, `LogoPicker`, `MockupPreview`
- `src/lib/config/print-positions.ts` — ràng buộc kiểu thùng ↔ mặt in
- API: `src/app/api/ai/mockup/route.ts` · logic: `src/lib/mockup/request.ts` · DB: `src/lib/data/consultations.ts`
**Layout**: n/a (inline)

---

#### Structure

```
┌── MOCKUP IN ─────────────────────────────────────────────  ┐
│  Vị trí in            │   ┌─ MockupPreview ─┐ ┌─Khuôn bế┐  │
│  ( ) 2 mặt chính      │   │  ảnh mockup     │ │  SVG     │ │
│  ( ) 2 mặt chính +    │   │  (mở tab mới)   │ │  link    │ │
│      2 mặt phụ        │   │  hoặc "Chưa có" │ └─────────┘  │
│  ( ) 1 mặt trên       │   └─────────────────┘              │
│                       │                                    │
│  Logo / hình in        │  Footnote:                        │
│  [Tải ảnh logo lên]    │  "Ảnh minh hoạ theo tỷ lệ thùng   │
│   PNG/JPG/WEBP <=10MB  │   AI khuyến nghị — bản in thật    │
│  [Tạo ảnh mockup]      │   theo file khuôn bế của xưởng."  │
└────────────────────────────────────────────────────────────┘
```

#### Danh sách vị trí in (`PRINT_POSITIONS_BY_BOX_STYLE`)

| Kiểu thùng | `box_style_id` | Vị trí in khả dụng |
|---|---|---|
| `rsc_a1` | Thùng đối khẩu | `2_main` = `2 mặt chính`, `4_sides` = `2 mặt chính + 2 mặt phụ` |
| `am_duong` | Thùng âm dương | `1_top` = `1 mặt trên` |
| `mailer` | Thùng nắp gài | `1_top` = `1 mặt trên` |
| (kiểu lạ) | — | fallback `DEFAULT_BOX_STYLE_ID = 'rsc_a1'` |

`LogoPicker`: button text đổi theo trạng thái — `Tải ảnh logo lên` → `Đổi logo khác` → tên file
đã chọn. `accept=".png,.jpg,.jpeg,.webp"`. Helper `PNG, JPG hoặc WEBP, tối đa 10MB`.

#### Luồng generate

| Bước | Chi tiết |
|---|---|
| 1 | Multipart `POST /api/ai/mockup` với `consultationId`, `printPosition`, file logo **hoặc** `logoUrl` cũ (nút Thử lại) |
| 2 | `readMockupForm` + `resolveMockupRequest` validate (bảng lỗi dưới) |
| 3 | `requestMockupSlot` — **CAS update** trên `consultations.mockup_requests`; `MAX_MOCKUP_REQUESTS = 3` |
| 4 | Upload logo + mockup + dieline SVG lên **Cloudinary** (server-side) |
| 5 | `updateMockupAssets` ghi `print_faces`, `logo_url`, `mockup_url`, `dieline_url` |
| 6 | 201 `{logoUrl, mockupUrl, dielineUrl, printPosition}` |

#### Bảng lỗi

| Where | Message | Status |
|---|---|---|
| API | `Đã đạt giới hạn 3 lần tạo mockup cho tư vấn này` | 429 |
| API | `Kiểu thùng này chưa có ảnh mockup gốc` | 500 |
| API | `Chưa cấu hình Cloudinary để lưu mockup` (`CloudinaryNotConfigured`) | 503 |
| API | fallback | 502 |
| Request | `Nội dung upload không hợp lệ` | 400 |
| Request | `Logo phải là ảnh PNG, JPG hoặc WEBP` | 415 |
| Request | `File logo vượt 10MB` | 413 |
| Request | `Vui lòng chọn ảnh logo trước` | 400 |
| Request | `consultationId không hợp lệ` | 400 |
| Request | `Không tìm thấy tư vấn` | 404 |
| Request | `AI chưa trả kết quả cho tư vấn này` | 409 |
| Request | `Tư vấn này không có in ấn` | 400 |
| Request | `Chưa cấu hình AI tạo mockup (AI_API_KEY)` | 503 |
| Request | `Vị trí in không hợp lệ với kiểu thùng này` | 400 |
| Request | `Thiếu kích thước thùng để tạo mockup` | 409 |
| Request | `URL logo không hợp lệ` / `URL logo phải là https` / `URL logo không thuộc storage được phép` | 400 |

#### States

| State | Render |
|---|---|
| AI trả `503` (chưa cấu hình) | panel set `status='unavailable'` → **gỡ lock** hai nút giỏ hàng |
| Chưa có mockup + khách chọn in | `CustomCartActions` nhận `disabled` → cả `Thêm vào giỏ` lẫn `Mua ngay` bị chặn, hint `Tạo ảnh mockup để tiếp tục đặt hàng.` (`blockedByMockup = result.hasPrinting && mockupStatus !== 'unavailable' && !mockupUrl`) |
| AI fail nhưng dieline đã sinh | ⚠️ giữ lại `dielineUrl` một phần — UI hiển thị khuôn bế không có ảnh in |
| Đủ điều kiện | `MockupPreview` hiện ảnh (click mở tab mới) + link `Khuôn bế` |

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Model** | `AI_IMAGE_MODEL ?? 'qwen-image-3.0'`, qua provider abstraction `getAIProvider()` (`ai-box`) — có Mock path khi thiếu key |
| **SSRF** | `validateAssetUrl` allowlist `*.supabase.co` + `res.cloudinary.com`, bắt buộc `https:`. Có comment `ponytail:` đánh dấu allowlist hardcode |
| **Dieline** | SVG sinh bởi engine thuần `src/lib/dieline` (mm → `toSVG`), render bằng `dangerouslySetInnerHTML` — input là kích thước số, không phải HTML user |
| **Hand-off** | Không còn hand-off qua URL. Ảnh ở lại `consultations.printing_*`; `POST /api/cart {kind:'custom', consultationId}` copy `mockupUrl`/`dielineUrl` vào dòng giỏ (`customFromConsultation()` ở `src/lib/data/cart-add.ts`), route đó 403 khi `consultation.customer_id` tồn tại mà khác `user.id` → chống lấy mockup người khác. `src/lib/mockup/handoff.ts` đã xoá |

---

### 5. Pricing (`/pricing`) ✅

**Purpose**: Bảng giá tham khảo theo catalog DB + chiết khấu số lượng. Trang công khai,
cũng là nơi duy nhất `CatalogTable` được dùng thật.

**Route**: `/pricing`
**Code**: `src/app/(public)/pricing/page.tsx` (async RSC, `getCatalogProducts()`)
+ `src/features/products/components/CatalogTable.tsx` + `PriceTierCards.tsx`
+ `src/lib/config/pricing.ts`
**Layout**: L1

---

#### Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                         │
├─────────────────────────────────────────────────────────────────┤
│  Eyebrow "Bảng giá"                                             │
│  H1 "Bảng giá thùng carton"                                     │
│                                                                 │
│  H2 "Catalogue sản phẩm"                                        │
│  Ghi chú: "Đơn giá tham khảo theo số lượng (chưa gồm VAT 10%)"  │
│  ┌─────┬────────────────────┬──────────┬──────┬──────┬─────┐    │
│  │ Mã  │ Sản phẩm            │ Quy cách │ 100+ │ 500+ │ ... │   │
│  ├─────┼────────────────────┼──────────┼──────┼──────┼─────┤    │
│  │ ...  │ ...                 │ ...      │ ...  │ ...  │     │  │
│  └─────┴────────────────────┴──────────┴──────┴──────┴─────┘    │
│                                                                 │
│  H2 "Chiết khấu theo số lượng"                                  │
│  4 thẻ tier: "Giá gốc" / "Giảm 5%" / "Giảm 10%" / "Giảm 15%"    │
│  tier cao nhất: "Số lượng lớn — liên hệ để có giá tốt nhất"     │
│                                                                 │
│  H2 "Lưu ý về giá" — 4 bullet (bullet đầu có icon Info)         │
│                                                                 │
│  ┌ Card "Cần báo giá chính xác?" ──────────────────────────┐    │
│  │ [Nhận tư vấn miễn phí] -> /consultation                  │   │
│  │ [Đặt hàng ngay] ---------> /shop                         │   │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER                                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Cấu hình giá (`src/lib/config/pricing.ts`)

| Khóa | Giá trị | Dùng ở đâu |
|---|---|---|
| `VOLUME_TIERS` | 100–499 → `0%` · 500–1999 → `5%` · 2000–9999 → `10%` · ≥10000 → `15%` | `CatalogTable`, `PriceTierCards`, tính `subtotal` đơn |
| `DEPOSIT_THRESHOLD` | `5_000_000` | `/api/orders` — đơn ≥ ngưỡng mới thu cọc |
| `DEPOSIT_PERCENTAGE` | `50` | `deposit = round(total * 50 / 100)` |
| `VAT_PERCENTAGE` | `10` | ⚠️ **chỉ để hiển thị** |

> ⚠️ **VAT không bao giờ được áp khi tạo đơn.** `VAT_PERCENTAGE` chỉ xuất hiện trong
> `CatalogTable` và bullet "Lưu ý về giá". `/api/orders` lưu `subtotal` / `total_amount`
> **chưa VAT**, `delivery_fee: 0` hardcode, `payment_status: 'unpaid'`, `status: 'pending'`.

#### States

| State | Render |
|---|---|
| Catalog rỗng | `EmptyState` `Chưa có sản phẩm nào` + action `Nhận tư vấn` |
| Đang render (RSC) | Trang là server component → không skeleton riêng; kế thừa `loading.tsx` của route group nếu có |

---

### 6. Dieline Lab (`/dieline-lab`) ✅ (orphan)

**Purpose**: Công cụ xem trước **khuôn bế** (dieline) thuần SVG: chọn kiểu, nhập mm, zoom,
tải SVG / In-PDF. Độc lập với luồng tư vấn.

**Route**: `/dieline-lab` · metadata title `Xem trước khuôn bế (Dieline) — AI Carton Packaging`
**Code**: `src/app/(public)/dieline-lab/page.tsx` → `src/features/dieline/DielinePreview.tsx`
(engine: `src/lib/dieline/` — `build`, `render`, `toSVG`, `printPlacements`)
**Layout**: L1

> ⚠️ **Không có bất kỳ link nội bộ nào trỏ vào trang này** (đã `grep` navbar, footer,
> landing, dashboard). Chỉ vào được bằng URL gõ tay. `DielinePreview` cũng không được
> import ở đâu khác trong `src/`.

---

#### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  H1 "Xem trước khuôn bế thùng carton"                          │
│  max-w-6xl — grid gap-4                                        │
│  lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]                  │
│                                                                │
│  PANEL TRÁI                │  CANVAS PHẢI                      │
│  Kiểu thùng (3 nút)        │   ┌────────────────────────────┐  │
│   Thùng đối khẩu /         │   │  SVG dieline               │  │
│    RSC — FEFCO 0201        │   │  overlay: "khổ trải         │ │
│   Thùng âm dương /         │   │   W x H mm"                 │ │
│    Nắp + đáy rời           │   │  legend: Đường cắt /        │ │
│    — FEFCO 0300            │   │   Đường cấn / Kích thước   │  │
│   Thùng nắp gài /          │   └────────────────────────────┘  │
│    Mailer — Roll End       │  Zoom: [slider 20%..800%]         │
│    Tuck Top                │  [Vừa khung] [1:1] [To] [Nhỏ]     │
│  Kích thước lòng trong (mm)│  [Tải SVG] [In / PDF]             │
│   Dài (D) Cao (C)           │                                  │
│   Rộng (R) Độ dày (t)       │                                  │
│   mặc định 300/200/200/5   │                                   │
│  [+ Thông số kỹ thuật]      │                                  │
│   (Biên keo, Khe hở nắp/đáy,│                                  │
│    Cao nắp, Khe 2 mảnh)     │                                  │
│  Hiển thị                    │                                 │
│   [x] Đường kích thước       │                                 │
│   [x] Nhãn mặt / tag         │                                 │
└────────────────────────────────────────────────────────────────┘
```

Nút mở/đóng nhóm nâng cao: `+ Thông số kỹ thuật` / `− Thu gọn`.

#### Ánh xạ kiểu

| `box_style_id` (AI / DB) | kiểu dieline (`DIELINE_TYPES`) |
|---|---|
| `rsc_a1` | `rsc` |
| `am_duong` | `telescope` |
| `mailer` | `mailer` |

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Engine** | Pure SVG, toạ độ mm, không thư viện CAD, không gọi AI. Render qua `dangerouslySetInnerHTML` — nội dung do engine tự sinh từ số |
| **In / PDF** | Mở bản in trình duyệt (`window.print` path) chứ không phải lib PDF server-side |
| **Accessibility** | Slider zoom có `aria-label`; mọi input có label. Không có keyboard shortcut cho zoom |

---

### 7. Order — đã nghỉ (`/order` → redirect)

**Purpose**: Trước đây là form tạo đơn riêng (13 file). **Đã bỏ**: đơn hàng chỉ được
tạo qua **Thêm vào giỏ** hoặc **Mua ngay**, nên form này không còn lý do tồn tại.

**Route**: `/order` — còn giữ một file `src/app/(public)/order/page.tsx` duy nhất:
`redirect('/dashboard/custom')`, để URL đã chia sẻ không chết.

**Code đã xoá**: `order-form.tsx`, `order-sections.tsx`, `order-items.tsx`,
`order-summary.tsx`, `order-actions.tsx`, `order-submit.ts`, `order-schema.ts`,
`order-utils.ts`, `order-types.ts`, `saved-templates-picker.tsx`,
`print-handoff-notice.tsx`, `form-field.tsx` + `src/lib/mockup/handoff.ts`.
Di dời trước khi xoá: `ProductOption` → `src/features/products/types.ts`;
`Field` → `src/components/ui/field.tsx`; primitives của form tư vấn (
`Section`/`RadioGroup`/`BoxStylePicker`/`InlineError`) → `src/components/consultation/fields.tsx`.

**Ba đường mua còn lại**:

| Screen | Đường |
|---|---|
| Shop (`/shop`) | hàng có sẵn → `Thêm vào giỏ` / `Mua ngay` |
| Thùng theo yêu cầu (`/dashboard/custom`) | mẫu đã lưu + tự nhập quy cách → giỏ |
| Giỏ hàng (`/dashboard/cart`) + Thanh toán (`/dashboard/checkout`) | chọn dòng, chọn địa chỉ đã lưu, đặt |

Hành vi khác biệt so với bản cũ: màn kết quả tư vấn không còn `Đặt hàng ngay` →
`/order?consultation=…`; thay bằng đúng hai nút giỏ hàng, và **cần đăng nhập**
(trước đây `/order` mở cho khách lạ, chỉ submit mới chặn).

---

### 8. About (`/about`) ✅ (nội dung tĩnh)

**Purpose**: Trang giới thiệu nhà máy / năng lực, xây niềm tin.

**Route**: `/about`
**Code**: `src/app/(public)/about/page.tsx` + `about/components/`:
`ServicesGrid.tsx`, `ProcessSteps.tsx`, `ExpertiseSection.tsx`, `FactorySection.tsx`
**Layout**: L1

#### Structure

```
┌────────────────────────────────────────────────────────────────┐
│  HERO — ảnh nền picsum.photos/seed/carton-factory-floor        │
│  H1 "Packaging Expertise, Powered by AI"  ⚠️ tiếng Anh          │
├────────────────────────────────────────────────────────────────┤
│  "Không chỉ là một nhà sản xuất carton"        (Statement)     │
│  "Chúng tôi cung cấp những gì?"  ServicesGrid (5 mục)          │
│  "Quy trình hoạt động"           ProcessSteps (5 bước)         │
│  "AI + Chuyên môn con người"      ExpertiseSection             │
│  "Dành cho doanh nghiệp"          6 pill:                      │
│    Nhà sản xuất · Thương hiệu · OEM · Doanh nghiệp xuất khẩu   │
│    Người bán online · Doanh nghiệp nhỏ                         │
│  "Nhà máy thực tế. Sản xuất thực tế." FactorySection (3 picsum)│
│  CTA "Một cách đơn giản hơn để đặt bao bì"                     │
│      [Bắt đầu tư vấn] -> /consultation                         │
└────────────────────────────────────────────────────────────────┘
```

#### Ghi chú

| Aspect | Quyết định |
|---|---|
| **Motion** | `<FadeIn>` (`src/components/ui/FadeIn.tsx`) bọc từng section |
| **⚠️ Ảnh placeholder** | Hero + FactorySection dùng `picsum.photos`. `next.config.mjs` **chỉ whitelist `picsum.photos`** cho `next/image` → mọi ảnh Cloudinary khác trong app phải dùng raw `<img>` (comment trong `src/components/order/print-preview-strip.tsx` xác nhận) |
| **Link vào About** | Navbar `Về chúng tôi`, footer `Về chúng tôi` + `Liên hệ`, và nút phụ hero landing `Xem sản phẩm →` đều trỏ về đây |

---

### 9. Login (`/login`) ✅

**Purpose**: Đăng nhập khách hàng (và nhân viên — chưa có branch nào).

**Route**: `/login`
**Code**: `src/app/(guest)/login/page.tsx`
**Layout**: L4 (guest — thực tế không có navbar/footer)

#### Structure

```
┌───────────────────────────────────────────────────────────────┐
│  (không navbar, không footer — layout (guest) là passthrough) │
│                                                               │
│         ┌ card max-w-md, căn giữa ──────────────┐             │
│         │  AI Carton                            │             │
│         │  H1 "Đăng nhập"                        │            │
│         │  Email      [you@example.com]          │            │
│         │  Mật khẩu   [••••••]  (mắt)            │            │
│         │           ⚠️ "Quên mật khẩu?"          │             │
│         │              -> /forgot-password       │            │
│         │  [ Đăng nhập ] / "Đang xử lý..."       │            │
│         │  ─── hoặc ───                          │            │
│         │  [ Đăng nhập với Google ]              │            │
│         │  Chưa có tài khoản? Đăng ký            │            │
│         └────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────────┘
```

#### Fields / Copy

| Element | Chi tiết |
|---|---|
| `email` | label `Email`, placeholder `you@example.com` |
| `password` | label `Mật khẩu`, toggle eye — ⚠️ `aria-label` tiếng Anh: `Hide password` / `Show password` |
| Quên mật khẩu | link `Quên mật khẩu?` → `/forgot-password` — ⚠️ **page đó không tồn tại** (404) |
| Submit | `Đăng nhập` / `Đang xử lý...` |
| OAuth | `Đăng nhập với Google` → `supabase.auth.signInWithOAuth({ provider: 'google' })` → callback `/api/auth/callback` |
| Divider | `hoặc` |
| Footer | `Chưa có tài khoản? Đăng ký` → `/register` |
| Lỗi | `Email hoặc mật khẩu không đúng.` |

#### States / Điều hướng

| State | Hành vi |
|---|---|
| Thành công | `router.push('/dashboard')` — ⚠️ **luôn** `/dashboard`, kể cả khi `profiles.role = staff`. Không có branch nào sang `/staff` |
| Đã login | middleware đá về `/dashboard` |
| Callback lỗi | `/api/auth/callback` redirect về `/login?error=auth_failed` — ⚠️ trang login **không đọc** `searchParams.error` nên khách không thấy lý do |

---

### 10. Register (`/register`) ✅

**Purpose**: Mở tài khoản khách hàng.

**Route**: `/register`
**Code**: `src/app/(guest)/register/page.tsx`
**Layout**: L4

#### Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌ card max-w-md ────────────────────────────────┐              │
│  │  H1 "Đăng ký tài khoản"                        │             │
│  │  Họ tên       [Nguyễn Văn A]                   │             │
│  │  Email        [you@example.com]                │             │
│  │  Số điện thoại[Nhập SĐT: 0901 234 567]         │             │
│  │  Mật khẩu     [••••••]  (mắt)                  │             │
│  │  (KHÔNG có ô "Nhập lại mật khẩu")              │             │
│  │  [x] Tôi đồng ý với điều khoản sử dụng          │            │
│  │  [ Đăng ký ] / "Đang xử lý..."                  │            │
│  │  Đã có tài khoản? Đăng nhập                     │            │
│  └────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

#### Fields / Copy

| Field | Label | Validate |
|---|---|---|
| `name` | `Họ tên` | required, placeholder `Nguyễn Văn A` |
| `email` | `Email` | required, email |
| `phone` | `Số điện thoại` | required, placeholder `0901 234 567` |
| `password` | `Mật khẩu` | `.min(6)` |
| — | ⚠️ **không có `confirmPassword`** | khách chỉ nhập mật khẩu 1 lần |
| `agree` | `Tôi đồng ý với điều khoản sử dụng` | `z.literal(true, 'Vui lòng đồng ý với điều khoản')`; link điều khoản `href="#"` — ⚠️ **dead link** |

#### Luồng ghi dữ liệu (đọc trực tiếp từ code)

```
signUp({ email, password, options: { data: { full_name: name, phone } } })
   └─> profiles.upsert({ id, full_name, phone })      ⚠️ KHÔNG gửi `role`
```

| Hệ quả | Chi tiết |
|---|---|
| Role | Do **DB default** quyết định → `customer`. Không có cách nào tự đăng ký thành staff từ UI |
| Email confirm | Nếu project bật "Confirm email", `upsert` chạy trước khi khách xác thực email; không có màn thông báo riêng |
| Sau khi xong | `router.push('/dashboard')` |

---

## AUTHENTICATED — CUSTOMER

Route group `(auth)` → `src/app/(auth)/…`. Mọi screen dùng **L2** (Navbar `hideAuth` +
`DashboardNav` + `main flex-1 p-6 overflow-auto`), **không có Footer**. Middleware gate
theo pathname — xem L2 để biết vì sao customer login vào được `/staff/*`.

---

### 11. Customer Dashboard (`/dashboard`) ✅

**Purpose**: Trang chủ khách hàng — stat, shortcut, đơn gần đây.

**Route**: `/dashboard`
**Code**: `src/app/(auth)/dashboard/page.tsx` (RSC)
**Layout**: L2

```
┌───────────────────────────────────────────────────────────────┐
│ NAVBAR (hideAuth)                                             │
├──────────────┬────────────────────────────────────────────────┤
│ DashboardNav │  "Xin chào, {firstName || 'bạn'}"              │
│  Tổng quan   │   "Chào mừng trở lại"                          │
│  Đơn hàng    │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  Lịch sử     │  │Tổng đơn │ │Đang xử  │ │Sản phẩm │           │
│  Hồ sơ       │  │  hàng   │ │  lý     │ │đã lưu   │           │
│  [Đăng xuất] │  │    12   │ │    3    │ │   0 ⚠️  │            │
│              │  └─────────┘ └─────────┘ └─────────┘           │
│              │  [Tư vấn mới] [Đặt lại] [Theo dõi đơn]         │
│              │  H2 "Đơn hàng gần đây"            [Xem tất cả] │
│              │  ┌────────┬─────┬─────┬──────┬──────┐          │
│              │  │Mã đơn  │Sản  │Trạng│Ngày  │Số    │          │
│              │  │hàng    │phẩm │thái │đặt   │tiền  │          │
│              │  └────────┴─────┴─────┴──────┴──────┘          │
└──────────────┴────────────────────────────────────────────────┘
```

| Element | Copy / hành vi đúng như code |
|---|---|
| Greeting | `Xin chào, {firstName \|\| 'bạn'}` + phụ đề `Chào mừng trở lại` |
| Stat 1 | `Tổng đơn hàng` |
| Stat 2 | `Đang xử lý` |
| Stat 3 | `Sản phẩm đã lưu` — ⚠️ **luôn bằng 0**: đếm bảng `saved_products`, và không có code nào INSERT vào bảng đó (chỉ có SELECT đếm ở `src/lib/data/orders.ts`) |
| Shortcut | `Tư vấn mới` → `/consultation` · `Đặt lại` → `/dashboard/reorder` · `Theo dõi đơn` → `/dashboard/orders` |
| Bảng | cột `Mã đơn hàng` / `Sản phẩm` / `Trạng thái` / `Ngày đặt` / `Số tiền`, link `Xem tất cả` → `/dashboard/orders` |
| Rỗng | `EmptyState` title `Bạn chưa có đơn hàng nào` |

---

### 12. My Orders (`/dashboard/orders`) ✅

**Route**: `/dashboard/orders?status=&page=&search=&orderId=`
**Code**: `src/app/(auth)/dashboard/orders/page.tsx` (RSC) + `order-ui.tsx`
(`OrdersToolbar`, `OrderCard`, `OrdersPagination`, `OrdersEmptyState`, `OrdersErrorState`)
+ `order-modals.tsx` (M7) + `loading.tsx` (skeleton)
**Layout**: L2

```
┌───────────────────────────────────────────────────────────────┐
│ H1 "Đơn hàng của tôi"        [Mua hàng] [Theo yêu cầu]        │
│ "Theo dõi đơn hàng đóng gói và trạng thái thanh toán."        │
│   (hai link sang /shop + /dashboard/custom — không còn modal   │
│    tạo đơn; đơn chỉ sinh ra từ giỏ hàng)                       │
│                                                               │
│ [input Tìm theo mã đơn hàng] [Tìm kiếm]                       │
│ (Tất cả)(Chờ xử lý)(Đang duyệt)(Đã xác nhận)(Đang sản xuất)   │
│ (Hoàn thành)(Đã giao)(Đã hủy)                                 │
│                                                               │
│ ┌ OrderCard ─────────────────────────────────────────────┐    │
│ │ [icon] ORD-2026-0042       [StatusBadge][PaymentBadge] │    │
│ │ [Clock] 4 thg 9, 2026, 09:12   [Package] Cà phê x100   │    │
│ │                    +2 sản phẩm khác                    │    │
│ │ [PrintPreviewStrip: mockup | khuôn bế]                │     │
│ │ ████████████░░░░░░░░░░░░  progress bar                 │    │
│ │ TỔNG TIỀN  12.500.000đ   [Hủy][Đặt lại][Chi tiết →]   │     │
│ └────────────────────────────────────────────────────────┘    │
│ [Trước]      Trang 2 / 5      [Sau]                           │
└───────────────────────────────────────────────────────────────┘
```

| Chi tiết | Code |
|---|---|
| Filter pills | `FILTERS` trong `order-ui.tsx`: `Tất cả` `Chờ xử lý` `Đang duyệt` `Đã xác nhận` `Đang sản xuất` `Hoàn thành` `Đã giao` `Đã hủy`. Là **link URL** (`?status=`), không phải client state — đổi filter tự reset `page` |
| Search | form GET thường (`<form action={pathname}>`), input `name="search"`, nút `Tìm kiếm` |
| Pagination | `getCustomerOrders` `limit` mặc định 10, max 50. `OrdersPagination` return `null` khi `totalPages <= 1`; `Trước` / `Sau` dùng `aria-disabled` + `pointer-events-none opacity-50`; label `Trang {page} / {totalPages}` |
| `Mua hàng` / `Thùng theo yêu cầu` | hai link thường → `/shop`, `/dashboard/custom`. `CreateOrderModal` đã **xoá** cùng form `/order` |
| `Chi tiết` | link `?orderId=<uuid>` → mở `OrderQuickViewModal` (M7) **ngay trên danh sách**, không sang route detail |
| `Hủy` | `CancelOrderButton` → M2, hiện khi `canCustomerCancelOrder(status)` ⇔ `status === 'pending'` |
| `Đặt lại` | chỉ hiện khi `showReorder` → ⚠️ `/dashboard/orders` **không** truyền prop này nên nút không bao giờ hiện ở đây (chỉ hiện ở §14) |
| Empty | `OrdersEmptyState` title `Chưa có đơn hàng`, description `Đơn đặt từ giỏ hàng hoặc đặt lại sẽ xuất hiện tại đây.` (không còn actionHref) |
| Error | `OrdersErrorState` → `ErrorState` (`Không thể tải dữ liệu`) |
| Summary | `getItemSummary` → `"${first.product_name} x${first.quantity} +N sản phẩm khác"` |
| Ngày | `formatDateTime` — `dateStyle:'medium'`, `timeStyle:'short'`, `Asia/Ho_Chi_Minh` |
| Progress | `getOrderProgress(status)` → %; bar `bg-red-500` nếu `cancelled`, ngược lại `bg-blue-600` |

---

### 13. Order Detail (`/dashboard/orders/[id]`) ✅

**Route**: `/dashboard/orders/[id]`
**Code**: `src/app/(auth)/dashboard/orders/[id]/page.tsx` (RSC). Guard: `id` không phải
UUID → `notFound()`; không có đơn hoặc không thuộc về khách hiện tại → `notFound()`.
**Layout**: L2

```
┌───────────────────────────────────────────────────────────────┐
│ H1 "Theo dõi tiến độ yêu cầu"                                 │
│ Mã yêu cầu: #ORD-2026-0042                                    │
│ Tạo lúc 4 thg 9, 2026, 09:12   [StatusBadge] [PaymentBadge]   │
│                                                               │
│ ┌ STATUS TIMELINE — 7 cột, min-w-[760px], overflow-x-auto ─┐  │
│ │  ✓────────✓────────●────────○────────○────────○────────○ │  │
│ │ Chờ     Đang    Đã xác   Đã đặt   Đang     Hoàn    Đã    │  │
│ │ xử lý   duyệt   nhận     cọc      sản      thành   giao  │  │
│ │ 04/09   05/09   06/09    Đang    Đang      Đang   Đang   │  │
│ │                 chờ      chờ     chờ        chờ    chờ   │  │
│ └──────────────────────────────────────────────────────────┘  │
│ (đơn hủy: dòng đỏ "Đơn hàng đã hủy vào 06/09/2026")           │
│                                                               │
│ grid gap-6 xl:grid-cols-[1fr_360px]                           │
│ CỘT TRÁI                     │  CỘT PHẢI                      │
│  Card "Sản phẩm"             │  Card "Tóm tắt đơn hàng"       │
│   tên · mã · D×R×C · SL      │   Tiền hàng                    │
│   [PrintPreviewStrip md]     │   Phí giao hàng (luôn 0)       │
│  Card "Liên hệ và giao nhận" │   Tiền cọc                     │
│                              │   Tổng cộng                    │
│                              │   Thanh toán                   │
│                              │  [Hủy đơn hàng]                │
│                              │  [Đặt lại]                     │
│                              │  [Tất cả đơn hàng]             │
└───────────────────────────────────────────────────────────────┘
```

| Nút | Điều kiện (`src/lib/data/order-shared.ts`) |
|---|---|
| `Hủy đơn hàng` | `canCustomerCancelOrder` ⇔ `status === 'pending'` → mở M2 |
| `Đặt lại` | `canReorderOrder` ⇔ `status === 'completed' \|\| status === 'delivered'` → `/dashboard/reorder?id=` |
| `Tất cả đơn hàng` | link `/dashboard/orders` |

#### Status Timeline (`src/components/ui/status-timeline.tsx`)

| Thuộc tính | Chi tiết |
|---|---|
| Khung | `<ol className="grid min-w-[760px] grid-cols-7">` bọc trong `overflow-x-auto`, card `max-w-5xl` |
| Cột | `ORDER_STATUS_SEQUENCE` **đã lọc bỏ `cancelled`** → đúng 7 mốc như mockup |
| Icon | Phosphor `weight="bold"`: `CheckCircle` `Package` `ClipboardText` `CurrencyCircleDollar` `Factory` `SealCheck` `Truck` |
| Ngày | `dd/MM/yyyy` qua `Intl`, timezone `Asia/Ho_Chi_Minh` |
| Chưa tới | label `Đang chờ` |
| Đã hủy | nét nối đỏ + dòng `Đơn hàng đã hủy vào {date}` |

---

### 14. Order History (`/dashboard/history`) ✅

**Route**: `/dashboard/history`
**Code**: `src/app/(auth)/dashboard/history/page.tsx` — dùng lại `OrderCard` + `OrdersToolbar`
với `historyOnly: true` và `HISTORY_FILTERS`
**Layout**: L2

| Element | Copy đúng như code |
|---|---|
| H1 | `Lịch sử đơn hàng` |
| Filter | `HISTORY_FILTERS`: `Tất cả` / `Hoàn thành` / `Đã giao` |
| Search placeholder | `Tìm đơn hàng đã hoàn thành` |
| Dữ liệu | `HISTORY_STATUSES = ['completed','delivered']` — đơn đang sản xuất **không** xuất hiện |
| Card | `<OrderCard showReorder />` → nút `Đặt lại` hiện ở đây (khác §12) |
| Empty | title `Chưa có lịch sử đơn hàng`, description `Đơn hàng đã hoàn thành hoặc đã giao sẽ xuất hiện tại đây.` |

---

### 15. Reorder (`/dashboard/reorder`) ✅

**Route**: `/dashboard/reorder?id=<uuid>`
**Code**: `src/app/(auth)/dashboard/reorder/page.tsx` (RSC) + `reorder-form.tsx` (`ReorderForm`)
→ `POST /api/reorder`
**Layout**: L2

```
┌───────────────────────────────────────────────────────────────┐
│ H1 "Đặt lại"                                                  │
│ "Tạo đơn hàng mới từ đơn cũ, dùng giá hiện tại do server      │
│  tính lại."                                                   │
│                                                               │
│ Danh sách đơn cũ — mỗi dòng có nút [Chọn]                     │
│                                                               │
│ Card "Sản phẩm từ ORD-2026-0042"                              │
│   Cà phê 1kg            Số lượng [ 100 ]                      │
│   ...                                                         │
│ Card "Tóm tắt đặt lại"                                        │
│   Đơn gốc : ORD-2026-0042                                     │
│   Phương thức thanh toán  [Thanh toán khi nhận hàng ▼]        │
│   Ghi chú               [________________]                    │
│   Tổng tạm tính ......................  4.500.000đ            │
│ [Tạo đơn đặt lại] / "Đang tạo..."                             │
│   ok -> "Đã tạo đơn đặt lại: ORD-2026-0077"  [Xem đơn hàng]   │
└───────────────────────────────────────────────────────────────┘
```

| State | Render |
|---|---|
| Chưa có đơn | `Chưa có đơn hàng trước đó` + link `Tạo đơn hàng` |
| Không phải khách | `Tính năng đặt lại chỉ dành cho tài khoản khách hàng.` (check `profiles.role` ở app layer) |
| Đang gửi | nút `Đang tạo...` |
| Thành công | `Đã tạo đơn đặt lại: {code}` + nút `Xem đơn hàng` |

> Giá **không** sao chép từ đơn cũ: `/api/reorder` re-price theo catalog hiện tại.

---

### 16. Profile (`/dashboard/profile`) ✅ (2 nút chết)

**Route**: `/dashboard/profile`
**Code**: `src/app/(auth)/dashboard/profile/page.tsx` (RSC + form client + `ProfileSkeleton`)
**Layout**: L2

```
┌────────────────────────────────────────────────────────────────┐
│ H1 "Thông tin tài khoản"                                       │
│ "Quản lý thông tin cá nhân của bạn"                            │
│                                                                │
│  Họ tên               [______________________]                 │
│  Email                [______________________] (readOnly)      │
│                       ✓ Đã xác thực        ⚠️ hardcode          │
│  Số điện thoại        [______________________]                 │
│  Tên công ty          [______________________]                 │
│  Địa chỉ mặc định     [______________________]                 │
│  [Lưu thay đổi] / "Đang lưu..."  ok -> "Đã lưu thay đổi"       │
│                                                                │
│ ┌── KHU VỰC NGUY HIỂM ──────────────────────────────────────┐  │
│ │ H2 "Khu vực nguy hiểm"                                     │ │
│ │ "Các hành động không thể hoàn tác"                         │ │
│ │ [Đổi mật khẩu]  [Xóa tài khoản]   ⚠️ không có onClick      │  │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

| ⚠️ Đã xác nhận trên đĩa | Chi tiết |
|---|---|
| `✓ Đã xác thực` | Dòng chữ render **cứng**, không đọc `email_confirmed_at` hay flag nào → hiện cả với email chưa xác thực |
| `Đổi mật khẩu` / `Xóa tài khoản` | Hai `<Button>` **không có handler**, không có modal, không có API route. Bấm không xảy ra gì |
| Email | `readOnly`, không submit về server |
| Loading | `ProfileSkeleton` trong cùng file |

---

## AUTHENTICATED — STAFF 🚧

> ⚠️ **TOÀN BỘ NHÓM NÀY CHƯA TRIỂN KHAI.** 7 file `page.tsx` trong `src/app/(staff)/staff/`
> đều có cùng 3 dòng:
>
> ```tsx
> import UnderDevelopmentPage from '@/app/UnderDevelopmentPage'
> export default function StaffPage() { return <UnderDevelopmentPage /> }
> ```
>
> `src/app/UnderDevelopmentPage.tsx` render: icon `Wrench` xám, H1 **`Đang phát triển`**,
> `Trang này đang được xây dựng. Vui lòng quay lại sau.`, nút **`Về trang chủ`** → `/`.
>
> API phía staff cũng chưa: `GET`/`POST` `/api/consultations` và `/api/products` đều trả
> `501 { message: 'Under development' }`. Phần đã có thật là logic server:
> `PATCH /api/orders/[id]/status` (transition + `isStaff()`), `PATCH /api/orders/[id]/payment`,
> `GET` 2 route đó trả allowed transitions. **UI chưa tồn tại để gọi chúng.**
>
> Middleware (`src/middleware.ts`) chỉ check "đã đăng nhập", **không check role** → customer
> login gõ URL `/staff/...` vẫn vào tới nơi (chỉ thấy stub — nhưng đây là khoảng trống thật,
> xem L2).
>
> Nội dung §17–§21 dưới đây là **spec ý đồ** để implement khi làm, không phải mô tả code.
> Ảnh mockup, bảng và số liệu trong đó là dữ kiện giả định.

---

### 17. Staff Dashboard (`/staff`) 🚧 CHƯA TRIỂN KHAI

**Route**: `/staff` · **Layout**: L3 · **Code thật**: `<UnderDevelopmentPage />`

Spec ý đồ:

```
┌───────────────────────────────────────────────────────────────┐
│ Sidebar (xem L3) | MAIN                                       │
│  H1 "Tổng quan"                                               │
│  4-5 stat card: Tư vấn mới · Đơn chờ xử lý · Đang sản xuất ·  │
│                 Đã giao · Doanh thu tháng                     │
│  Bảng "Tư vấn gần đây" (Khách/Sản phẩm/Kích thước/Giá/Hành    │
│      động) + link "Xem tất cả" → /staff/consultations         │
│  ⚠️ Chart: recharts CHƯA được cài (không có trong              │
│     package.json dependencies) — sẽ phải thêm khi làm UI thật │
└───────────────────────────────────────────────────────────────┘
```

| ⚠️ Doc cũ sai | Chi tiết |
|---|---|
| Sidebar có `Cài đặt` + tên staff | `StaffSidebar` thật chỉ có 5 link + `Đăng xuất`, không có mục cài đặt |
| `recharts` installed | Chưa cài. `docs/DEVELOPMENT_GUIDE.md` cũng ghi ❌ |
| Footer "minimal" | L3 không render Footer |

---

### 18. Staff Consultations (`/staff/consultations` + `/[id]`) 🚧 CHƯA TRIỂN KHAI

**Route**: `/staff/consultations`, `/staff/consultations/[id]` · **Layout**: L3
**Code thật**: cả 2 là `<UnderDevelopmentPage />`; `/api/consultations` trả 501

Spec ý đồ (dựa trên dữ liệu đã có trong DB + `src/lib/data/consultations.ts`):

```
/staff/consultations          /staff/consultations/[id]
┌───────────────────────┐     ┌──────────────────────────────  ┐
│ Lọc: pending /         │     │ Input khách + AIRecommendation│
│  ai_processed          │     │ Ảnh mockup + khuôn bế         │
│ Bảng: Khách · Sản      │     │ [Chấp nhận] [Yêu cầu sửa]     │
│  phẩm · Kích thước ·   │     │  ⚠ Chưa có API cho 2 action   │
│  Giá ước tính · [Xem]  │     │  này. Chuyển sang đơn = khách │
└───────────────────────┘     │  tự đặt qua giỏ hàng            │
   Nguồn: bảng consultations   │  (/dashboard/custom hoặc /shop)│
   (status, ai_recommendation, └────────────────────────────── ┘
    mockup_url, dieline_url)
```

---

### 19. Staff Orders (`/staff/orders` + `/[id]`) 🚧 CHƯA TRIỂN KHAI

**Route**: `/staff/orders`, `/staff/orders/[id]` · **Layout**: L3 · **Code thật**: stub

| Đã có (server) | Chưa có (UI) |
|---|---|
| `PATCH /api/orders/[id]/status` với `STAFF_TRANSITIONS` (đồ thị chuyển trạng thái đầy đủ) | Danh sách đơn hàng theo status + search + pagination |
| `GET /api/orders/[id]/status` trả `label` + `allowedStatuses` | Dropdown "chuyển sang trạng thái X" |
| `PATCH /api/orders/[id]/payment` — đối soát proof, set `deposit_paid`/`paid` | Nút mở M4 (`UploadPaymentProofModal`) — component đã viết, chưa nơi gọi |
| `getOrderProgress`, `ORDER_STATUS_DISPLAY` | Bảng doanh thu / thống kê |

```
/staff/orders/[id]  (spec — reuse được 80% §13)
┌────────────────────────────────────────────────┐
│ Mã đơn + khách + StatusBadge + PaymentBadge    │
│ Timeline 7 mốc (component đã có)               │
│ Sản phẩm + mockup/dieline (PrintPreviewStrip)  │
│ [Chuyển trạng thái ▼]  (chỉ các status trong   │
│    STAFF_TRANSITIONS)                          │
│ [Đối soát thanh toán] → mở M4                  │
│ [Sửa giá] → mở M3 khi Δ > 15%                  │
└────────────────────────────────────────────────┘
```

---

### 20. Staff Customers (`/staff/customers`) 🚧 CHƯA TRIỂN KHAI

**Route**: `/staff/customers` · **Layout**: L3 · **Code thật**: stub
**Component đã viết, chờ nối**: M5 `CustomerQuickViewModal` (`src/components/modals/CustomerQuickView.tsx`)

Spec: bảng khách hàng (search theo tên/điện thoại/email) + bấm 1 dòng → mở M5
(`Tổng đơn` / `Tổng chi` / `Đơn gần nhất` + `Đơn hàng gần đây` + `Xem tất cả đơn hàng`).
Data đọc từ `profiles` + aggregate `orders` — chưa có hàm data-layer nào cho việc này
(hàm thống kê trong M5 nhận props, chưa có source).

---

### 21. Staff Products (`/staff/products`) 🚧 CHƯA TRIỂN KHAI

**Route**: `/staff/products` · **Layout**: L3 · **Code thật**: stub; `/api/products` trả 501

| Đã có, chờ nối | Chi tiết |
|---|---|
| `CatalogTable` (`src/features/products/components/CatalogTable.tsx`) | Đang dùng thật ở `/pricing` (public). Bản staff sẽ cần thêm cột hành động |
| `ProductEditDrawer` + `ProductEditFormFields` (M6) | Component hoàn chỉnh, chưa import ở đâu |
| `getCatalogProducts()` / `getActiveProductOptions()` (`src/lib/data/products.ts`) | Nguồn dữ liệu cho list |
| `src/features/products/utils.ts` | Helper giá/tier |

```
/staff/products (spec)
┌────────────────────────────────────────────────┐
│ [Thêm sản phẩm] → mở M6 (create mode)          │
│ Bảng: Ảnh · Tên · Loại sóng · Kích thước ·     │
│       Đơn giá · is_active · [Sửa] [Ẩn/Hiện]    │
│   [Sửa] → mở M6 (edit mode)                    │
│ ⚠️ API POST/PATCH products chưa có (501)        │
└────────────────────────────────────────────────┘
```

---

## SHARED LAYOUTS

Bốn layout, đối chiếu `src/app/*/layout.tsx`:

| ID | File | Cấu trúc |
|---|---|---|
| L1 | `src/app/(public)/layout.tsx` | `<Navbar />` + `main min-h-[calc(100dvh-4rem)]` + `<Footer />` |
| L2 | `src/app/(auth)/layout.tsx` | `<Navbar hideAuth />` + `div flex min-h-[calc(100dvh-4rem)]` + `<DashboardNav />` + `main flex-1 p-6 overflow-auto` — **không Footer** |
| L3 | `src/app/(staff)/layout.tsx` | Giống L2 nhưng `<StaffSidebar />` thay `DashboardNav` — **không Footer** |
| L4 | `src/app/(guest)/layout.tsx` | `return <>{children}</>` — thuần passthrough |

Root `src/app/layout.tsx`: font `Inter`, `<html lang="vi">`, metadata title
`AI Carton Packaging — Giải pháp đóng gói thông minh`. ⚠️ Không có `error.tsx` /
`not-found.tsx` global nào trong `src/app/`.

### L1. Public Layout ✅

```
┌────────────────────────────────────────────────────────────────┐
│ NAVBAR sticky h-16 bg-white/80 backdrop-blur-md                │
│  [AI Carton] Trang chủ  Tư vấn  Về chúng tôi  Bảng giá         │
│                        (login?  [Dashboard]                    │
│                                 : [Đăng nhập][Đăng ký])        │
├────────────────────────────────────────────────────────────────┤
│ <main className="min-h-[calc(100dvh-4rem)]">  children         │
├────────────────────────────────────────────────────────────────┤
│ FOOTER                                                         │
│  Dịch vụ: Tư vấn AI · Đặt hàng · Bảng giá                      │
│  Công ty: Về chúng tôi · Liên hệ                               │
│  Hỗ trợ:  Câu hỏi thường gặp ⚠️(/#faq chết) ·                   │
│           Điều khoản sử dụng ⚠️(href="#")                       │
│  © {year} AI Carton Packaging. All rights reserved.            │
└────────────────────────────────────────────────────────────────┘
```

Dùng bởi: `/`, `/consultation`, `/consultation/result`, `/shop`, `/order` (chỉ
redirect), `/pricing`, `/dieline-lab`, `/about`.

`navLinks` (`src/components/layout/navbar.tsx`) đúng 4 mục: `Trang chủ` `/` ·
`Tư vấn` `/consultation` · `Về chúng tôi` `/about` · `Bảng giá` `/pricing`.
⚠️ Không có link nào vào `/dieline-lab` hay `/consultation/result`.
⚠️ Nút `Dashboard` là `<Link href="/dashboard">` style button, không phải dropdown.
⚠️ Mobile menu (hamburger `aria-label="Open menu"` / `"Close menu"` — tiếng Anh) render lại
**cả** `navLinks` **lẫn** khối auth → khi `hideAuth` thì menu mobile cũng mất auth links.
⚠️ Footer `Liên hệ` trỏ `/about` (không có trang/form liên hệ riêng).

### L2. Customer Dashboard Layout ✅

```
┌───────────────────────────────────────────────────────────────┐
│ NAVBAR (hideAuth — không hiện Đăng nhập/Đăng ký/Dashboard)    │
├──────────────┬────────────────────────────────────────────────┤
│ DashboardNav │  <main className="flex-1 p-6 overflow-auto">   │
│ (aside        │      children                                 │
│  hidden       │                                               │
│  md:flex       │                                              │
│  w-64)         │                                              │
│  Tổng quan     │                                              │
│  Đơn hàng      │                                              │
│  Lịch sử       │                                              │
│  Hồ sơ         │                                              │
│  [Đăng xuất]   │                                              │
└──────────────┴────────────────────────────────────────────────┘
   (KHÔNG có FOOTER)
```

| Chi tiết | Code |
|---|---|
| Nav items | `src/components/layout/DashboardNav.tsx`: `Tổng quan` `/dashboard` (`House`) · `Đơn hàng` `/dashboard/orders` (`ClipboardText`) · `Lịch sử` `/dashboard/history` (`ClockCounterClockwise`) · `Hồ sơ` `/dashboard/profile` (`User`). Active = `pathname === link.href` |
| Đăng xuất | `await supabase.auth.signOut()` → `router.push('/')` + refresh |
| Mobile | `hidden md:flex` → **hoàn toàn không có nav nào dưới `md`**. Không có drawer thay thế ⚠️ |
| ⚠️ **Security** | `src/middleware.ts` gate **chỉ theo pathname**: `!user && pathname.startsWith('/dashboard' \| '/staff')` → redirect `/login`. **Không đọc `profiles.role`** ở bất kỳ đâu trong middleware. Customer đã đăng nhập mở `/staff/orders` vẫn được render (nay chỉ là stub nên chưa lộ dữ liệu). Hàng rào thật nằm ở app layer (`isStaff()` trong API route) + RLS. Xem `docs/ARCHITECTURE.md` §2.1: JWT không chứa `role` nên policy RLS dạng `auth.jwt() ->> 'role'` đang vô hiệu |

### L3. Staff Layout 🚧 (layout có thật, trang thì stub)

`src/app/(staff)/layout.tsx` — cấu trúc y hệt L2, thay `DashboardNav` bằng `StaffSidebar`.
`StaffSidebar`: header link `Staff Panel` → `/staff`, 5 items `Tổng quan` (`ChartBar`) ·
`Tư vấn` (`ClipboardText`) · `Đơn hàng` (`Package`) · `Khách hàng` (`Users`) · `Sản phẩm`
(`Cube`), cuối là `Đăng xuất` (cùng logic signOut). ⚠️ Doc cũ ghi sidebar có `Cài đặt` là sai.
⚠️ Cũng `hidden md:flex` — không có phiên bản mobile.

### L4. Guest Layout ✅

```tsx
// src/app/(guest)/layout.tsx
export default function GuestLayout({ children }) { return <>{children}</> }
```

⚠️ **Doc cũ mô tả `/login` + `/register` có NAVBAR + FOOTER — sai.** Route group `(guest)`
là passthrough rỗng, nên 2 trang này trôi nổi trên nền trắng, không nav không footer.
Middleware: đã đăng nhập mà vào `/login` hoặc `/register` → redirect `/dashboard`.

---

## UNIVERSAL COMPONENTS

### Navbar — `src/components/layout/navbar.tsx` ✅
`'use client'`. Sticky `h-16`, backdrop blur, brand `AI Carton` → `/`. 4 link desktop +
khối auth (`Dashboard` nếu có session, ngược lại `Đăng nhập` + `Đăng ký`). Prop `hideAuth`
(L2/L3) ẩn khối auth desktop. Mobile: hamburger tự render lại cả nav lẫn auth.
⚠️ `aria-label` hamburger là tiếng Anh (`Open menu` / `Close menu`).

### Footer — `src/components/layout/footer.tsx` ✅
3 nhóm `Dịch vụ` / `Công ty` / `Hỗ trợ` + copyright `© {new Date().getFullYear()} AI Carton
Packaging. All rights reserved.`
⚠️ **2 link chết**: `Câu hỏi thường gặp` → `/#faq` (landing không có phần tử id `faq` nào),
`Điều khoản sử dụng` → `href="#"`.

### DashboardNav / StaffSidebar ✅ / 🚧
Như đã mô tả ở L2/L3. Cùng pattern: `aside hidden md:flex w-64 flex-col border-r
border-gray-200 bg-white`, active so `pathname === href`, `Đăng xuất` signOut + push `/`.
StaffSidebar là component thật (dù chưa screen staff nào dùng nó để làm gì).

### StatusBadge — `src/components/ui/status-badge.tsx` ✅
`getOrderStatusLabel(status)` + màu: `cancelled` đỏ · `completed`/`delivered` emerald ·
`production`/`deposit_paid` xanh dương · còn lại amber. Pill `rounded-full text-xs`.
Dùng ở §12, §13, §14, M7. (PaymentBadge là component riêng trong `order-ui.tsx`.)

### Order Status Timeline — `src/components/ui/status-timeline.tsx` ✅
Xem chi tiết ở §13. 7 cột, `min-w-[760px]`, `dd/MM/yyyy`, `Đang chờ`, dòng hủy màu đỏ.

### EmptyState — `src/components/ui/empty-state.tsx` ✅
Icon mặc định `Package` xám, `title` (h2), `description`, action button qua
`buttonVariants({size:'lg'})` khi truyền đủ `actionHref` + `actionLabel`. Viền
`border-dashed`. Dùng ở landing-table rỗng, `/pricing`, dashboard, orders, history, reorder.

### ErrorState — `src/components/ui/error-state.tsx` ✅
Mặc định `title="Không thể tải dữ liệu"`, `description="Vui lòng tải lại trang hoặc thử lại
sau."`, icon `WarningCircle`, khối `border-red-200 bg-red-50 p-4`.

### Loading Skeleton ✅
`ProfileSkeleton` (`dashboard/profile/page.tsx`), `orders/loading.tsx`, skeleton
`animate-pulse` trong `LoadingState` của `LiveResultPanel`. ⚠️ Không có `loading.tsx` cho
`/consultation`, `/shop`, `/pricing`, `/about`, `/dashboard/custom`, `/dashboard/cart`.

### Modal — `src/components/ui/modal.tsx` ✅
`@base-ui/react/dialog`. Props `title`, `description`, `size` (`default`→`max-w-lg`,
`lg`→`max-w-2xl`, `xl`→`max-w-5xl`), `footer`, `contentClassName`. Nút đóng
`aria-label="Đóng modal"`. ⚠️ M6 **không** dùng component này (tự dựng drawer bằng
`Dialog.Popup` raw). M1–M5 đều để `size` mặc định; chỉ M7 dùng `lg` / `xl`.

### PrintPreviewStrip — `src/components/order/print-preview-strip.tsx` ✅
Hàng thumbnail nhỏ (mockup + khuôn bế) cho `order_items`. Prop `size` (`sm` mặc định,
`md` ở §13). ⚠️ Dùng raw `<img>` chứ không `next/image` vì `next.config.mjs` chỉ whitelist
`picsum.photos` (có comment xác nhận trong file).

### FadeIn — `src/components/ui/FadeIn.tsx` ✅
`motion/react` wrapper, dùng dày đặc ở `/about`.

---

## Appendix A — Route → code

Sinh từ `find src/app -name 'page.tsx'` — **22 route**.

| # | Route | File | Layout | Trạng thái |
|---|---|---|---|---|
| 1 | `/` | `src/app/(public)/page.tsx` | L1 | ✅ |
| 2 | `/about` | `src/app/(public)/about/page.tsx` | L1 | ✅ tĩnh |
| 3 | `/consultation` | `src/app/(public)/consultation/page.tsx` | L1 | ✅ |
| 4 | `/consultation/result` | `src/app/(public)/consultation/result/page.tsx` | L1 | ✅ ⚠️ **orphan** — không link nội bộ |
| 5 | `/dieline-lab` | `src/app/(public)/dieline-lab/page.tsx` | L1 | ✅ ⚠️ **orphan** — không link nội bộ |
| 6 | `/order` | `src/app/(public)/order/page.tsx` | L1 | ✅ chỉ còn `redirect('/dashboard/custom')` |
| 6b | `/shop` | `src/app/(public)/shop/page.tsx` | L1 | ✅ hàng có sẵn + add cart / mua ngay |
| 6c | `/consultation/stock` | `src/app/(public)/consultation/stock/page.tsx` | L1 | ✅ AI tìm hàng kho khớp |
| 7 | `/pricing` | `src/app/(public)/pricing/page.tsx` | L1 | ✅ |
| 8 | `/login` | `src/app/(guest)/login/page.tsx` | L4 | ✅ |
| 9 | `/register` | `src/app/(guest)/register/page.tsx` | L4 | ✅ |
| 10 | `/dashboard` | `src/app/(auth)/dashboard/page.tsx` | L2 | ✅ |
| 11 | `/dashboard/orders` | `src/app/(auth)/dashboard/orders/page.tsx` | L2 | ✅ + M7 |
| 12 | `/dashboard/orders/[id]` | `src/app/(auth)/dashboard/orders/[id]/page.tsx` | L2 | ✅ UUID-guard → `notFound()` |
| 13 | `/dashboard/history` | `src/app/(auth)/dashboard/history/page.tsx` | L2 | ✅ |
| 14 | `/dashboard/reorder` | `src/app/(auth)/dashboard/reorder/page.tsx` | L2 | ✅ |
| 15 | `/dashboard/profile` | `src/app/(auth)/dashboard/profile/page.tsx` | L2 | ✅ 2 nút chết |
| 16 | `/staff` | `src/app/(staff)/staff/page.tsx` | L3 | 🚧 stub |
| 17 | `/staff/consultations` | `src/app/(staff)/staff/consultations/page.tsx` | L3 | 🚧 stub |
| 18 | `/staff/consultations/[id]` | `src/app/(staff)/staff/consultations/[id]/page.tsx` | L3 | 🚧 stub |
| 19 | `/staff/orders` | `src/app/(staff)/staff/orders/page.tsx` | L3 | 🚧 stub |
| 20 | `/staff/orders/[id]` | `src/app/(staff)/staff/orders/[id]/page.tsx` | L3 | 🚧 stub |
| 21 | `/staff/customers` | `src/app/(staff)/staff/customers/page.tsx` | L3 | 🚧 stub |
| 22 | `/staff/products` | `src/app/(staff)/staff/products/page.tsx` | L3 | 🚧 stub |

**Route đã xóa khỏi tài liệu này vì không tồn tại trên đĩa**: `/consultation?step=result`,
`/consultation?step=mockup`, `/payment`, `/forgot-password`, `/products`, `/contact`,
`/checkout`.

### API route handlers

| Route | Method | Trạng thái |
|---|---|---|
| `/api/ai/recommend` | POST | ✅ tạo consultation + gọi AI |
| `/api/ai/mockup` | POST | ✅ quota 3 lần/tư vấn |
| `/api/auth/callback` | GET | ✅ OAuth Google → `/login?error=auth_failed` khi lỗi |
| `/api/consultations` | GET/POST | 🚧 **501** `Under development` |
| `/api/orders` | GET/POST | ✅ |
| `/api/orders/[id]/payment` | GET/PATCH | ✅ server-side, UI chưa gọi |
| `/api/orders/[id]/status` | GET/PATCH | ✅ server-side, UI chưa gọi |
| `/api/products` | GET/POST | 🚧 **501** `Under development` |
| `/api/cart` | GET/POST | ✅ giỏ hàng; POST nhận 3 nhánh custom (consultationId \| savedProductId \| custom) hoặc stock |
| `/api/cart/[id]` | PATCH/DELETE | ✅ `PATCH {quantity}` và/hoặc `{custom}` |
| `/api/cart/count` | GET | ✅ badge navbar |
| `/api/checkout` | POST | ✅ tạo đơn từ dòng giỏ; địa chỉ đọc từ DB, không nhận text từ client |
| `/api/addresses` | GET/POST | ✅ list / ensure-default từ hồ sơ |
| `/api/addresses/[id]` | PATCH/DELETE | ✅ sửa, set-default, xoá |
| `/api/saved-products` | GET/POST | ✅ list / lưu kết quả tư vấn |
| `/api/saved-products/[id]` | DELETE | ✅ UI: `Xoá` ở `/dashboard/custom` |
| `/api/reorder` | POST | ✅ |
| `/api/upload` | POST | ✅ purposes: `logo`, `reference`, `payment-proof`, `order-file` |

### Directory thật của code UI

| Đường dẫn | Nội dung |
|---|---|
| `src/features/dieline/` | `DielinePreview.tsx` |
| `src/features/products/` | `components/CatalogTable.tsx`, `components/PriceTierCards.tsx`, `types.ts`, `utils.ts` |
| `src/app/(public)/consultation/` | Toàn bộ UI tư vấn + print mockup (`consultation-*.tsx`, `print-mockup-*.tsx`, `consultation-schema.ts`, `step-indicator.tsx`) |
| `src/app/(public)/order/` | Chỉ còn `page.tsx` (redirect) — form đơn đã nghỉ, xem §7 |
| `src/app/(public)/shop/` | `page.tsx`, `product-card.tsx` |
| `src/app/(auth)/dashboard/cart/` | `cart-view.tsx`, `cart-line-row.tsx`, `custom-line-editor.tsx` |
| `src/app/(auth)/dashboard/checkout/` | `checkout-form.tsx`, `checkout-parts.tsx` |
| `src/app/(auth)/dashboard/custom/` | `page.tsx`, `saved-profile-cards.tsx`, `custom-spec-form.tsx` |
| `src/components/cart/` | `cart-events.ts`, `use-add-to-cart.ts`, `custom-cart-actions.tsx` |
| `src/components/checkout/` | `address-picker.tsx`, `address-form-modal.tsx` |
| `src/components/modals/` | 7 file M1–M6 (tên PascalCase) |
| `src/components/layout/` | `navbar.tsx`, `footer.tsx`, `DashboardNav.tsx`, `StaffSidebar.tsx` |
| `src/components/ui/` | 15 primitive (`modal`, `status-badge`, `status-timeline`, `empty-state`, `error-state`, `card`, `button`, `input`, `label`, `select`, `textarea`, `badge`, `separator`, `FadeIn`) |
| `src/components/order/` | `print-preview-strip.tsx` |

> ⚠️ Các đường dẫn `src/hooks/`, `src/features/orders/`, `src/features/auth/`,
> `src/features/staff/`, `src/features/consultation/` trong doc cũ **không tồn tại**
> (`src/features/consultation/` chỉ có 1 thư mục `components/` rỗng). Code consultation nằm
> ở `src/app/(public)/consultation/`.

---

## Appendix B — Status → tiếng Việt

Nguồn thật cho UI: `ORDER_STATUS_DISPLAY` trong `src/lib/data/order-shared.ts`
(`getOrderStatusLabel`).

| `orders.status` | Label UI | Màu badge | Trong `STAFF_TRANSITIONS`? |
|---|---|---|---|
| `pending` | `Chờ xử lý` | amber | ✅ |
| `staff_review` | `Đang duyệt` | amber | ✅ |
| `confirmed` | `Đã xác nhận` | amber | ✅ |
| `deposit_paid` | `Đã đặt cọc` | blue | ✅ |
| `production` | `Đang sản xuất` | blue | ✅ |
| `completed` | `Hoàn thành` | emerald | ✅ |
| `delivered` | `Đã giao` | emerald | — (trạng thái cuối) |
| `cancelled` | `Đã hủy` | red | (không có trong timeline) |

> ⚠️ **Hai nguồn label xung nhau.** `src/lib/config/constants.ts` có `ORDER_STATUS_LABELS`
> riêng, dùng trong 2 API route để validate/echo status, và dịch khác:
> `staff_review` = `Đang xem xét` (UI hiển thị `Đang duyệt`), `delivered` = `Đã giao hàng`
> (UI hiển thị `Đã giao`). Hợp nhất 1 chỗ là việc nên làm trước khi build UI staff.

| Payment | `getPaymentStatusLabel` | Method | `getPaymentMethodLabel` |
|---|---|---|---|
| `paid` | `Đã thanh toán` | `bank_transfer` | `Chuyển khoản` |
| `deposit_paid` | `Đã đặt cọc` | `cod` (mặc định) | `Thanh toán khi nhận hàng` |
| `unpaid` | `Chưa thanh toán` | | |
| `null`/khác | `Không xác định` | | |

`pending`→`delivered` = 100% theo `getOrderProgress`. Khách chỉ được hủy khi `pending`
(`CUSTOMER_TRANSITIONS`: mọi status khác đều `[]`).

---

## Appendix C — Link chết & khoảng trống

Toàn bộ là kết quả đọc code trực tiếp, không phải suy đoán.

| # | Vấn đề | Vị trí | Hệ quả với user |
|---|---|---|---|
| 1 | `/#faq` không có anchor | `footer.tsx` | Click "Câu hỏi thường gặp" → về đầu trang chủ |
| 2 | `/forgot-password` không tồn tại | `login/page.tsx` | Click "Quên mật khẩu?" → 404 |
| 3 | `href="#"` điều khoản | `register/page.tsx` + `footer.tsx` | Không có trang điều khoản |
| 4 | 2 route orphan | `/consultation/result`, `/dieline-lab` | Không thể khám phá bằng click, chỉ URL |
| 5 | `Xem sản phẩm →` trỏ `/about` | landing hero | Nhãn nói "sản phẩm", đích là trang giới thiệu |
| 6 | Ảnh nhà máy là khung xám | landing `Nhà máy của chúng tôi` | `aspect-[4/3] bg-gray-200` + icon, không phải ảnh |
| 7 | `✓ Đã xác thực` hardcode | `dashboard/profile` | Hiện cả email chưa verify |
| 8 | `Đổi mật khẩu` / `Xóa tài khoản` không handler | `dashboard/profile` | Bấm không có tác dụng |
| 9 | `Sản phẩm đã lưu` luôn bằng 0 | `dashboard` | Không code nào INSERT `saved_products` |
| 10 | 4 modal mồ côi | `PriceChange`, `UploadProof`, `CustomerQuickView`, `ProductEditDrawer` | Code đã viết, không đường vào |
| 11 | `StepIndicator` không hiện trên `/consultation` | `step-indicator.tsx` | Chỉ render ở `/consultation/result` |
| 12 | Login không bao giờ về `/staff` | `login/page.tsx` | Staff phải gõ URL tay |
| 13 | Login bỏ qua `?error=auth_failed` | `login/page.tsx` | OAuth fail → về trang login không thông báo |
| 14 | VAT chỉ để hiển thị | `pricing.ts`, `/api/orders` | Đơn tạo ra chưa cộng VAT, `delivery_fee` = 0 hardcode |
| 15 | Middleware không check role | `src/middleware.ts` | Customer vào được `/staff/*` (hiện chỉ gặp stub) |
| 16 | Hai bảng label status khác nhau | `constants.ts` vs `order-shared.ts` | `Đang xem xét` / `Đang duyệt` lẫn lộn giữa API và UI |
| 17 | `leadTimeDays` không screen nào render | `src/lib/ai/types.ts` | AI tính thời gian sản xuất, khách không thấy |
| 18 | `features.ts` + `APP_URLS` + `SITE_NAME` không component nào import | `src/lib/config/` | `savedProducts: true` nhưng feature không tồn tại |
| 19 | `recharts` chưa cài mà doc cũ mô tả chart staff | `package.json` | Sẽ phải thêm dep khi làm §17 |
| 20 | Không có `error.tsx` / `not-found.tsx` global | `src/app/` | Lỗi RSC → trang lỗi mặc định Next.js; `notFound()` ở §13 trắng trơn |
| 21 | `aria-label` tiếng Anh lẫn tiếng Việt | `navbar.tsx` (hamburger), `login/page.tsx` (eye toggle) | Screen reader đọc lẫn 2 ngôn ngữ |
| 22 | Hero ảnh Cloudinary dùng raw `<img>` | `next.config.mjs` chỉ whitelist `picsum.photos` | Không có optimize của `next/image` cho ảnh thật |
