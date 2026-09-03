# Screen Descriptions — AI Carton Packaging Solution

> **Design Read**: B2B manufacturing platform for Vietnamese online sellers and SME owners, with a clean industrial language, leaning toward restrained Tailwind + shadcn + real factory photography.
>
> **Three Dials**: `VARIANCE: 5` (trust-first, offset layouts), `MOTION: 3` (minimal — static + scroll-reveal only), `DENSITY: 4` (balanced spacing, slightly airy for non-tech audience).
>
> **Tasteskill Source**: `.claude/skills/design-taste-frontend/SKILL.md`
> **UI Implementation**: `docs/UI_RULES.md`

---

## Table of Contents

- [How to Read This Document](#how-to-read-this-document)
- [PUBLIC ROUTES](#public-routes)
  - [1. Landing Page (`/`)](#1-landing-page-)
  - [2. Consultation — Spec Input (`/consultation`)](#2-consultation--spec-input-consultation)
  - [3. Consultation — AI Recommendation (`/consultation?step=result`)](#3-consultation--ai-recommendation-consultationstepresult)
  - [4. Consultation — Mockup Preview (`/consultation?step=mockup`)](#4-consultation--mockup-preview-consultationstepmockup)
  - [5. Order — Standalone (`/order`)](#5-order--standalone-order)
  - [6. About (`/about`)](#6-about-about)
  - [7. Login (`/login`)](#7-login-login)
  - [8. Register (`/register`)](#8-register-register)
- [AUTHENTICATED — CUSTOMER](#authenticated--customer)
  - [9. Customer Dashboard (`/dashboard`)](#9-customer-dashboard-dashboard)
  - [10. My Orders (`/dashboard/orders`)](#10-my-orders-dashboardorders)
  - [11. Order Detail (`/dashboard/orders/[id]`)](#11-order-detail-dashboardordersid)
  - [12. Order History (`/dashboard/history`)](#12-order-history-dashboardhistory)
  - [13. Reorder (`/dashboard/reorder`)](#13-reorder-dashboardreorder)
  - [14. Profile (`/dashboard/profile`)](#14-profile-dashboardprofile)
- [AUTHENTICATED — STAFF](#authenticated--staff)
  - [15. Staff Dashboard (`/staff`)](#15-staff-dashboard-staff)
  - [16. Staff Consultations (`/staff/consultations`)](#16-staff-consultations-staffconsultations)
  - [17. Staff Consultation Review (`/staff/consultations/[id]`)](#17-staff-consultation-review-staffconsultationsid)
  - [18. Staff Orders (`/staff/orders`)](#18-staff-orders-stafforders)
  - [19. Staff Order Detail (`/staff/orders/[id]`)](#19-staff-order-detail-staffordersid)
  - [20. Staff Customers (`/staff/customers`)](#20-staff-customers-staffcustomers)
  - [21. Staff Products (`/staff/products`)](#21-staff-products-staffproducts)
- [MODALS & OVERLAYS](#modals--overlays)
  - [M1. Payment Confirmation Modal](#m1-payment-confirmation-modal)
  - [M2. Cancel Order Confirmation Modal](#m2-cancel-order-confirmation-modal)
  - [M3. Price Change Notification Modal](#m3-price-change-notification-modal)
  - [M4. Upload Payment Proof Modal](#m4-upload-payment-proof-modal)
  - [M5. Customer Quick View Modal (Staff)](#m5-customer-quick-view-modal-staff)
  - [M6. Product Quick Edit Drawer (Staff)](#m6-product-quick-edit-drawer-staff)
- [SHARED LAYOUTS](#shared-layouts)
  - [L1. Public Layout (Default)](#l1-public-layout-default)
  - [L2. Customer Dashboard Layout](#l2-customer-dashboard-layout)
  - [L3. Staff Layout (Sidebar)](#l3-staff-layout-sidebar)
- [UNIVERSAL COMPONENTS](#universal-components)
  - [Header / Navbar](#header--navbar)
  - [Footer](#footer)
  - [Sidebar (Staff)](#sidebar-staff)
  - [Status Badge](#status-badge)
  - [Order Status Timeline](#order-status-timeline)
  - [Empty State](#empty-state)
  - [Error State](#error-state)
  - [Loading Skeleton](#loading-skeleton)

---

## How to Read This Document

Each screen is described with:

| Section | What it covers |
|---|---|
| **Purpose** | What the screen is for, who uses it |
| **Route** | URL path |
| **Layout** | Which shared layout it uses (L1/L2/L3) |
| **Structure** | Top-to-bottom breakdown of sections |
| **Key Components** | Major UI elements, referencing `UI_RULES.md` templates |
| **States** | Loading, empty, error, edge cases |
| **Modals** | Which overlays can appear on this screen |
| **Design Notes** | Tasteskill rationale, layout decisions, motion choices |

---

## PUBLIC ROUTES

---

### 1. Landing Page (`/`)

**Purpose**: First impression. Drive visitors to start a consultation. Build trust with factory authenticity.

**Route**: `/`
**Layout**: L1 (Public Layout)

**Design Read**: Landing page for B2B manufacturing buyers (Vietnamese online sellers, SME owners), with a clean industrial language, leaning toward restrained Tailwind + shadcn + real factory photography.

**Three Dials**: VARIANCE=5, MOTION=3, DENSITY=4

---

#### Structure (top to bottom)

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (sticky, blurred backdrop)                            │
│  [Logo] [Get Started] [Products] [About] [FAQ]  [Sign In]    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  HERO SECTION (min-h-[100dvh], centered)                      │
│                                                               │
│  Eyebrow: "GIẢI PHÁP ĐÓNG GÓI THÔNG MINH"                    │
│  H1: "Bao bì carton theo yêu cầu —                            │
│       Báo giá AI trong 30 giây"                               │
│  Subtext: "Nhập thông số sản phẩm, AI đề xuất hộp carton      │
│  tối ưu — kích thước, chất liệu, giá cả. Đặt hàng ngay."     │
│                                                               │
│  [🔍 Bắt đầu tư vấn miễn phí]    [Xem sản phẩm →]            │
│                                                               │
│  (Background: large factory photo with overlay)               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  TRUST BANNER (logo wall, muted)                               │
│  "Được tin dùng bởi"                                           │
│  [Logo 1] [Logo 2] [Logo 3] [Logo 4] [Logo 5]                 │
│  (Real SVG logos via Simple Icons or custom monograms)         │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps, centered)                              │
│                                                               │
│  H2: "Cách hoạt động"                                          │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │  STEP 1    │  │  STEP 2    │  │  STEP 3    │              │
│  │  📝 Nhập   │  │  🤖 AI đề  │  │  📦 Đặt    │              │
│  │  thông số  │  │  xuất      │  │  hàng      │              │
│  │  sản phẩm  │  │  hộp tối ưu│  │  & nhận    │              │
│  │            │  │            │  │  hàng      │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│  "Nhập kích thước,  "AI phân tích và  "Xác nhận, thanh       │
│  trọng lượng, số   đề xuất loại hộp,  toán, nhận hàng        │
│  lượng"            chất liệu, giá"    đúng hạn"              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  PRODUCT CATALOG PREVIEW (grid, 3 cards desktop)               │
│                                                               │
│  H2: "Sản phẩm của chúng tôi"                                  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  (image)     │  │  (image)     │  │  (image)     │        │
│  │  Carton 3 lớp│  │  Carton 5 lớp│  │  Carton       │        │
│  │  B-flute     │  │  BC-flute    │  │  sóng E      │        │
│  │  Từ 3,000đ   │  │  Từ 5,500đ   │  │  Từ 4,000đ   │        │
│  │  [Xem chi    │  │  [Xem chi    │  │  [Xem chi    │        │
│  │   tiết]      │  │   tiết]      │  │   tiết]      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│  [Xem tất cả sản phẩm →]                                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FACTORY TOUR (split layout, image + text)                     │
│                                                               │
│  H2: "Nhà máy của chúng tôi"                                   │
│  Subtext: "Hơn 10 năm kinh nghiệm sản xuất bao bì carton      │
│  tại Việt Nam. Công nghệ Đức, tiêu chuẩn Nhật."               │
│                                                               │
│  ┌───────────────────────┐  ┌─────────────────────────┐      │
│  │  (Factory photo       │  │  Stats:                 │      │
│  │   gallery — 2-3       │  │  • 5000+ khách hàng     │      │
│  │   images staggered)   │  │  • 10+ năm kinh nghiệm  │      │
│  │                       │  │  • 3000m² nhà máy       │      │
│  │                       │  │  • Giao hàng toàn quốc  │      │
│  │                       │  │  [Xem thêm →]           │      │
│  └───────────────────────┘  └─────────────────────────┘      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FAQ / CONTACT (accordion + contact card)                      │
│                                                               │
│  H2: "Câu hỏi thường gặp"                                     │
│                                                               │
│  ┌─ Q: "Tôi cần những thông số gì?" ─────────────────────┐   │
│  │  A: "Bạn chỉ cần..." (expandable)                      │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─ Q: "Thời gian sản xuất bao lâu?" ────────────────────┐   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─ Q: "Tôi có thể đặt hàng số lượng ít không?" ────────┐   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─ Q: "Các phương thức thanh toán?" ───────────────────┐   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Contact Card: Hotline, Email, Zalo, Facebook        │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  CTA SECTION (final push)                                     │
│                                                               │
│  H2: "Sẵn sàng đặt bao bì cho sản phẩm của bạn?"              │
│  Subtext: "Nhập thông số, AI đề xuất ngay — miễn phí."        │
│  [🔍 Bắt đầu tư vấn ngay]                                     │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                       │
│  [Logo]  [Navigation links]  [Social]  [Copyright]            │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | UI_RULES.md Reference | Notes |
|---|---|---|
| Navbar | Section 3.5 — sticky, `h-16`, `bg-white/80 backdrop-blur-md` | Single line, max 80px |
| Hero | Section 4 — `min-h-[100dvh]`, `pt-24`, `max-w-3xl` | 4 text elements max |
| Logo wall | Tasteskill Section 4.8 — real SVG logos, no category labels | Simple Icons CDN |
| How It Works | 3-column grid, `grid-cols-1 md:grid-cols-3` | Each step: icon + title + description |
| Product cards | Section 3.3 — Product card template | `aspect-[4/3]` image area |
| FAQ accordion | shadcn/ui Accordion component | Expand/collapse per item |
| Buttons | Section 3.1 — Primary: `bg-blue-600`, `rounded-md` | CTA text fits 1 line |

#### States

| State | What renders | Notes |
|---|---|---|
| **Loading** | Skeleton: hero skeleton (full-width `h-[100dvh]`), grid of 3 card skeletons | Skeleton matches final layout |
| **Loaded** | Full page as described above | |
| **Error** | Error banner if hero images fail to load | Fallback: solid `bg-gray-100` with icon |
| **Empty catalog** | None (products are static, pre-seeded) | |
| **Mobile** | Single column, hamburger menu, stacked cards, hero full-width text | `< 768px` collapse for all grids |

#### Modals
- None on this page. The landing page is purely informational with navigation CTAs.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Centered hero (VARIANCE=5 allows centered). Split layout for factory tour section. |
| **Motion** | MOTION=3: no scroll-reveal, no parallax. Only `transition-colors` on nav, `hover:shadow` on cards. |
| **Color** | Blue-600 primary (trustworthy industrial). One palette — no warm/cool gray mixing. |
| **Typography** | Geist (sans). H1: `text-4xl md:text-5xl lg:text-6xl`. No serif. |
| **Images** | Real factory photography (generated or stock). No div-based fake screenshots. |
| **Eyebrow** | Hero has 1 eyebrow. FAQ section has no eyebrow. Total: 1 eyebrow on page (≤ ceil(5/3)=2). |
| **Section diversity** | Hero → logo wall → how-it-works (3 col) → catalog (grid) → factory (split) → FAQ (accordion) → CTA. 6 different layout families. |
| **Zigzag cap** | Only 1 split layout (factory tour). No zigzag pattern. |

---

### 2. Consultation — Spec Input (`/consultation`)

**Purpose**: Customer fills in product specs for AI to analyze. 1-page form, not multi-step wizard.

**Route**: `/consultation`
**Layout**: L1 (Public Layout, minimal header)

**Design Read**: Form page for B2B buyers, form-first, trust signals, minimal friction.

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (minimal, no CTA)                                    │
│  [Logo]  [Step indicator: ❶ Nhập thông số → ❷ Kết quả       │
│           → ❸ Đặt hàng]                                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (centered, max-w-2xl)                           │
│                                                               │
│  H1: "Nhập thông số sản phẩm"                                  │
│  Subtext: "AI sẽ phân tích và đề xuất hộp carton phù hợp      │
│  nhất cho sản phẩm của bạn."                                   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  FORM SECTION — 3 logical groups with visual dividers   │  │
│  │                                                         │  │
│  │  ┌─ GROUP 1: THÔNG TIN SẢN PHẨM ─────────────────    │  │
│  │  │                                                      │  │
│  │  │  Product type: [___________________________]        │  │
│  │  │  (Placeholder: "VD: Cà phê, mỹ phẩm, thực phẩm...")│  │
│  │  │                                                      │  │
│  │  │  Kích thước (cm):                                    │  │
│  │  │  Dài [___]  ×  Rộng [___]  ×  Cao [___]            │  │
│  │  │                                                      │  │
│  │  │  Trọng lượng sản phẩm: [_______]  grams              │  │
│  │  │                                                      │  │
│  │  │  Số lượng mỗi hộp: [_______]  (optional)            │  │
│  │  │  (Helper: "Bao nhiêu sản phẩm trong 1 hộp?")        │  │
│  │  │                                                      │  │
│  │  │  Số lượng hộp cần: [_______]                         │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─ GROUP 2: IN ẤN (togglable) ─────────────────────  │  │
│  │  │                                                      │  │
│  │  │  Bạn có cần in ấn trên bao bì?                       │  │
│  │  │  [◎ Có]  [○ Không]                                   │  │
│  │  │                                                      │  │
│  │  │  (If "Có" selected, show:)                           │  │
│  │  │  Tải file thiết kế / logo: [Chọn file] (.pdf, .ai)  │  │
│  │  │  Ghi chú in ấn: [___________________________]       │  │
│  │  │  (Placeholder: "VD: In 1 màu, vị trí giữa hộp...")  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─ GROUP 3: THÔNG TIN LIÊN HỆ ────────────────────   │  │
│  │  │                                                      │  │
│  │  │  Họ và tên: [___________________________]            │  │
│  │  │  Số điện thoại: [___________________________]        │  │
│  │  │  Email: [___________________________]                │  │
│  │  │  Tên công ty: [___________________________] (opt)    │  │
│  │  │  Địa chỉ giao hàng: [___________________________]    │  │
│  │  │  Ghi chú thêm: [___________________________] (opt)   │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [🤖 Yêu cầu AI tư vấn]  (full-width, primary)         │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Trust strip below form:                                       │
│  "🔒 Thông tin của bạn được bảo mật · Miễn phí tư vấn        │
│   · Không cam kết mua hàng"                                   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Step indicator | Section 3.9 Multi-step form | 3 steps, current=1, blue circle |
| Input fields | Section 3.2 — all input variants | Text, number, file, select, textarea |
| Toggle for printing | Radio group (Yes/No) or shadcn Switch | Controls visibility of print fields |
| Dimension row | 3 inline number inputs with unit suffix | `grid grid-cols-3 gap-2` |
| File upload | shadcn FileInput or custom drag-drop zone | PDF, AI, PNG, max 10MB |
| Submit button | Section 3.1 — Primary button | Full-width, `w-full` |
| Form validation | React Hook Form + Zod | Inline errors below each field |

#### States

| State | What renders | Notes |
|---|---|---|
| **Loading** | Form skeleton: 6-8 skeleton lines matching field layout | |
| **Empty (initial)** | Empty form, no validation errors | |
| **Validation error** | Inline red text below each invalid field, red border on input | `text-red-600`, `border-red-500` |
| **Submitting** | Button shows spinner + "Đang xử lý...", all fields disabled | `disabled:opacity-50` |
| **API error** | Error banner at top of form: "Không thể kết nối. Vui lòng thử lại." | Red alert, retry button |
| **Success** | Redirect to `/consultation?step=result` with consultation ID | |

#### Modals
- **M1 (Payment Confirmation)**: Not on this screen.
- **Confirm before submit**: Optional — only if user navigates away with unsaved data.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Single column, `max-w-2xl` centered. Form is 1 page, not wizard. |
| **Grouping** | 3 logical groups with subtle `border-b` or `space-y-8` dividers. No card containers per group (Tasteskill: use dividers, not cards). |
| **Typography** | Group headers: `text-sm font-semibold text-gray-900 uppercase tracking-wide`. Labels: `text-sm font-medium text-gray-700`. |
| **Motion** | Minimal. Focus ring transitions only. No scroll-reveal on form. |
| **Printing toggle** | Toggle reveals additional fields with smooth `max-h` transition. |
| **Trust strip** | Small text below button, `text-xs text-gray-500 text-center`. Not in hero. |
| **Mobile** | Dimension row becomes `grid grid-cols-1` on mobile (stacked). |

---

### 3. Consultation — AI Recommendation (`/consultation?step=result`)

**Purpose**: Display AI's box recommendation. Customer reviews and decides next step.

**Route**: `/consultation?step=result&id=<consultation_id>`
**Layout**: L1 (Public Layout, minimal header)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (minimal)                                            │
│  [Logo]  [Step: ❶ ✓ → ❷ Kết quả → ❸ Đặt hàng]              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (max-w-4xl)                                    │
│                                                               │
│  ┌── SUCCESS HEADER ──────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ✅ AI Đã phân tích sản phẩm của bạn!                    │  │
│  │  Subtext: "Dựa trên thông số bạn cung cấp, chúng tôi    │  │
│  │  đề xuất:"                                                │  │
│  │                                                         │  │
│  │  Trạng thái tư vấn: 🤖 AI đã xử lý                       │  │
│  │  (Status: ai_processed — chờ staff xem xét)              │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── RECOMMENDATION CARD (elevated, shadow-md) ────────────┐  │
│  │                                                         │  │
│  │  ┌───────────────┐  ┌────────────────────────────────┐ │  │
│  │  │  (Box         │  │  📦 Carton 3 lớp B-flute       │ │  │
│  │  │   illustration│  │  Kích thước: 30 × 20 × 15 cm  │ │  │
│  │  │   or 3D       │  │  Chất liệu: B-flute           │ │  │
│  │  │   mockup)     │  │  Số lượng: 100 hộp            │ │  │
│  │  │               │  │  🎨 In ấn: In 1 màu (có logo) │ │  │
│  │  └───────────────┘  │  ──────────────────────────    │ │  │
│  │                     │  💰 Giá ước tính: 5,000đ/hộp   │ │  │
│  │                     │  Tổng: 500,000đ                │ │  │
│  │                     │  ──────────────────────────    │ │  │
│  │                     │  💡 Tips: "Với trọng lượng     │ │  │
│  │                     │  500g, B-flute 3 lớp là lựa    │ │  │
│  │                     │  chọn tối ưu — vừa nhẹ vừa    │ │  │
│  │                     │  bền."                         │ │  │
│  │                     └────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  Confidence: ⭐⭐⭐⭐☆ (92%)                              │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── ALTERNATIVES (optional, collapsed by default) ─────────┐ │
│  │                                                           │ │
│  │  ▶ Xem các lựa chọn khác                                  │ │
│  │  (Expanded: 2-3 alternative cards in smaller format)      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── ACTION BUTTONS ────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  [📦 Đặt hàng ngay]  (primary)                           │ │
│  │  [🖼 Xem mockup]  (secondary, if printing=yes)            │ │
│  │  [💾 Lưu để sau]  (ghost)                                 │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── WHAT'S NEXT ───────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  "Sau khi đặt hàng, nhân viên của chúng tôi sẽ xác nhận  │ │
│  │  giá và thời gian sản xuất trong vòng 24h."               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Recommendation card | Custom (not a standard card — elevated, grid layout) | Image left, specs right |
| Price display | Large text, bold, blue | `text-2xl font-bold text-blue-600` |
| AI Tips | `bg-blue-50` tinted background, `text-sm text-blue-800` | Light blue info box |
| Confidence stars | 5 stars, 4 filled = 92% | Visual only, not interactive |
| Alternatives disclosure | shadcn Accordion or Collapsible | 2-3 smaller cards |
| Action buttons | 3 variants: primary, secondary, ghost | No duplicate intent |

#### States

| State | What renders | Notes |
|---|---|---|
| **Loading** | Skeleton: recommendation card shape (image skeleton + text lines) | |
| **Loaded** | Full recommendation as above | |
| **Error (AI fail)** | Error card: "AI không thể phân tích. Vui lòng thử lại." | Retry button. Also show "Liên hệ nhân viên" fallback. |
| **No alternatives** | Collapsed section hidden or "Không có lựa chọn thay thế" | |
| **Saved** | Toast: "Đã lưu. Bạn có thể xem lại trong dashboard." | |

#### Modals
- None on this screen. Actions navigate to other pages.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Centered card, 2-column inside (image + specs). |
| **Card** | `shadow-md`, `rounded-lg`, `border`. Elevated to show importance. |
| **Tips box** | Tinted background, not a card. Subtle visual hierarchy. |
| **Motion** | Card fades in with `opacity 0 → 1` on load. No spring. |
| **Confidence** | Stars are visual shorthand for non-tech users. |
| **Alternatives** | Collapsed by default to avoid choice overload (B2B principle). |

---

### 4. Consultation — Mockup Preview (`/consultation?step=mockup`)

**Purpose**: Optional step. Customer uploads logo, selects print position, AI renders a box mockup preview.

**Route**: `/consultation?step=mockup&id=<consultation_id>`
**Layout**: L1 (Public Layout, minimal header)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (minimal)                                            │
│  [Logo]  [Step: ❶ ✓ → ❷ ✓ → ❸ Mockup]                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (max-w-4xl)                                    │
│                                                               │
│  H2: "Tạo bản xem trước bao bì"                               │
│  Subtext: "Tải logo lên và chọn vị trí in để xem trước."     │
│                                                               │
│  ┌── 2-COLUMN LAYOUT ──────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌── LEFT: Preview ──────────┐  ┌── RIGHT: Controls ─┐ │  │
│  │  │                           │  │                     │ │  │
│  │  │  ┌───────────────────┐   │  │  Logo:              │ │  │
│  │  │  │                   │   │  │  [Chọn file]        │ │  │
│  │  │  │  3D Box Mockup    │   │  │  (or drag & drop)   │ │  │
│  │  │  │  (rendered)       │   │  │                     │ │  │
│  │  │  │                   │   │  │  Vị trí in:         │ │  │
│  │  │  │                   │   │  │  [◎ Mặt trước       │ │  │
│  │  │  │                   │   │  │   ○ Mặt sau         │ │  │
│  │  │  │                   │   │  │   ○ Cả hai mặt      │ │  │
│  │  │  │                   │   │  │   ○ Nắp hộp]        │ │  │
│  │  │  └───────────────────┘   │  │                     │ │  │
│  │  │                           │  │  Màu in:            │ │  │
│  │  │  [🔄 Tạo lại]  [💾 Tải]  │  │  [◎ 1 màu           │ │  │
│  │  │                           │  │   ○ 2 màu           │ │  │
│  │  └───────────────────────────┘  │   ○ CMYK]          │ │  │
│  │                                 │                     │ │  │
│  │                                 │  [Tạo mockup]      │ │  │
│  │                                 │                     │ │  │
│  │                                 └─────────────────────┘ │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── ACTIONS ──────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [📦 Đặt hàng với mockup này]  (primary)               │  │
│  │  [Bỏ qua]  (ghost)                                      │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| 3D mockup preview | Iframe or image of generated mockup | Placeholder: `bg-gray-100` with box icon |
| File upload | Drag-and-drop zone | PDF/AI/PNG, max 10MB |
| Print position radio | Radio group | 4 options |
| Print color radio | Radio group | 4 options |
| Generate button | Primary button | Calls `/api/ai/mockup` |

#### States

| State | What renders |
|---|---|
| **Initial (no mockup)** | Placeholder box outline, no image. Controls enabled. |
| **Generating** | Spinner over preview area + "AI đang tạo mockup..." |
| **Generated** | Actual mockup image rendered. Download button enabled. |
| **Error** | Error alert: "Không thể tạo mockup. Vui lòng thử lại." |
| **Downloading** | Loading state on download button |

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | 2-column split. Preview takes 60% width, controls 40%. |
| **Preview** | 3D-ish box representation. Generated by AI via `/api/ai/mockup`. |
| **Controls** | Minimal — only file, position, color. No overwhelming options. |
| **Mobile** | Stacks: Preview on top, controls below. |

|---

### 5. Order — Standalone (`/order`)

**Purpose**: Place an order directly without AI consultation. For customers who already know what box they need.

**Route**: `/order`
**Layout**: L1 (Public Layout, minimal header)

**Design Read**: Form page for B2B buyers who know their specs, minimal friction, pre-filled AI recommendation optional.

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (minimal)                                            │
│  [Logo]                                                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (max-w-3xl, centered)                          │
│                                                               │
│  H1: "Đặt hàng trực tiếp"                                     │
│  Subtext: "Bạn đã biết mình cần loại hộp nào? Điền thông     │
│  tin và đặt hàng ngay."                                       │
│                                                               │
│  ┌── FORM ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌─ GROUP 1: CHỌN SẢN PHẨM ─────────────────────────  │  │
│  │  │                                                      │  │
│  │  │  Loại hộp: [Carton 3 lớp B-flute ▼]                 │  │
│  │  │  Kích thước (cm): Dài [__] × Rộng [__] × Cao [__]  │  │
│  │  │  Số lượng: [_______]  hộp                            │  │
│  │  │                                                      │  │
│  │  │  Bạn có cần in ấn? [◎ Có] [○ Không]                │  │
│  │  │  (Nếu có: upload file, ghi chú in ấn)               │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─ GROUP 2: THÔNG TIN GIAO HÀNG ────────────────────  │  │
│  │  │                                                      │  │
│  │  │  Họ tên: [___________________________]               │  │
│  │  │  SĐT: [___________________________]                  │  │
│  │  │  Email: [___________________________]                │  │
│  │  │  Địa chỉ: [___________________________]              │  │
│  │  │  Ghi chú: [___________________________]              │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─ GROUP 3: THANH TOÁN ────────────────────────────   │  │
│  │  │                                                      │  │
│  │  │  Phương thức: [◎ COD] [○ Chuyển khoản]             │  │
│  │  │                                                      │  │
│  │  │  (If transfer: show bank info, upload proof)         │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [📦 Đặt hàng]  (primary, full-width)                  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  Note: "Đơn hàng của bạn sẽ được staff xác nhận trong vòng   │
│  24h. Nếu bạn chưa chắc chắn về quy cách, hãy dùng "         │
│  [🔍 Tư vấn AI miễn phí]  (link to /consultation)            │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Product select | Dropdown from `products` table | Fetched via Server Component |
| Dimension inputs | 3 number inputs with unit suffix | `grid grid-cols-3 gap-2` |
| File upload | Drag-drop zone | Logo/design file, PDF/AI/PNG |
| Payment radio | COD vs Bank Transfer | Conditional UI |
| Submit button | Primary, full-width | Calls POST `/api/orders` |

#### States

| State | What renders |
|---|---|
| **Loading** | Form skeleton: 4-5 skeleton lines |
| **Validation error** | Inline error messages |
| **Submitting** | Button spinner + "Đang xử lý..." |
| **Success** | Redirect to order confirmation (or login if anonymous) |
| **Error** | Error banner |

#### Modals
- **M1 (Payment Confirmation)**: If bank transfer selected.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Single column, centered, `max-w-3xl`. Same form pattern as consultation. |
| **Anonymous flow** | If user is not logged in, show "Vui lòng đăng nhập hoặc đăng ký để đặt hàng" after submit. Save form data in session. |
| **CTAs** | Primary: "Đặt hàng". Secondary link: "Tư vấn AI miễn phí" (points to /consultation). No duplicate intent. |

---

### 6. About (`/about`)

**Purpose**: Factory info, trust building. Show real facility, team, certifications.

**Route**: `/about`
**Layout**: L1 (Public Layout)

---

#### Structure (abbreviated — trust page)

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (standard)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  HERO (smaller, not min-h)                                    │
│                                                               │
│  H1: "Về chúng tôi"                                           │
│  Subtext: "Nhà máy sản xuất bao bì carton hàng đầu tại Việt   │
│  Nam."                                                        │
│  (Background: wide factory photo, muted)                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  STORY SECTION (split text + image)                           │
│                                                               │
│  H2: "Hành trình của chúng tôi"                               │
│  Body: "Thành lập năm 2014..."                                │
│  (Image: founder or early factory)                            │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  STATS BANNER (4 stats in a row)                              │
│                                                               │
│  5000+    │  10+ năm  │  3000m²  │  63 tỉnh                  │
│  Khách hàng│ Kinh nghiệm│ Nhà máy  │ Phủ sóng                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FACTORY GALLERY (grid of 4-6 images)                         │
│                                                               │
│  H2: "Cơ sở vật chất"                                         │
│  [Image 1] [Image 2]                                          │
│  [Image 3] [Image 4]                                          │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  EQUIPMENT / CERTIFICATIONS (logos)                           │
│                                                               │
│  H2: "Trang thiết bị & Chứng nhận"                            │
│  [Machine logo] [Cert logo] [Machine logo]                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  CTA: "Bắt đầu tư vấn ngay"                                   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                       │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Smaller hero (not `min-h`). Mix of split, stats banner, grid, logo wall. |
| **Images** | Real factory photos. Generate via image tool if none exist. |
| **Stats** | Numbers with short labels. Large display numbers. |
| **Eyebrow** | 0 eyebrows on this page (hero has no eyebrow, no section needs one). |

---

### 7. Login (`/login`)

**Purpose**: User authentication. Minimal, focused.

**Route**: `/login`
**Layout**: L1 (Public Layout, blank/centered)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  (No navbar — centered card on bg-gray-50)                    │
│                                                               │
│  ┌──────────────────────────────────────┐                    │
│  │                                      │                    │
│  │  [Logo]                              │                    │
│  │                                      │                    │
│  │  H2: "Đăng nhập"                     │                    │
│  │                                      │                    │
│  │  Email: [________________________]   │                    │
│  │  Mật khẩu: [________________________]│                    │
│  │  [Forgot?]                           │                    │
│  │                                      │                    │
│  │  [Đăng nhập]  (full-width)           │                    │
│  │                                      │                    │
│  │  ─── hoặc ───                        │                    │
│  │                                      │                    │
│  │  [Đăng nhập với Google]  (outline)   │                    │
│  │                                      │                    │
│  │  Chưa có tài khoản? [Đăng ký]        │                    │
│  │                                      │                    │
│  └──────────────────────────────────────┘                    │
│                                                               │
│  FOOTER (minimal, absolute bottom)                            │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Auth card | Centered card, `max-w-md` | `mx-auto mt-24` |
| Email input | Section 3.2 — Text input | |
| Password input | Text input with `type="password"` | |
| Google button | Outline button with Google icon | Secondary style |
| Submit button | Primary button, full-width | |

#### States

| State | What renders |
|---|---|
| **Initial** | Empty form |
| **Validation error** | Inline errors |
| **Submitting** | Spinner on button |
| **Auth error** | Error alert above form: "Email hoặc mật khẩu không đúng." |
| **Success** | Redirect to dashboard or staff based on role |

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Centered card, minimal decoration. No navbar. |
| **Social login** | Google only (Supabase handles). More can be added. |
| **Motion** | None. Static form. |

---

### 8. Register (`/register`)

**Purpose**: New user registration. Minimal fields.

**Route**: `/register`
**Layout**: L1 (Public Layout, blank/centered)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  (Same layout as Login)                                      │
│                                                               │
│  ┌──────────────────────────────────────┐                    │
│  │                                      │                    │
│  │  [Logo]                              │                    │
│  │                                      │                    │
│  │  H2: "Đăng ký tài khoản"             │                    │
│  │                                      │                    │
│  │  Họ tên: [________________________]  │                    │
│  │  Email: [________________________]   │                    │
│  │  Số điện thoại: [________________]   │                    │
│  │  Mật khẩu: [________________________]│                    │
│  │  Xác nhận MK: [____________________]│                    │
│  │                                      │                    │
│  │  [x] Tôi đồng ý với điều khoản sử   │                    │
│  │      dụng                             │                    │
│  │                                      │                    │
│  │  [Đăng ký]  (full-width)             │                    │
│  │                                      │                    │
│  │  Đã có tài khoản? [Đăng nhập]        │                    │
│  │                                      │                    │
│  └──────────────────────────────────────┘                    │
│                                                               │
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### States

| State | What renders |
|---|---|
| **Initial** | Empty form |
| **Validation error** | Inline errors (password mismatch, invalid email, etc.) |
| **Submitting** | Spinner on button |
| **Error** | Error alert: "Email đã tồn tại" or "Mật khẩu quá yếu" |
| **Success** | Redirect to dashboard with welcome toast |

#### Design Notes

| Aspect | Decision |
|---|---|
| **Fields** | Minimal: name, email, phone, password. No address yet. |
| **Terms** | Checkbox with link to terms page. |
| **Password** | Show password toggle (eye icon). |

---

## AUTHENTICATED — CUSTOMER

---

### 9. Customer Dashboard (`/dashboard`)

**Purpose**: Customer's home. Overview of their orders, quick actions.

**Route**: `/dashboard`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer version)                                   │
│  [Logo]  [Dashboard] [My Orders] [History] [Profile]  [👤]  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (padded)                                       │
│                                                               │
│  H1: "Xin chào, {name}"  (with small "Welcome back" text)    │
│                                                               │
│  ┌── STATS ROW (3 cards, grid) ───────────────────────────┐  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Tổng đơn hàng │  │  Đang xử lý  │  │  Đã lưu      │  │  │
│  │  │      12       │  │       3      │  │  Sản phẩm  5 │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── QUICK ACTIONS ────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [🔍 Tư vấn mới]  [📋 Đặt lại]  [📦 Theo dõi đơn]     │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── RECENT ORDERS (table, last 5) ────────────────────────┐  │
│  │                                                         │  │
│  │  H2: "Đơn hàng gần đây"  [Xem tất cả →]                 │  │
│  │                                                         │  │
│  │  ┌───────┬───────────┬──────────┬─────────┬─────────┐  │  │
│  │  │ Mã ĐH │ Sản phẩm  │ Trạng    │ Ngày    │ Số tiền │  │  │
│  │  │       │           │ thái     │         │         │  │  │
│  │  ├───────┼───────────┼──────────┼─────────┼─────────┤  │  │
│  │  │ #ORD  │ Coffee... │ ✅ Đã    │ 10/09   │ 500k   │  │  │
│  │  │ -001  │           │ giao     │         │         │  │  │
│  │  │ #ORD  │ Cosmetic..│ 🔧 Sản   │ 08/09   │ 600k   │  │  │
│  │  │ -002  │           │ xuất     │         │         │  │  │
│  │  └───────┴───────────┴──────────┴─────────┴─────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── NEWSLETTER / PROMO BANNER (optional) ─────────────────┐  │
│  │                                                         │  │
│  │  💡 Mẹo: "Đặt hàng số lượng lớn — chiết khấu lên đến   │  │
│  │  15%. Liên hệ ngay!"                                    │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Stats cards | Section 3.3 — Stats card | Number large, label small |
| Quick action buttons | Section 3.1 — Primary/secondary mix | 3 inline buttons |
| Orders table | Section 3.6 — Table template | Last 5 rows, scrollable |
| Empty state | Section 3.8 — Empty state | For when no orders exist |

#### States

| State | What renders |
|---|---|
| **Loading** | Skeleton: 3 stat cards + table skeleton (5 rows) |
| **Loaded (has orders)** | Full dashboard as above |
| **Loaded (no orders)** | Empty state: "Bạn chưa có đơn hàng nào. Hãy bắt đầu tư vấn!" |
| **Error** | Error banner: "Không thể tải dữ liệu. Vui lòng tải lại." |

#### Modals
- None on dashboard. All actions navigate to other pages.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Sidebar on left, content on right (L2). Content: stats row → quick actions → table. |
| **Stats** | 3 stat cards in a row. Use `grid-cols-1 md:grid-cols-3`. |
| **Table** | Last 5 orders. "Xem tất cả" links to full orders page. |
| **Promo banner** | Subtle tinted background (`bg-blue-50`), dismissible. |

---

### 10. My Orders (`/dashboard/orders`)

**Purpose**: Full list of customer's orders with status tracking.

**Route**: `/dashboard/orders`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Đơn hàng của tôi"    [🔍 Tư vấn mới]                   │
│                                                               │
│  ┌── FILTERS ──────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [Tất cả] [Đang xử lý] [Đã xác nhận] [Đang SX]         │  │
│  │  [Hoàn thành] [Đã hủy]                                  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── ORDER CARDS (list, not table) ────────────────────────┐  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  #ORD-001  │  Coffee Beans Co.  │  500 boxes     │  │  │
│  │  │  ┌─────────────────────────────────────────────┐  │  │  │
│  │  │  │  Timeline: ✅ CN → ⏳ SX → 📦 GH             │  │  │  │
│  │  │  │  ████████░░░░░░░░░  60%                     │  │  │  │
│  │  │  │  Dự kiến: 15/09/2026                        │  │  │  │
│  │  │  └─────────────────────────────────────────────┘  │  │  │
│  │  │  2,500,000₫  │  [Xem chi tiết]                    │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  #ORD-002  │  Cosmetics Box  │  200 boxes        │  │  │
│  │  │  📦 Hoàn thành — 10/09/2026                       │  │  │
│  │  │  [Xem chi tiết]  [Đặt lại]  [Đánh giá]            │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── PAGINATION ───────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [<]  1  2  3  ...  10  [>]                             │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Filter pills | shadcn Tabs or custom pill buttons | Scrollable on mobile |
| Order card | Custom card with timeline embedded | See Order Status Timeline below |
| Progress bar | Custom `div` with `bg-blue-600` fill | No background track (Tasteskill 9.F) |
| Pagination | shadcn Pagination | 10 per page |

#### States

| State | What renders |
|---|---|
| **Loading** | 3-4 order card skeletons |
| **Loaded (has orders)** | List of cards |
| **Loaded (no orders)** | Empty state with CTA to start consultation |
| **Filtered: no results** | "Không có đơn hàng nào với trạng thái này" |
| **Error** | Error banner |

#### Modals
- **M2 (Cancel Order Confirmation)**: When user clicks "Hủy đơn" on order card.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Cards (not table) for better mobile readability. Shows timeline + progress. |
| **Filters** | Pills, not dropdown. Mobile: horizontal scroll. |
| **Progress bar** | Thin bar, no background track. Shows percentage. |

---

### 11. Order Detail (`/dashboard/orders/[id]`)

**Purpose**: Full order detail with status timeline, specs, pricing, and actions.

**Route**: `/dashboard/orders/[id]`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  Breadcrumb: Đơn hàng của tôi > #ORD-001                     │
│                                                               │
│  ┌── ORDER HEADER ─────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  H1: "Đơn hàng #ORD-001"                                │  │
│  │  Status: ✅ Đã xác nhận                                  │  │
│  │  Ngày đặt: 08/09/2026                                    │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── STATUS TIMELINE (vertical) ───────────────────────────┐  │
│  │                                                         │  │
│  │  ✅ Đã đặt hàng           — 08/09/2026 14:30           │  │
│  │  │                                                      │  │
│  │  ✅ Staff đã xác nhận     — 09/09/2026 09:15           │  │
│  │  │                                                      │  │
│  │  🔵 Đang sản xuất         — 10/09/2026 08:00           │  │
│  │  │  (current)                                           │  │
│  │  ○ Hoàn thành             — Dự kiến: 15/09/2026        │  │
│  │  │                                                      │  │
│  │  ○ Đã giao hàng                                         │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── 2-COLUMN DETAIL ──────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌── LEFT: Product Info ──────┐  ┌── RIGHT: Pricing ─┐ │  │
│  │  │                            │  │                    │ │  │
│  │  │ Sản phẩm: Cà phê           │  │ Đơn giá: 5,000đ   │ │  │
│  │  │ Kích thước: 30×20×15 cm    │  │ Số lượng: 100 hộp │ │  │
│  │  │ Loại hộp: Carton 3 lớp     │  │ Tạm tính: 500,000đ│ │  │
│  │  │ Chất liệu: B-flute         │  │ Thuế (VAT 10%):   │ │  │
│  │  │ Trọng lượng: 5kg/hộp       │  │   50,000đ          │ │  │
│  │  │ In ấn: In 1 màu (có logo)  │  │ ─────────────────  │ │  │
│  │  │                            │  │ Tổng: 550,000đ    │ │  │
│  │  │  [Xem mockup]              │  │                    │ │  │
│  │  │                            │  │ Phương thức: COD   │ │  │
│  │  └────────────────────────────┘  │ Trạng thái TT:    │ │  │
│  │                                  │   Chưa thanh toán  │ │  │
│  │                                  └────────────────────┘ │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── CUSTOMER INFO ─────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  Giao hàng đến: {address}                               │  │
│  │  Liên hệ: {phone} — {email}                             │  │
│  │  Ghi chú: {notes}                                       │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── ACTIONS ──────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [Đặt lại]  [Hủy đơn hàng]  (if cancellable)           │  │
│  │  [Liên hệ hỗ trợ]                                       │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Status timeline | Custom vertical timeline component | Active step = blue, completed = green, future = gray |
| 2-column detail | Grid layout | Specs left, pricing right |
| Pricing breakdown | Un-bordered list with `space-y-1` | No card containers (Tasteskill 4.4) |
| Breadcrumb | `text-sm text-gray-500` | Link back to orders list |

#### States

| State | What renders |
|---|---|
| **Loading** | Full page skeleton with timeline skeleton |
| **Loaded** | Full detail as above |
| **Error** | Error banner |
| **Cancellable** | Cancel button visible if status is `pending` or `confirmed` |
| **Not cancellable** | Cancel button hidden or disabled with tooltip |

#### Modals
- **M2 (Cancel Order Confirmation)**: When clicking "Hủy đơn hàng"

#### Design Notes

| Aspect | Decision |
|---|---|
| **Timeline** | Vertical, not horizontal (better for mobile). Each step has date+time. |
| **Pricing** | Right column, clean list. No card, just spacing. |
| **Actions** | Bottom of content. Primary actions: Đặt lại. Secondary: Hủy, Liên hệ. |

---

### 12. Order History (`/dashboard/history`)

**Purpose**: Completed/delivered orders. Searchable, filterable.

**Route**: `/dashboard/history`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Lịch sử đơn hàng"                                      │
│                                                               │
│  ┌── SEARCH + FILTERS ─────────────────────────────────────┐  │
│  │                                                         │  │
│  │  🔍 [Tìm kiếm theo mã đơn...]       [Lọc theo ngày ▼]  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── TABLE ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌───────┬───────────┬──────────┬─────────┬──────────┐  │  │
│  │  │ Mã ĐH │ Sản phẩm  │ Ngày     │ Tổng    │ Trạng    │  │  │
│  │  │       │           │ giao     │         │ thái     │  │  │
│  │  ├───────┼───────────┼──────────┼─────────┼──────────┤  │  │
│  │  │ #ORD  │ Coffee... │ 10/09    │ 500k    │ ✅ Giao  │  │  │
│  │  │ ...   │           │          │         │          │  │  │
│  │  └───────┴───────────┴──────────┴─────────┴──────────┘  │  │
│  │                                                         │  │
│  │  [<]  1  2  3  ...  [>]                                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Table (like Orders page) but with search + date filter. |
| **Search** | By order ID. Real-time filter. |
| **Date filter** | Dropdown: "7 ngày qua", "30 ngày qua", "Tất cả". |
| **Actions** | Click row → order detail. "Đặt lại" button in each row. |

---

### 13. Reorder (`/dashboard/reorder`)

**Purpose**: Reorder from past order. Pre-filled specs, adjust quantity.

**Route**: `/dashboard/reorder?id=<order_id>`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Đặt lại đơn hàng"                                       │
│  Subtext: "Đặt hàng với thông số tương tự đơn #ORD-001"       │
│                                                               │
│  ┌── SAVED PRODUCTS (tabs, from saved_products table) ──────┐  │
│  │                                                         │  │
│  │  [Sản phẩm đã lưu] [Đơn hàng gần đây] [Mẫu đặt lại]    │  │
│  │                                                         │  │
│  │  ┌─ Tab: Sản phẩm đã lưu ──────────────────────────┐    │  │
│  │  │  ○ Coffee box A4 (đã lưu)                        │    │  │
│  │  │  ○ Cosmetics box (đã lưu)                        │    │  │
│  │  │  [Lưu thông số hiện tại]  (ghost button)         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── ORDER SUMMARY (read-only) ────────────────────────────┐  │
│  │                                                         │  │
│  │  Sản phẩm: Cà phê (30×20×15 cm, B-flute, in 1 màu)     │  │
│  │  Đơn giá cũ: 5,000đ/hộp                                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── EDITABLE FORM ────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  Số lượng: [______]  (pre-filled with previous qty)    │  │
│  │  Ghi chú mới: [___________________________]             │  │
│  │                                                         │  │
│  │  Phương thức thanh toán:                                │  │
│  │  [◎ COD]  [○ Chuyển khoản]                             │  │
│  │                                                         │  │
│  │  [Đặt hàng]  (primary)                                  │  │
│  │  [Hủy]  (ghost)                                         │  │
│  │                                                         │  │
│  │  Note: "Giá có thể thay đổi so với đơn cũ. Staff sẽ    │  │
│  │  xác nhận lại."                                         │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Pre-filled** | All specs copied from previous order. Only quantity editable. |
| **Saved products** | Tab shows `saved_products` table. Customer can save current specs as a named preset. |
| **Reorder templates** | Tab shows `reorder_templates` table. Auto-reorder and reminder settings. |
| **Price note** | Warning that price may differ. Builds trust through transparency. |
| **Flow** | Creates new order (doesn't duplicate old one). |

---

### 14. Profile (`/dashboard/profile`)

**Purpose**: Customer profile settings.

**Route**: `/dashboard/profile`
**Layout**: L2 (Customer Dashboard Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (customer)                                           │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Thông tin tài khoản"                                    │
│                                                               │
│  ┌── PROFILE FORM ─────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  Họ tên: [___________________________]                  │  │
│  │  Email: [___________________________]  (verified ✓)     │  │
│  │  Số điện thoại: [___________________________]           │  │
│  │  Địa chỉ mặc định: [___________________________]        │  │
│  │  Tên công ty: [___________________________]              │  │
│  │                                                         │  │
│  │  [Lưu thay đổi]  (primary)                              │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── DANGER ZONE ──────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  H2: "Khu vực nguy hiểm"                                 │  │
│  │  [Đổi mật khẩu]  [Xóa tài khoản]  (red buttons)        │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Single form, max-w-2xl. |
| **Danger zone** | Red buttons, separated by visual divider. |
| **Email** | Read-only or verified badge. |

---

## AUTHENTICATED — STAFF

---

### 15. Staff Dashboard (`/staff`)

**Purpose**: Staff home. Overview stats, pending consultations, quick actions.

**Route**: `/staff`
**Layout**: L3 (Staff Layout with Sidebar)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR (collapsed on mobile)                               │
│  [Logo]                                                      │
│  [📊 Tổng quan]  ← active                                   │
│  [📋 Tư vấn]                                                 │
│  [📦 Đơn hàng]                                               │
│  [👥 Khách hàng]                                             │
│  [📦 Sản phẩm]                                               │
│  [⚙️ Cài đặt]                                                │
│  ─────────────                                               │
│  [👤 Staff name]  [Đăng xuất]                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Tổng quan"  (small: "Hôm nay, 12/09/2026")             │
│                                                               │
│  ┌── STATS CARDS (4 cards, grid) ──────────────────────────┐  │
│  │                                                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │ 💬 Tư vấn  │  │ ⏳ Đơn     │  │ 🔧 Đang    │        │  │
│  │  │ mới        │  │ chờ xử lý  │  │ sản xuất  │        │  │
│  │  │     12     │  │      8     │  │      3    │        │  │
│  │  │  +3 hôm nay│  │  +2 hôm nay│  │           │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  │                                                         │  │
│  │  ┌────────────┐  ┌────────────┐                         │  │
│  │  │ 📦 Đã giao │  │ 💰 Doanh   │                         │  │
│  │  │ hôm nay    │  │ thu tháng  │                         │  │
│  │  │      5     │  │   45.5M    │                         │  │
│  │  │             │  │            │                         │  │
│  │  └────────────┘  └────────────┘                         │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── RECENT CONSULTATIONS (table) ─────────────────────────┐  │
│  │                                                         │  │
│  │  H2: "Tư vấn gần đây"  [Xem tất cả →]                   │  │
│  │                                                         │  │
│  │  ┌───────┬──────────┬──────────┬────────────┬─────────┐  │  │
│  │  │ Khách │ Sản phẩm │ Kích     │ Giá ước    │ Hành    │  │  │
│  │  │ hàng  │          │ thước    │ tính       │ động    │  │  │
│  │  ├───────┼──────────┼──────────┼────────────┼─────────┤  │  │
│  │  │ Nguyen│ Cà phê   │ 30×20    │ 5,000đ     │ [Xem]   │  │  │
│  │  │ Van A │          │          │            │ [NV]    │  │  │
│  │  │ ....  │          │          │            │         │  │  │
│  │  └───────┴──────────┴──────────┴────────────┴─────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── CHARTS (recharts) ────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐  │  │
│  │  │  Đơn hàng theo tuần  │  │  Doanh thu theo tháng    │  │  │
│  │  │  (BarChart)          │  │  (LineChart)             │  │  │
│  │  └──────────────────────┘  └──────────────────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal)                                             │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Sidebar | Custom sidebar component | 6 nav items, active state indicated |
| Stats cards | Section 3.3 — Stats card | 4 in a row, `grid-cols-2 md:grid-cols-4` |
| Table | Section 3.6 — Table | Consultations list |
| Charts | recharts (BarChart + LineChart) | Installed via `npm install recharts` |

#### States

| State | What renders |
|---|---|
| **Loading** | Skeleton: 4 stat cards + table skeleton + chart skeletons |
| **Loaded (has data)** | Full dashboard |
| **Loaded (no data)** | Empty states for each section |
| **Error** | Error banner |

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Sidebar + content (L3). Sidebar is fixed width (w-64). |
| **Stats** | 4 cards with icons. Delta indicators (+3 today). |
| **Charts** | Only on staff dashboard. Use recharts. |
| **Data density** | DENSITY=4 allows balanced spacing. Not too tight. |

---

### 16. Staff Consultations (`/staff/consultations`)

**Purpose**: List all AI consultations. Staff can review and convert to orders.

**Route**: `/staff/consultations`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│  [📊 Tổng quan]                                              │
│  [📋 Tư vấn]  ← active                                      │
│  ...                                                          │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Tư vấn"                                                 │
│                                                               │
│  ┌── FILTERS + SEARCH ─────────────────────────────────────┐  │
│  │                                                         │  │
│  │  🔍 [Tìm kiếm...]  [Tất cả ▼]  [Mới nhất ▼]           │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── TABLE ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌───────┬──────────┬──────────┬──────────┬─────────┐  │  │
│  │  │ Khách │ Sản phẩm │ Kích     │ Giá AI   │ Trạng   │  │  │
│  │  │ hàng  │          │ thước    │ ước tính │ thái    │  │  │
│  │  ├───────┼──────────┼──────────┼──────────┼─────────┤  │  │
│  │  │ Nguyen│ Cà phê   │ 30×20    │ 5,000đ   │ Mới     │  │  │
│  │  │ │     │          │ ×15      │          │ [NV]    │  │  │
│  │  │ │     │          │          │          │ ⟳ 10p   │  │  │
│  │  │ │     │          │          │          │ trước   │  │  │
│  │  │ ....  │          │          │          │         │  │  │
│  │  └───────┴──────────┴──────────┴──────────┴─────────┘  │  │
│  │                                                         │  │
│  │  [<]  1  2  3  ...  [>]                                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Table | Section 3.6 — Table | Full-width, sortable columns |
| Status badge | Section 3.7 — Status Badge | Trạng thái: Mới (yellow), Đã xem (gray), Đã chuyển đơn (green) |
| Click row | Navigate to `/staff/consultations/[id]` | |

#### States

| State | What renders |
|---|---|
| **Loading** | Table skeleton |
| **Loaded (has data)** | Full table |
| **Loaded (no data)** | Empty state: "Chưa có tư vấn nào" |
| **Filtered: no results** | "Không tìm thấy kết quả" |

---

### 17. Staff Consultation Review (`/staff/consultations/[id]`)

**Purpose**: Review AI recommendation, confirm final price, convert to order.

**Route**: `/staff/consultations/[id]`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  Breadcrumb: Tư vấn > #{consultation_id}                     │
│  H1: "Xem xét tư vấn"                                        │
│  Status: 🤖 AI đã xử lý · Chờ staff xem xét                  │
│  (Từ: pending → ai_processed → staff_reviewed → quoted →     │
│   converted/closed)                                           │
│                                                               │
│  ┌── 2-COLUMN LAYOUT ──────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌── LEFT: Info (60%) ──────────────┐  ┌── RIGHT:      │  │
│  │  │                                   │  │  Staff Action │  │
│  │  │  ┌── CUSTOMER INFO CARD ──────┐  │  │  (40%) ────┐  │  │
│  │  │  │  Nguyễn Văn A              │  │  │            │  │  │
│  │  │  │  📞 0901 234 567           │  │  │  Giá cuối: │  │  │
│  │  │  │  ✉️ a@example.com          │  │  │  [_______] │  │  │
│  │  │  │  🏢 Coffee Beans Co.       │  │  │  đ/hộp     │  │  │
│  │  │  └────────────────────────────┘  │  │            │  │  │
│  │  │                                   │  │  Số lượng  │  │  │
│  │  │  ┌── PRODUCT SPECS ───────────┐  │  │  tối thiểu │  │  │
│  │  │  │  Sản phẩm: Cà phê          │  │  │  [_______]  │  │  │
│  │  │  │  Kích thước: 30×20×15 cm   │  │  │            │  │  │
│  │  │  │  Trọng lượng: 500g         │  │  │  Thời gian  │  │  │
│  │  │  │  Số lượng: 100 hộp         │  │  │  sản xuất   │  │  │
│  │  │  │  In ấn: Có (logo + text)   │  │  │  [_______]  │  │  │
│  │  │  └────────────────────────────┘  │  │  ngày       │  │  │
│  │  │                                   │  │            │  │  │
│  │  │  ┌── AI RECOMMENDATION ────────┐  │  │  Ghi chú:  │  │  │
│  │  │  │  ✅ Carton 3 lớp B-flute    │  │  │  [________] │  │  │
│  │  │  │  Kích thước: 30×20×15 cm   │  │  │            │  │  │
│  │  │  │  Giá ước tính: 5,000đ/hộp  │  │  │  [Xác nhận  │  │  │
│  │  │  │  Confidence: 92%           │  │  │   & Gửi     │  │  │
│  │  │  └────────────────────────────┘  │  │   cho KH]   │  │  │
│  │  │                                   │  │            │  │  │
│  │  │  ┌── LOGO / DESIGN FILE ──────┐  │  │  [Yêu cầu   │  │  │
│  │  │  │  [Preview] [Download]      │  │  │   chỉnh sửa]│  │  │
│  │  │  └────────────────────────────┘  │  │            │  │  │
│  │  │                                   │  └────────────┘  │  │
│  │  └───────────────────────────────────┘                  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Customer info card | Section 3.3 — Card | Contact details |
| AI recommendation card | Elevated card with confidence | Same as customer-facing but read-only |
| Staff confirmation form | 3 inputs: final price, min qty, production time | |
| Logo preview | Image or download link | If printing=yes |
| Confirm button | Primary button (blue) | |
| Request changes | Ghost button (gray) | |

#### States

| State | What renders |
|---|---|
| **Loading** | Skeleton cards |
| **Loaded** | Full review layout |
| **Confirming** | Button spinner + "Đang xử lý..." |
| **Confirmed** | Toast: "Đã xác nhận và gửi cho khách hàng." Redirect to orders. |
| **Error** | Error banner |

#### Modals
- **M3 (Price Change Notification)**: If final price differs significantly from AI estimate.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | 2-column: 60% info, 40% staff action. |
| **Info side** | Grouped cards: customer, specs, AI recommendation, files. |
| **Action side** | Sticky on scroll. Form for final price, qty, timeline. |
| **Confidence** | Shown to staff for trust calibration. |

---

### 18. Staff Orders (`/staff/orders`)

**Purpose**: Manage all orders. View, filter, update status.

**Route**: `/staff/orders`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│  [📦 Đơn hàng]  ← active                                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Đơn hàng"                                               │
│                                                               │
│  ┌── FILTERS ──────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  [Tất cả] [Chờ XL] [Đã XN] [Đặt cọc] [SX] [Xong]      │  │
│  │  [Đã giao] [Đã hủy]                                     │  │
│  │                                                         │  │
│  │  🔍 [Tìm kiếm...]            [Lọc ngày ▼]              │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── TABLE ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌───────┬──────────┬──────────┬──────────┬─────────┐  │  │
│  │  │ Mã ĐH │ Khách    │ Sản phẩm │ Tổng     │ Trạng   │  │  │
│  │  │       │ hàng     │          │          │ thái    │  │  │
│  │  ├───────┼──────────┼──────────┼──────────┼─────────┤  │  │
│  │  │ #ORD  │ Nguyen   │ Cà phê   │ 550,000đ │ ⏳ Chờ  │  │  │
│  │  │ -001  │ Van A    │          │          │ XL      │  │  │
│  │  │ #ORD  │ Tran     │ Mỹ phẩm  │ 600,000đ │ 🔧 SX   │  │  │
│  │  │ -002  │ Thi B    │          │          │         │  │  │
│  │  └───────┴──────────┴──────────┴──────────┴─────────┘  │  │
│  │                                                         │  │
│  │  [<]  1  2  3  ...  [>]                                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Layout** | Table with filter pills. Same pattern as consultations. |
| **Filters** | Status pills + search + date range. |
| **Row click** | Navigate to `/staff/orders/[id]`. |

---

### 19. Staff Order Detail (`/staff/orders/[id]`)

**Purpose**: Full order detail. Staff can update status, manage payment verification.

**Route**: `/staff/orders/[id]`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  Breadcrumb: Đơn hàng > #ORD-001                             │
│                                                               │
│  ┌── STATUS UPDATE BAR (sticky) ───────────────────────────┐  │
│  │                                                         │  │
│  │  Trạng thái hiện tại: ⏳ Chờ xử lý                      │  │
│  │  Cập nhật thành: [Chọn trạng thái ▼]  [Cập nhật]      │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── 2-COLUMN ─────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌── LEFT: Order Info ──────────┐  ┌── RIGHT:          │  │
│  │  │                              │  │  Payment Info ──┐  │  │
│  │  │  Customer: {name}            │  │  │               │  │  │
│  │  │  Phone: {phone}              │  │  │  Phương thức: │  │  │
│  │  │  Email: {email}              │  │  │  COD          │  │  │
│  │  │  Address: {address}          │  │  │  Trạng thái:  │  │  │
│  │  │                              │  │  │  Chưa TT      │  │  │
│  │  │  Product: Cà phê             │  │  │               │  │  │
│  │  │  Specs: 30×20×15 cm          │  │  │  [Xác nhận    │  │  │
│  │  │  Box: 3 lớp B-flute          │  │  │   thanh toán] │  │  │
│  │  │  Quantity: 100 hộp           │  │  │               │  │  │
│  │  │  Printing: In 1 màu          │  │  └───────────────┘  │  │
│  │  │                              │  │                      │  │
│  │  │  Price: 5,000đ/hộp           │  │  ┌── TIMELINE ────┐  │  │
│  │  │  Total: 550,000đ             │  │  │  ✅ 08/09: Đặt │  │  │
│  │  │  Notes: {notes}              │  │  │  ⏳ 09/09: Chờ │  │  │
│  │  │                              │  │  │  (current)     │  │  │
│  │  └──────────────────────────────┘  │  └───────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Reference | Notes |
|---|---|---|
| Status update bar | Sticky bar at top of content | Dropdown + confirm button |
| Payment section | Card with payment status + verify button | |
| Timeline | Vertical timeline (same as customer) | Read-only for staff |

#### States

| State | What renders |
|---|---|
| **Loading** | Skeleton |
| **Loaded** | Full detail |
| **Updating status** | Spinner on Update button |
| **Status updated** | Toast + timeline refreshes |

#### Modals
- **M4 (Upload Payment Proof)**: When staff verifies bank transfer payment.

#### Design Notes

| Aspect | Decision |
|---|---|
| **Sticky bar** | Status update bar sticks to top of content area. |
| **Payment** | Shows payment method, status, and verification button. |

---

### 20. Staff Customers (`/staff/customers`)

**Purpose**: View customer list. See contact info, order history.

**Route**: `/staff/customers`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│  [👥 Khách hàng]  ← active                                  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Khách hàng"                                             │
│                                                               │
│  ┌── SEARCH ───────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  🔍 [Tìm kiếm theo tên, SĐT, email...]                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌── TABLE ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌───────┬──────────┬──────────┬───────────┬──────────┐  │  │
│  │  │ Tên    │ SĐT      │ Email    │ Tổng đơn  │ Hành     │  │  │
│  │  │        │          │          │           │ động    │  │  │
│  │  ├───────┼──────────┼──────────┼───────────┼──────────┤  │  │
│  │  │ Nguyen │ 0901...  │ a@...    │ 12 đơn    │ [Xem]   │  │  │
│  │  │ Van A  │          │          │ 45.5M     │         │  │  │
│  │  │ ...    │          │          │           │         │  │  │
│  │  └───────┴──────────┴──────────┴───────────┴──────────┘  │  │
│  │                                                         │  │
│  │  [<]  1  2  3  ...  [>]                                 │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Search** | By name, phone, or email. Real-time filtering. |
| **Row click** | Opens M5 (Customer Quick View) or navigates to customer detail. |
| **Total orders** | Shows count + total revenue per customer. |

---

### 21. Staff Products (`/staff/products`)

**Purpose**: Manage product catalog (box types, materials, pricing).

**Route**: `/staff/products`
**Layout**: L3 (Staff Layout)

---

#### Structure

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                     │
│  [📦 Sản phẩm]  ← active                                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                │
│                                                               │
│  H1: "Danh mục sản phẩm"    [Thêm sản phẩm]                   │
│                                                               │
│  ┌── TABLE ────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  ┌───────┬──────────┬──────────┬───────────┬──────────┐  │  │
│  │  │ Tên    │ Loại     │ Kích     │ Đơn giá   │ Hành     │  │  │
│  │  │ sản    │ sóng     │ thước    │ base      │ động    │  │  │
│  │  │ phẩm   │          │ (cm)     │           │         │  │  │
│  │  ├───────┼──────────┼──────────┼───────────┼──────────┤  │  │
│  │  │ Carton │ B-flute  │ 30×20×15│ 3,000đ   │ [Sửa]   │  │  │
│  │  │ 3 lớp  │ (3 lớp)  │          │           │ [Xóa]   │  │  │
│  │  │ Carton │ BC-flute │ 40×30×20│ 5,500đ   │ [Sửa]   │  │  │
│  │  │ 5 lớp  │ (5 lớp)  │          │           │ [Xóa]   │  │  │
│  │  │ ...    │          │          │           │         │  │  │
│  │  └───────┴──────────┴──────────┴───────────┴──────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
└──────────────────────────────────────────────────────────────┘
```

#### Design Notes

| Aspect | Decision |
|---|---|
| **Add button** | Top right, primary button. Opens M6 (Product Quick Edit Drawer). |
| **Edit/Delete** | Inline actions per row. |
| **Table** | Sortable by name, type, price. |

---

## MODALS & OVERLAYS

---

### M1. Payment Confirmation Modal

**Appears on**: Order placement, Reorder submission.

**Trigger**: User selects "Chuyển khoản" and submits order.

```
┌──────────────────────────────────────────────────────┐
│  💰 Thông tin thanh toán                              │
│                                                        │
│  Vui lòng chuyển khoản đến:                            │
│                                                        │
│  Ngân hàng: Vietcombank                                │
│  Số tài khoản: 0123 456 789                            │
│  Chủ tài khoản: CÔNG TY TNHH BAO BÌ ABC               │
│  Số tiền: 550,000₫                                     │
│  Nội dung: "ORD-001 - {phone}"                         │
│                                                        │
│  Sau khi chuyển, vui lòng tải ảnh xác nhận:            │
│  [Chọn ảnh]  (drag & drop or click)                    │
│                                                        │
│  [Tôi đã chuyển khoản]  [Đóng]                        │
│                                                        │
│  Hoặc: [Thanh toán khi nhận hàng (COD)]                │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Design**: Centered modal, `max-w-md`, `rounded-xl`. Close on backdrop click.

---

### M2. Cancel Order Confirmation Modal

**Appears on**: Order Detail (customer), Order Detail (staff).

**Trigger**: Click "Hủy đơn hàng".

```
┌──────────────────────────────────────────────────────┐
│  ❌ Xác nhận hủy đơn hàng                             │
│                                                        │
│  Bạn có chắc chắn muốn hủy đơn hàng #ORD-001?         │
│  Hành động này không thể hoàn tác.                     │
│                                                        │
│  Lý do hủy:                                            │
│  [◎ Thay đổi nhu cầu                                   │
│   ○ Tìm được nơi khác rẻ hơn                          │
│   ○ Thời gian giao hàng quá lâu                       │
│   ○ Khác: _____________]                              │
│                                                        │
│  [Xác nhận hủy]  [Giữ đơn hàng]                       │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Design**: Danger variant. Red confirm button. Radio group for reason.

---

### M3. Price Change Notification Modal

**Appears on**: Staff Consultation Review.

**Trigger**: Staff enters a final price that differs significantly from AI estimate.

```
┌──────────────────────────────────────────────────────┐
│  ⚠️ Giá khác biệt đáng kể                             │
│                                                        │
│  Giá AI ước tính: 5,000đ/hộp                          │
│  Giá bạn nhập: 4,000đ/hộp (-20%)                      │
│                                                        │
│  Giá chênh lệch hơn 15% so với AI đề xuất.            │
│  Bạn có muốn tiếp tục?                                 │
│                                                        │
│  Lý do thay đổi giá:                                   │
│  [___________________________]                         │
│                                                        │
│  [Tiếp tục]  [Quay lại chỉnh sửa]                     │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Design**: Warning yellow. Shows comparison. Reason field required.

---

### M4. Upload Payment Proof Modal

**Appears on**: Staff Order Detail.

**Trigger**: Staff verifies customer's bank transfer.

```
┌──────────────────────────────────────────────────────┐
│  💳 Xác nhận thanh toán                               │
│                                                        │
│  Phương thức: Chuyển khoản                             │
│  Số tiền: 275,000₫ (50% deposit)                      │
│                                                        │
│  Ảnh xác nhận từ khách hàng:                           │
│  ┌────────────────────────────────────────────────┐   │
│  │  (uploaded image preview)                      │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [Xác nhận đã nhận tiền]  [Yêu cầu gửi lại]          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

### M5. Customer Quick View Modal (Staff)

**Appears on**: Staff Customers page.

**Trigger**: Click "Xem" on a customer row.

```
┌──────────────────────────────────────────────────────┐
│  👤 Nguyễn Văn A                                     │
│                                                        │
│  📞 0901 234 567                                      │
│  ✉️ a@example.com                                    │
│  🏢 Coffee Beans Co.                                  │
│                                                        │
│  ──── Thống kê ────                                    │
│  Tổng đơn: 12  |  Tổng chi: 45,500,000₫              │
│  Đơn gần nhất: 10/09/2026                             │
│                                                        │
│  ──── Đơn hàng gần đây ────                            │
│  #ORD-001  | 550,000₫  | 10/09  | ✅ Giao             │
│  #ORD-002  | 600,000₫  | 08/09  | 🔧 SX               │
│                                                        │
│  [Xem tất cả đơn hàng]  [Đóng]                        │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

### M6. Product Quick Edit Drawer (Staff)

**Appears on**: Staff Products page.

**Trigger**: Click "Thêm sản phẩm" or "Sửa".

```
┌──────────────────────────────────────────────────────┐
│  ← Quay lại    (slide-in drawer from right)          │
│                                                        │
│  {Thêm / Sửa} sản phẩm                                │
│                                                        │
│  Tên sản phẩm: [___________________________]          │
│  Loại sóng: [3 lớp B-flute ▼]                        │
│  Kích thước mặc định: Dài [__] × Rộng [__] × Cao [__]│
│  Đơn giá cơ bản: [_______] đ/hộp                     │
│  Mô tả: [___________________________]                 │
│  Hình ảnh: [Chọn file]                               │
│                                                        │
│  [Lưu]  [Hủy]                                         │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Design**: Slide-in drawer from right, `w-96` or `w-120`. Overlay on backdrop.

---

## SHARED LAYOUTS

---

### L1. Public Layout (Default)

**Used by**: Landing, Consultation, About, Login, Register.

```
┌──────────────────────────────────────────────────────────────┐
│  NAVBAR (sticky, h-16, max-w-7xl mx-auto)                    │
│  [Logo (left)]  [Nav links (center)]  [Auth (right)]         │
│  (border-b, bg-white/80 backdrop-blur-md)                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  MAIN CONTENT (min-h-[calc(100dvh-64px-200px)])              │
│                                                               │
│  (Page-specific content here)                                 │
│                                                               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (border-t, py-12)                                     │
│  [Logo]  [Links]  [Social]  [Copyright]                       │
│  3-column grid: brand + links + contact                       │
└──────────────────────────────────────────────────────────────┘
```

**Navbar variants**:
- **Full**: Logo + nav links + auth buttons (Landing, About)
- **Minimal**: Logo + step indicator (Consultation)
- **Hidden**: No navbar (Login, Register)

---

### L2. Customer Dashboard Layout

**Used by**: Dashboard, My Orders, Order Detail, History, Reorder, Profile.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (sticky, h-16, border-b)                             │
│  [Logo]  [Dashboard] [My Orders] [History] [Profile] [👤]   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  ↔  MAIN CONTENT (max-w-7xl mx-auto, px-4, py-8)             │
│                                                               │
│  (Page-specific content)                                      │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  FOOTER (minimal, border-t, py-6)                             │
│  [Copyright]  [Hotline]                                       │
└──────────────────────────────────────────────────────────────┘
```

**Mobile**: Header becomes hamburger menu. Footer is minimal.

---

### L3. Staff Layout (Sidebar)

**Used by**: All staff pages.

```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────────┬─────────────────────────────────────────┐  │
│  │  SIDEBAR     │  MAIN CONTENT                           │  │
│  │  (w-64,      │  (flex-1, overflow-y-auto)              │  │
│  │   fixed,     │                                         │  │
│  │   border-r,  │  (Page-specific content)                │  │
│  │   h-screen,  │                                         │  │
│  │   bg-white)  │                                         │  │
│  │              │                                         │  │
│  │  [Logo]      │                                         │  │
│  │  ─────────   │                                         │  │
│  │  [📊 Tổng    │                                         │  │
│  │   quan]      │                                         │  │
│  │  [📋 Tư vấn] │                                         │  │
│  │  [📦 Đơn     │                                         │  │
│  │   hàng]      │                                         │  │
│  │  [👥 Khách   │                                         │  │
│  │   hàng]      │                                         │  │
│  │  [📦 Sản     │                                         │  │
│  │   phẩm]      │                                         │  │
│  │  ─────────   │                                         │  │
│  │  [👤 Admin]  │                                         │  │
│  │  [🚪 Đăng    │                                         │  │
│  │   xuất]      │                                         │  │
│  └──────────────┴─────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Mobile**: Sidebar collapses to hamburger overlay. Full-width content.

---

## UNIVERSAL COMPONENTS

### Header / Navbar

| Detail | Value |
|---|---|
| Height | `h-16` (64px) |
| Background | `bg-white/80 backdrop-blur-md` |
| Border | `border-b border-gray-200` |
| Z-index | `z-50` |
| Container | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Logo | `text-xl font-bold text-gray-900` |
| Nav links | `text-sm font-medium text-gray-600 hover:text-gray-900` |
| Auth buttons | Primary: `bg-blue-600`, Secondary: ghost |

### Footer

| Detail | Value |
|---|---|
| Padding | `py-12 md:py-16` |
| Border | `border-t border-gray-200` |
| Container | `mx-auto max-w-7xl px-4` |
| Grid | Default: `grid grid-cols-1 md:grid-cols-3 gap-8` |
| Text | `text-sm text-gray-500` |
| Logo | `text-lg font-bold text-gray-900` |

### Sidebar (Staff)

| Detail | Value |
|---|---|
| Width | `w-64` (desktop), full overlay (mobile) |
| Background | `bg-white` |
| Border | `border-r border-gray-200` |
| Nav item | `px-4 py-2 text-sm font-medium rounded-md` |
| Nav item (active) | `bg-blue-50 text-blue-700` |
| Nav item (default) | `text-gray-600 hover:bg-gray-50 hover:text-gray-900` |
| Z-index | `z-40` |

### Status Badge

See `UI_RULES.md` Section 3.7.

### Order Status Timeline

| Detail | Value |
|---|---|
| Orientation | Vertical (default), Horizontal (compact) |
| Completed step | Green circle + checkmark, `bg-emerald-600` |
| Current step | Blue circle, `bg-blue-600` |
| Future step | Gray circle, `bg-gray-200` |
| Connecting line | `w-px h-8 bg-gray-200` (vertical), `h-px w-12 bg-gray-200` (horizontal) |
| Label | `text-sm font-medium` |
| Date | `text-xs text-gray-500` |

### Empty State

See `UI_RULES.md` Section 3.8.

### Error State

See `UI_RULES.md` Section 3.8.

### Loading Skeleton

See `UI_RULES.md` Section 3.8.

---

## Appendix: Screen Mapping to Features

| Screen | Route | Feature Module | Data File |
|---|---|---|---|
| Landing | `/` | — (static) | — |
| Consultation | `/consultation` | `features/consultation/` | `lib/data/consultations.ts` |
| AI Result | `/consultation?step=result` | `features/consultation/` | `lib/data/consultations.ts` |
| Mockup | `/consultation?step=mockup` | `features/consultation/` | `lib/data/consultations.ts` |
| Order (standalone) | `/order` | `features/orders/` | `lib/data/orders.ts` |
| About | `/about` | — (static) | — |
| Login | `/login` | `features/auth/` | Supabase Auth |
| Register | `/register` | `features/auth/` | Supabase Auth |
| Customer Dashboard | `/dashboard` | `features/orders/` | `lib/data/orders.ts` |
| My Orders | `/dashboard/orders` | `features/orders/` | `lib/data/orders.ts` |
| Order Detail | `/dashboard/orders/[id]` | `features/orders/` | `lib/data/orders.ts` |
| Order History | `/dashboard/history` | `features/orders/` | `lib/data/orders.ts` |
| Reorder | `/dashboard/reorder` | `features/orders/` | `lib/data/orders.ts` |
| Profile | `/dashboard/profile` | `features/auth/` | `lib/data/profiles.ts` |
| Staff Dashboard | `/staff` | `features/staff/` | `lib/data/orders.ts` |
| Consultations | `/staff/consultations` | `features/staff/` | `lib/data/consultations.ts` |
| Consultation Review | `/staff/consultations/[id]` | `features/staff/` | `lib/data/consultations.ts` |
| Staff Orders | `/staff/orders` | `features/staff/` | `lib/data/orders.ts` |
| Staff Order Detail | `/staff/orders/[id]` | `features/staff/` | `lib/data/orders.ts` |
| Customers | `/staff/customers` | `features/staff/` | `lib/data/profiles.ts` |
| Products | `/staff/products` | `features/products/` | `lib/data/products.ts` |

---

## Appendix: Status → Vietnamese Display Mapping

| Status | Customer display | Badge color |
|---|---|---|
| `pending` | ⏳ Đang chờ xác nhận | Yellow |
| `staff_review` | 👀 Staff đang xem xét | Blue |
| `confirmed` | ✅ Đã xác nhận | Green |
| `deposit_paid` | 💰 Đã đặt cọc | Blue |
| `production` | 🔧 Đang sản xuất | Blue |
| `completed` | 📦 Hoàn thành | Green |
| `delivered` | ✅ Đã giao | Emerald |
| `cancelled` | ❌ Đã hủy | Red |