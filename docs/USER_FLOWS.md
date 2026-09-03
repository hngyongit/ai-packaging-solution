# User Flows & Navigation — AI Carton Packaging Solution

> Core flows for MVP. Designed for clarity, minimal steps, and customer comfort.

---

## 1. Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SITE MAP (MVP)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PUBLIC (no auth required)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Landing Page (/)                                            │   │
│  │  ├── Hero Section (CTA: Start Consultation)                  │   │
│  │  ├── How It Works (3-step: Input → AI → Order)             │   │
│  │  ├── Product Catalog (standard boxes)                       │   │
│  │  ├── Factory Tour (trust building — images, video)          │   │
│  │  └── FAQ / Contact                                          │   │
│  │                                                             │   │
│  │  Consultation (/consultation)                                │   │
│  │  ├── Step 1: Product Specs Input                            │   │
│  │  ├── Step 2: AI Recommendation                              │   │
│  │  └── Step 3: Mockup Preview (optional)                     │   │
│  │                                                             │   │
│  │  About (/about) — Factory info, trust page                   │   │
│  │  Login (/login)                                              │   │
│  │  Register (/register)                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AUTHENTICATED — Customer                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Dashboard (/dashboard)                                      │   │
│  │  ├── My Orders (list + status tracking)                     │   │
│  │  ├── Order Detail (/dashboard/orders/[id])                  │   │
│  │  ├── Order History                                           │   │
│  │  ├── Reorder (/dashboard/reorder)                           │   │
│  │  └── Profile (/dashboard/profile)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  AUTHENTICATED — Staff (Sales / Admin)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Staff Dashboard (/staff)                                    │   │
│  │  ├── Overview (stats: new consultations, pending orders)    │   │
│  │  ├── Consultations (/staff/consultations)                   │   │
│  │  │   └── Review → Confirm price → Convert to order         │   │
│  │  ├── Orders (/staff/orders)                                 │   │
│  │  │   └── Update status, manage                              │   │
│  │  ├── Customers (/staff/customers)                           │   │
│  │  └── Products (/staff/products) — manage catalog            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Flow 1 — AI Consultation → Order

### 2.1 Flow Diagram

```
  CUSTOMER                              SYSTEM                          STAFF
    │                                      │                              │
    ├─ Visit landing page                  │                              │
    │                                      │                              │
    ├─ Click "Start Consultation"          │                              │
    │                                      │                              │
    ▼                                      │                              │
  ┌─────────────────────┐                  │                              │
  │  STEP 1: Spec Input │                  │                              │
  │                     │                  │                              │
  │ • Product type      │                  │                              │
  │ • Dimensions (L/W/H)│                  │                              │
  │ • Weight            │                  │                              │
  │ • Quantity needed   │                  │                              │
  │ • Printing? (Y/N)   │                  │                              │
  │ • Logo upload (opt) │                  │                              │
  │ • Contact info      │                  │                              │
  │   (name, phone,     │                  │                              │
  │    email, company)  │                  │                              │
  └─────────┬───────────┘                  │                              │
            │                              │                              │
            │  POST /api/ai/recommend      │                              │
            ├──────────────────────────────►│                              │
            │                              │                              │
            │                              ├─ Validate input              │
            │                              ├─ Call OpenAI API             │
            │                              ├─ Save consultation          │
            │                              │                              │
            │  Return recommendation       │                              │
            │◄──────────────────────────────┤                              │
            │                              │                              │
            ▼                              │                              │
  ┌──────────────────────────┐             │                              │
  │  STEP 2: AI Result       │             │                              │
  │                          │             │                              │
  │  ┌────────────────────┐  │             │                              │
  │  │ ✅ Recommended Box  │  │             │                              │
  │  │ • Box type: 3-layer │  │             │                              │
  │  │ • Dimensions:       │  │             │                              │
  │  │   30x20x15cm        │  │             │                              │
  │  │ • Material: B-flute │  │             │                              │
  │  │ • Est. price: VND   │  │             │                              │
  │  │ • Tips: "Với trọng   │  │             │                              │
  │  │   lượng 500g, bạn   │  │             │                              │
  │  │   nên dùng carton   │  │             │                              │
  │  │   3 lớp B-flute..." │  │             │                              │
  │  └────────────────────┘  │             │                              │
  │                          │             │                              │
  │  ┌────────────────────┐  │             │                              │
  │  │  [View Mockup]     │  │             │                              │
  │  │  [Place Order]     │  │             │                              │
  │  │  [Save for Later]  │  │             │                              │
  │  └────────────────────┘  │             │                              │
  └──────────┬───────────────┘             │                              │
             │                             │                              │
             │  (Optional)                 │                              │
             ├─► STEP 3: Mockup Preview    │                              │
             │   (Upload logo, select      │                              │
             │    position, AI renders)     │                              │
             │                             │                              │
             │  "Place Order"              │                              │
             ├─────────────────────────────►│                              │
             │                             │                              │
             ▼                             │                              │
  ┌──────────────────────┐                │                              │
  │  Order Form          │                │                              │
  │                      │                │                              │
  │  • Quantity          │                │                              │
  │  • Delivery address  │                │                              │
  │  • Phone / Email     │                │                              │
  │  • Notes             │                │                              │
  │  • Payment method    │                │                              │
  │    (COD / Transfer)  │                │                              │
  │                      │                │                              │
  │  [Submit Order]      │                │                              │
  └──────────┬───────────┘                │                              │
             │                             │                              │
             │  POST /api/orders           │                              │
             ├─────────────────────────────►│                              │
             │                             │                              │
             │  Created: status=pending    │                              │
             │◄─────────────────────────────┤                              │
             │                             │                              │
             ▼                             │                              │
  ┌──────────────────────┐                │                              │
  │  ✓ Order Placed!     │                │                              │
  │                      │                │                              │
  │  "Your order #ORD-   │                │                              │
  │   001 is pending     │                │                              │
  │   staff confirmation."│               │                              │
  │                      │                │                              │
  │  • View order detail │                │                              │
  │  • Track status      │                │                              │
  └──────────────────────┘                │                              │
                                          │                              │
                                          │  Notify staff               │
                                          ├─────────────────────────────►│
                                          │                              │
                                          │                    ┌─────────┴─────────┐
                                          │                    │  Staff reviews     │
                                          │                    │  consultation +    │
                                          │                    │  confirms price,   │
                                          │                    │  updates status    │
                                          │                    │  → "confirmed"     │
                                          │                    └───────────────────┘
```

### 2.2 Form Fields — Spec Input

| Field | Type | Required | Notes |
|---|---|---|---|
| Product type | Text | ✅ | "Coffee beans", "Cosmetics", etc. |
| Product length | Number (cm) | ✅ | |
| Product width | Number (cm) | ✅ | |
| Product height | Number (cm) | ✅ | |
| Product weight | Number (grams) | ✅ | |
| Items per box | Number | ❌ | How many units per box |
| Quantity needed | Number | ✅ | Number of boxes |
| Need printing? | Yes/No | ✅ | Toggle |
| Logo / design file | Upload | ❌ | If printing = yes |
| Printing notes | Text | ❌ | Color, position |
| Full name | Text | ✅ | |
| Phone number | Text | ✅ | |
| Email | Text | ✅ | |
| Company name | Text | ❌ | B2B |
| Delivery address | Text | ✅ | For order |
| Notes | Textarea | ❌ | |

---

## 3. Order Status State Machine

```
                        ┌──────────┐
                        │  PENDING │  ← Customer submits order
                        └────┬─────┘
                             │
                    Staff confirms
                             │
                     ┌───────▼────────┐
                     │  STAFF_REVIEW  │  ← Staff checks specs & price
                     │  (estimate)    │
                     └───────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CONFIRMED     │  ← Staff confirms price
                    │  (waiting       │     Customer agrees
                    │   deposit if    │
                    │   over threshold)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     (if over    (if COD)    │
     threshold)   │              │
              │              │              │
       ┌──────▼──────┐       │              │
       │ DEPOSIT_PAID│       │              │
       │ (partial)   │       │              │
       └──────┬──────┘       │              │
              │              │              │
              └──────┬───────┘              │
                     │                      │
              ┌──────▼──────┐               │
              │ PRODUCTION  │◄──────────────┘
              │ (in factory)│
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  COMPLETED  │  ← Production done
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  DELIVERED  │  ← Customer received
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  CANCELLED  │  ← Any stage
              └─────────────┘
```

### Status descriptions for customer display

| Status | Customer sees | Action needed |
|---|---|---|
| `pending` | ⏳ **Đang chờ xác nhận** | Staff will review your order |
| `staff_review` | 👀 **Staff đang xem xét** | Staff is checking specs & price |
| `confirmed` | ✅ **Đã xác nhận** | Waiting for production |
| `deposit_paid` | 💰 **Đã đặt cọc** | (if applicable) |
| `production` | 🔧 **Đang sản xuất** | Track progress |
| `completed` | 📦 **Hoàn thành** | Ready for delivery/pickup |
| `delivered` | ✅ **Đã giao** | Thank you! |
| `cancelled` | ❌ **Đã hủy** | — |

---

## 3.B Consultation Status State Machine

Consultations have their own status flow, separate from orders:

```
pending → ai_processed → staff_reviewed → quoted → converted → closed
```

| Status | Meaning | Who sets it |
|---|---|---|
| `pending` | Customer submitted form, AI not yet processed | System (on submit) |
| `ai_processed` | AI has returned recommendation, waiting for staff | System (AI callback) |
| `staff_reviewed` | Staff has reviewed the AI recommendation | Staff |
| `quoted` | Staff has sent final price quote to customer | Staff |
| `converted` | Customer placed an order from this consultation | System (on order create) |
| `closed` | Consultation closed (order delivered or cancelled) | Staff |

**Anonymous consultations**: If customer is not logged in, the consultation is saved with `customer_id = NULL`. When they later register or place an order, the consultation is linked via their phone/email.

---

## 4. Staff Flow — Review & Confirm

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAFF DASHBOARD                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ New Consults  │  │ Pending     │  │ In           │          │
│  │     12        │  │ Orders   8   │  │ Production 3 │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Recent Consultations                                     │  │
│  │                                                           │  │
│  │  Customer  │ Product │ AI Reco  │ Est. Price │ Action    │  │
│  │  ├─────────┼─────────┼──────────┼────────────┼───────────┤ │
│  │  │ Coffee  │ 30x20   │ 3-layer  │ 5,000đ/box │ [Review]  │ │
│  │  │ Cosmetics│ 15x10   │ 3-layer  │ 3,000đ/box │ [Review]  │ │
│  │  │ ...     │         │          │            │           │ │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Staff review screen

```
┌────────────────────────────────────────────────────────────────┐
│  Review Consultation — Coffee Beans Co.                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer Info                        AI Recommendation          │
│  ┌────────────────────┐              ┌──────────────────────┐  │
│  │ Name: Nguyen Van A │              │ Box: 3-layer carton  │  │
│  │ Phone: 090...      │              │ Size: 30x20x15 cm    │  │
│  │ Email: ...         │              │ Material: B-flute    │  │
│  │ Company: ...       │              │ Est. price: 5,000đ   │  │
│  └────────────────────┘              │ Confidence: 92%      │  │
│                                       └──────────────────────┘  │
│  Product Specs                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Coffee beans, 500g/bag, 10 bags/box                     │  │
│  │ Dimensions: 25x15x10 cm, Weight: 5kg                    │  │
│  │ Printing: Logo + "Premium Coffee" on front              │  │
│  │ Logo: (uploaded file)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Staff Confirmation                                       │  │
│  │                                                           │  │
│  │  Final price: [___________] đ/box                        │  │
│  │  Min quantity: [___________]                              │  │
│  │  Production time: [___________] days                      │  │
│  │  Notes: [_________________________________________]       │  │
│  │                                                           │  │
│  │  [Confirm & Send to Customer]  [Request Changes]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Order Tracking — Customer View

```
┌────────────────────────────────────────────────────────────────┐
│  My Orders                                    [New Consultation]│
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  #ORD-001 │ Coffee Beans Co. │ 500 boxes │ 2,500,000đ    │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  ✅ Đã xác nhận  ──►  🔧 Đang sản xuất ──► 📦     │  │ │
│  │  │                    ████████░░░░░░░░░░  60%         │  │ │
│  │  │                    Expected: 15/09/2026             │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │  [View Detail]  [Reorder]                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  #ORD-002 │ Cosmetics Box │ 200 boxes │ 600,000đ         │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  📦 Hoàn thành — 10/09/2026                         │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │  [View Detail]  [Reorder]  [Leave Feedback]                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Reorder Flow

```
  CUSTOMER                          SYSTEM
     │                                │
     ├─ "Reorder" from history        │
     │                                │
     ├─ Opens order detail            │
     │  (all specs pre-filled)        │
     │                                │
     ├─ Change quantity (if needed)   │
     ├─ Confirm contact info          │
     ├─ Select payment method         │
     │                                │
     ├─ [Submit Reorder]              │
     │                                │
     ├───────────────────────────────►│
     │                                ├─ Create new order
     │                                │  with same specs
     │  Created: status=pending       │
     │◄───────────────────────────────┤
     │                                │
     ▼                                │
   "Order placed! Same specs as
    your previous order."
```

---

## 7. Customer Dashboard — MVP Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Dashboard                                [New Consultation]    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Total Orders │  │  In Progress │  │  Saved       │         │
│  │      12       │  │       3      │  │  Products  5 │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Quick Actions                                             │ │
│  │  [New Consultation]  [Reorder]  [Track Order]             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Recent Orders (last 5)                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  #ORD-001 │ ... │ Status │ Date │ Amount │ Action        │ │
│  │  #ORD-002 │ ... │ Status │ Date │ Amount │ Action        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Navigation:                                                    │
│  [Dashboard] [My Orders] [Order History] [Profile]             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Payment Flow

```
  CUSTOMER                          SYSTEM
     │                                │
     ├─ Select payment method:        │
     │  ┌─── COD ─────────────────┐   │
     │  │ Pay on delivery          │   │
     │  │ No extra fee             │   │
     │  └─────────────────────────┘   │
     │                                │
     │  ┌─── Bank Transfer ────────┐  │
     │  │ Pay full when ordering   │  │
     │  │ Or: deposit 50% if       │  │
     │  │ order > 5,000,000đ       │  │
     │  └─────────────────────────┘  │
     │                                │
     │  If transfer:                  │
     │  ├─ Show bank account info     │
     │  ├─ Upload payment proof       │
     │  │  (screenshot, photo)        │
     │  │                                │
     │  ├─ Upload ───────────────────►│
     │                                ├─ Staff verifies
     │                                ├─ Updates status
     │  Status updated: "paid"        │
     │◄───────────────────────────────┤
```

---

## 9. UI Design Principles for This Project

Based on the target customers (B2B, online sellers, non-tech-savvy):

| Principle | Implementation |
|---|---|
| **Minimal steps** | Consultation form: 1 page, not multi-step wizard |
| **Clear CTAs** | Every page has 1 primary action, big buttons |
| **Visual feedback** | Status shown as progress bars, not text codes |
| **Mobile-first** | All flows work on phone (Shopee sellers) |
| **Trust signals** | Factory photos, real order counts, customer reviews |
| **No jargon** | "3 lớp carton" not "B-flute single-wall" (or explain both) |
| **Help everywhere** | Tooltips, example values, "Why this recommendation?" |
| **Fast** | No unnecessary steps, instant AI response |

---

## 10. Recommended Pages for MVP

| Priority | Page | Why |
|---|---|---|
| **P0** | Landing page | First impression, drive consultation |
| **P0** | Consultation form | Core value prop |
| **P0** | AI recommendation result | Show AI value |
| **P0** | Order placement | Revenue |
| **P0** | Staff dashboard | Operations |
| **P1** | Login / Register | Account management |
| **P1** | Customer dashboard | Track orders |
| **P1** | Order tracking | Transparency |
| **P1** | Order history | Reorder support |
| **P2** | Mockup preview | Differentiator |
| **P2** | Reorder | Customer retention |
| **P2** | About / Factory | Trust building |
| **P3** | Payment screens | If COD, just show account info |
| **P3** | Product catalog | Standard boxes |