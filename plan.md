# Plan: Hoàn Thiện Consultation Pipeline + Gaps Tất Cả Devs

## Context

Dự án **AI Carton Packaging Solution**. Sau sprint đầu, cần kéo dài pipeline tư vấn (scenario B: consultation → staff review → convert → order), đồng thời fix các gaps còn lại của từng dev. Tổng ~34h task.

### Hiện trạng thực tế (đã kiểm chứng code trên đĩa):

| Dev | Đã hoàn thành | Còn lại | Ghi chú đặc biệt |
|-----|--------------|---------|------------------|
| **A** | ~95% ✅ | Nút "Nhờ staff xem xét", xóa dead code | Core AI/mocking/dieline hoạt động |
| **B** | ~80% ✅ | Rate limit, delivery fee, VAT, payment verify, wiring modals | Cần extend consultation data trong ORDER_SELECT |
| **C** | ~35% ⚠️ | Middleware auth, consultation pages, data funcs, dashboard, customers | ❗ C6/C7/C9 **ĐÃ CÓ CODE** — chỉ là stub cũ ghi sai |
| **D** | ~70% 🟡 | DB types (sau), picsum images, feature flags, wiring D6–D8 | Modals D6/D7/D8 chờ staff pages |

---

## Flow Mục Tiêu

```
┌─────────────────────── Customer Side ──────────────────────┐
│                                                              │
│  Điền form @ /consultation → POST /api/ai/recommend        │
│         ↓                                                  │
│  AI phân tích → recommendation card                         │
│         ↓                                                  │
│  Khách có 3 lựa chọn:                                      │
│    ├─ [Thêm vào giỏ / Mua ngay] → checkout → tạo ORDER      │
│    ├─ [Lưu làm mẫu] → saved_products → dùng sau             │
│    └─ [🆕 Nhờ nhân viên xem giúp] → gửi review request 🔵   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────── Staff Side ─────────────────────────┐
│                                                              │
│  Dashboard (C3)                                              │
│    → Thống kê: chờ review, đang báo giá, đã chuyển thành đơn│
│                                                              │
│  Consultations List (C4)                                     │
│    → Danh sách tất cả consultations pending/staff_reviewed   │
│    → Filter theo status, tìm kiếm                            │
│                                                              │
│  Consultation Review (C5)                                    │
│    → Xem: client input (product_description, notes,…)       │
│    → Xem: AI recommendation card                             │
│    → Thêm sales_notes/phản hồi                               │
│    → Chạy transition:                                        │
│       • "Đồng ý đề xuất" → ai_processed → staff_reviewed     │
│       • "Tạo báo giá" → quoted                               │
│       • "Chuyển thành đơn" → converted → CALL CREATE ORDER   │
│       • "Từ chối/Không phù hợp" → closed                     │
│                                                              │
│  Orders Detail (C7) — ĐÃ CÓ                                  │
│    → Hiển thị thêm consultation context                      │
│    → Connect PriceChangeModal (D6) khi chốt giá              │
│    → Connect UploadProofModal (D7) cho payment proofs        │
│                                                              │
│  Customers (C8)                                              │
│    → Danh sách khách + stats                                 │
│    → CustomerQuickViewModal (D8)                              │
│                                                              │
│  Products (C9) — ĐÃ CÓ                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Blocking Infrastructure (Day 1) ⏱ 8h

### P1-1: Middleware Role Guard (C11)

**File**: `src/middleware.ts`
**Vấn đề**: Chỉ check `auth.uid()`, không check role → customer đăng nhập vẫn vào được `/staff/*`

**THAY ĐỔI**:

Mở `src/middleware.ts` hiện tại, bổ sung trước return redirect unauthenticated:

```typescript
// Sau khi lấy profile từ cookie
const profile = await getAuthenticatedProfile(request)

if (pathname.startsWith('/staff') && (!profile || !['sales', 'admin'].includes(profile.role))) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

Function `getAuthenticatedProfile()` đã tồn tại tại `src/lib/data/profile.ts`:
```typescript
export async function getAuthenticatedProfile(request: Request): Promise<Profile | null>
// Returns { id, role, full_name, phone } hoặc null nếu không auth
```

### P1-2: Consultations Data Functions

**File mới**: `src/lib/data/consultations-list.ts`
**Tách riêng** khỏi `consultations.ts` (chỉ giữ CRUD base ở file cũ)

```typescript
// --- types ---
export type ConsultationListFilter = {
  page?: number
  perPage?: number
  status?: string
  statuses?: string[]
  assignedTo?: string  // undefined = all
  search?: string
  sortBy?: 'created_at' | 'status' | 'contact_name'
  sortOrder?: 'asc' | 'desc'
}

export type ConsultationRowWithCustomer = {
  id: string
  status: string
  product_type: string
  product_weight: number | null
  desired_quantity: number | null
  has_printing: boolean | null
  print_faces: string | null
  logo_url: string | null
  notes: string | null
  purchase_frequency: string | null
  delivery_deadline: string | null  // CHECK if column exists
  reference_image_url: string | null  // CHECK if column exists
  preferred_layers: number | null
  flute_type: string | null
  mockup_url: string | null
  dieline_url: string | null
  ai_recommendation: AIRecommendation | null
  ai_suggested_product_id: string | null
  ai_suggested_dimensions: { length: number; width: number; height: number } | null
  ai_suggested_layers: number | null
  ai_confidence: number | null
  ai_processed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields:
  customer_id: string | null
  customer_name: string | null          // profiles.full_name
  customer_phone: string | null         // profiles.phone
  customer_email: string | null         // profiles.email
  assigned_to: string | null            // profiles.id
  assigned_name: string | null          // profiles.full_name (assigned)
  sales_notes: string | null
  mockup_requests: number | null
}

// --- functions ---

/** Lấy danh sách để staff xem */
export function listConsultations(
  filter: ConsultationListFilter
): Promise<{ data: ConsultationRowWithCustomer[]; pagination: { total; page; perPage; totalPages } }>

/** Lấy chi tiết consultation + join customer info */
export function getConsultationFull(id: string): Promise<ConsultationRowWithCustomer | null>

/** Chuyển status với CAS (optimistic concurrency) */
export function updateConsultationStatus(
  id: string,
  fromStatus: string,
  toStatus: string
): Promise<void>
// UPDATE SET status = toStatus WHERE id AND status = fromStatus
// throw 409 nếu conflict

/** Gán nhân viên */
export function assignConsultation(id: string, userId: string): Promise<void>

/** Thêm sales notes */
export function addSalesNotes(id: string, notes: string): Promise<void>

/** Convert consultation thành order (business action quan trọng) */
export function convertConsultationToOrder(
  consultationId: string,
  orderId: string  // ID của order vừa tạo
): Promise<void>
// UPDATE SET status = 'converted', assigned_to = NULL WHERE id = consultationId AND status IN ('quoted', 'staff_reviewed')
```

**Query pattern** (PostgREST Supabase admin client):
```typescript
// Trong listConsultations - dùng .select() với JOIN manual qua PostgREST relations:
import('consultations!outer(*)') 
// Join profiles cho customer và assigned_to fields

// Filter pattern giống listOrders():
if (status) query.eq('status', status)
if (search) query.or(`product_type.ilike.%${term}%,customer_name.ilike.%${term}%`)
```

### P1-3: Customers Data Functions

**File mới**: `src/lib/data/customers.ts`

```typescript
export function listCustomers(
  page?: number, perPage?: number, search?: string
): Promise<{ data: CustomerSummary[]; pagination }>

export function getCustomerDetail(customerId: string): Promise<CustomerDetail | null>

export function getCustomerStats(customerId: string): Promise<{
  totalOrders: number
  totalSpent: number
  lastOrderAt: string | null
}>
```

**Type**:
```typescript
type CustomerSummary = {
  id: string
  full_name: string
  phone: string
  email: string
  company_name: string | null
  address: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
}
```


### P1-4: Database Types Complete Coverage (D12) -- DÙNG SAU

**File**: `src/types/database.ts` (hiện tại 80 dòng, chỉ cover profiles + products)
**⚠️ KHÔNG BLOCKING — làm sau khi các page/staff functionality đã ổn**

Code đang chạy được vì dev dùng `Record<string, unknown>` và custom types local. Chỉ giảm developer experience + ít bảo vệ khi refactoring.

> **Action** (chạy sau): Generate đầy đủ từ migration files (`supabase/migrations/*.sql`). Bao gồm 11 bảng: profiles, products, consultations, orders, order_items, order_status_history, saved_products, reorder_templates, box_styles, cart_items, customer_addresses. Enum: order_status, payment_status, payment_method, consultation_status, box_type, product_category.

---

## Phase 2: Frontend — Consultation Flow Extension (Dev A) ⏱ 6h

### P2-1: Thêm Nút "Nhờ Nhân Viên Xem Giúp"

**Files cần sửa**:
- `src/app/(public)/consultation/consultation-result.tsx`
- `src/app/(public)/consultation/consultation-ready-state.tsx`

**Thay đổi**: Thêm button giữa `PrintMockupPanel` và `CustomCartActions`:

```tsx
{/* Hành động 1: Gửi nhân viên xem xét */}
<Button variant="outline" className="w-full" onClick={handleRequestReview}>
  <UserRoundPen className="h-4 w-4 mr-2" />
  Nhờ nhân viên xem giúp
</Button>

{/* Hành động 2: Tạo đơn hàng (group) */}
<CustomCartActions ... />

{/* Hành động 3: Lưu làm mẫu */}
<SaveAsTemplateButton ... />
```

**Handler `handleRequestReview`**:
```typescript
async function handleRequestReview() {
  if (!consultationId) return
  try {
    await fetch(`/api/consultations/${consultationId}/request-review`, {
      method: 'POST',
    })
    // Show success toast + update status badge
    setStatus('review_requested')
  } catch {
    setError('Không thể gửi yêu cầu. Vui lòng thử lại.')
  }
}
```

### P2-2: Backend Route — Request Review

**File mới**: `src/app/api/consultations/[id]/request-review/route.ts`

```typescript
POST /api/consultations/:id/request-review
// No auth needed (public-facing, như /api/ai/recommend)
// Updates consultation status to 'pending_review'
// CHECK constraint: cần thêm value này vào DB CHECK
// Current: ('pending' | 'ai_processed' | 'staff_reviewed' | 'quoted' | 'converted' | 'closed')
// Need: ADD 'pending_review'
```

**Migration cần thêm** (nếu chưa có `pending_review` status):
```sql
-- supabase/migrations/YYYY_add_pending_review_status.sql
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
ALTER TABLE consultations ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('pending', 'ai_processed', 'pending_review', 'staff_reviewed', 'quoted', 'converted', 'closed'));
```

**Hoặc** nếu không muốn sửa DB constraint:
- Dùng `ai_processed` làm proxy — khi khách click "Nhờ staff xem", gọi một endpoint riêng cập nhật consultation field `review_requested = true` mà không đổi status (vì `ai_processed` đã đúng là "AI đã xong").
- Staff filter queries trên column `review_requested == true AND status == 'ai_processed'`.

**Option thứ 2 an toàn hơn** — không cần migration.

### P2-3: Consultation Result UI Update

Sau khi click "Nhờ nhân viên xem giúp", hiện visual feedback:
- Button đổi text thành "✅ Đã gửi yêu cầu review"
- Hiện thêm note: "Nhân viên sẽ phản hồi trong vòng 24h. Bạn vẫn có thể tạo đơn bất cứ lúc nào."
- Giữ nguyên nút "Thêm vào giỏ" và "Mua ngay" — customer vẫn có thể đổi ý

### P2-4: Xóa Dead Code

**File xóa**: `src/app/api/consultations/route.ts` (501 stub, không ai dùng)

Consultations creation đi qua `/api/ai/recommend`. Không có GET/POST endpoint nào khác cho consultations route này.

---

## Phase 3: Staff Pages (Dev C) ⏱ 14h

### P3-1: Staff Dashboard (C3) — Thay Stub

**File**: `src/app/(staff)/staff/page.tsx`

Thay `<UnderDevelopmentPage />` bằng dashboard real UI:

```tsx
export default async function StaffDashboardPage() {
  // Server component, fetch data parallel
  const profile = await getCurrentProfile()
  
  // Parallel fetches:
  const [pendingReviews, todayOrders, monthRevenue, openIssues] = await Promise.all([
    listConsultations({ statuses: ['ai_processed', 'pending_review'], sortBy: 'created_at' }),
    listOrders(profile, { status: 'pending', sortBy: 'created_at' }),
    // Simple SUM(total_amount) for current month
    getMonthRevenue(), // cần new helper
    countOpenConsultations(), // chưa converted/closed
  ])
  
  return (
    <div className="space-y-6">
      {/* Stats cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Chờ xem xét" value={pendingReviews.pagination.total} href="/staff/consultations?status=ai_processed" icon={MessageSquare} color="amber" />
        <StatCard title="Đơn hôm nay" value={todayOrders.data.length} href="/staff/orders?date=today" icon={Package} color="blue" />
        <StatCard title="Doanh thu tháng" value={formatCurrency(monthRevenue)} icon={TrendingUp} color="emerald" />
        <StatCard title="Vấn đề mở" value={openIssues} icon={AlertCircle} color="red" />
      </div>
      
      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/staff/consultations" className={btn(...)}>Quản lý tư vấn</Link>
        <Link href="/staff/orders" className={btn(...)}>Xử lý đơn hàng</Link>
        <Link href="/staff/products" className={btn(...)}>Quản lý sản phẩm</Link>
      </div>
    </div>
  )
}
```

**Pattern component reuse**: Sử dụng `Card`, `CardContent` từ `@/components/ui/card`, `buttonVariants` từ `@/components/ui/button`.

### P3-2: Consultations List Page (C4) — Replace Stub

**File**: `src/app/(staff)/staff/consultations/page.tsx`

Table layout tương tự orders list page (C6 — đã có code mẫu):

```tsx
export default async function StaffConsultationsPage({ searchParams }) {
  const profile = await getCurrentProfile()
  assertStaff(profile)
  
  const { data: consultations, pagination } = await listConsultations(filterFromSearchParams)
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Tư vấn</h1>
        <p>Duyệt và hỗ trợ khách hàng qua tư vấn.</p>
      </header>
      
      {/* Filter pills */}
      <div className="flex gap-2">
        <FilterPill href="?status=pending" label="Tất cả" />
        <FilterPill href="?status=ai_processed" label="Chờ xem xét" />
        <FilterPill href="?status=quoted" label="Đang báo giá" />
        <FilterPill href="?status=converted" label="Đã chuyển thành đơn" />
      </div>
      
      {/* Search bar */}
      <SearchInput placeholder="Tìm theo sản phẩm, tên..." />
      
      {/* Table */}
      <DataTable>
        columns: Mã tư vấn | Sản phẩm | Liên hệ | Trạng thái | Người xử lý | Tạo lúc | Xem
      </DataTable>
      
      {/* Pagination */}
      <Pagination pagination={pagination} />
    </div>
  )
}
```

**Column hành động**: Link đến `/staff/consultations/[id]` per row.

### P3-3: Consultation Review Detail Page (C5) — Replace Stub

**File**: `src/app/(staff)/staff/consultations/[id]/page.tsx`

Layout 2-column (giống orders detail):

**Left column** — Thông tin tư vấn:
```tsx
{/* Header */}
<h1>Tư vấn #{consultation.id.slice(0, 8)}</h1>
<StatusBadge status={consultation.status} />

{/* Client Input Section */}
<Card>
  <CardTitle>Yêu cầu của khách</CardTitle>
  <SpecRow label="Sản phẩm" value={consultation.product_type} />
  <SpecRow label="Kích thước" value={`${d} × ${w} × ${h} cm`} />
  <SpecRow label="Trọng lượng" value={`${weight}g`} />
  <SpecRow label="Số lượng" value={`${quantity} thùng`} />
  <SpecRow label="In ấn" value={hasPrinting ? 'Có' : 'Không'} />
  {consultation.notes && <blockquote>{consultation.notes}</blockquote>}
</Card>

{/* AI Recommendation */}
<Card>
  <CardTitle>Tư vấn AI</CardTitle>
  <BoxStyleImage imageUrl={ai.recommendation.boxStyleImageUrl} />
  <SpecRow label="Kiểu thùng" value={ai.recommendation.boxStyle} />
  <SpecRow label="Kích thước đề xuất" value={`${length} × ${width} × ${height} cm`} />
  <SpecRow label="Số lớp" value={`${layers} lớp`} />
  <SpecRow label="Sóng" value={fluteType} />
  <SpecRow label="Giá ước tính" value={`{min}-{max}₫ / thùng`} />
  {ai.recommendation.advice && <AdviceBlock text={ai.recommendation.advice} />}
</Card>

{/* Mockup Preview */}
{consultation.mockup_url && <img src={mockupUrl} alt="Mockup" />}
{consultation.dieline_url && <DielinePreview svgUrl={dielineUrl} />}
```

**Right column** — Actions sidebar:
```tsx
{/* Status transitions */}
<Card>
  <CardTitle>Hành động</CardTitle>
  
  {status === 'ai_processed' && (
    <>
      <Button onClick={() => submitAction('staff_reviewed')}>
        ✓ Đồng ý đề xuất AI
      </Button>
      <Button variant="outline" onClick={() => showModal('adjustModal')}>
        ✎ Điều chỉnh & báo giá
      </Button>
    </>
  )}
  
  {status === 'staff_reviewed' && (
    <Button onClick={() => submitAction('quoted')}>
      💰 Tạo báo giá
    </Button>
  )}
  
  {(status === 'quoted' || status === 'staff_reviewed') && (
    <>
      <Button onClick={() => handleSubmitOrder()}>
        📦 Chuyển thành đơn
      </Button>
    </>
  )}
  
  <Button variant="destructive" onClick={() => submitAction('closed')} disabled={...}>
    ✕ Từ chối
  </Button>
</Card>

{/* Sales Notes */}
<Card>
  <CardTitle>Ghi chú bán hàng</CardTitle>
  {existingNotes && <p className="text-sm text-gray-600">{notes}</p>}
  <Textarea 
    placeholder="Ghi chú phản hồi cho khách..." 
    rows={3}
  />
  <Button variant="outline" size="sm" onClick={() => saveNotes(textareaValue)}>
    Lưu ghi chú
  </Button>
</Card>

{/* Assignment */}
<Card>
  <CardTitle>Phân công</CardTitle>
  <select defaultValue={assigned_to || ''}>
    <option value="">Chưa gán</option>
    <option value={currentUserId}>{profile.full_name}</option>
  </select>
  <Button size="sm" variant="outline" onClick={() => assign()">Gán</Button>
</Card>
```

**Submit Action handler**:
```tsx
async function submitAction(nextStatus: string) {
  const res = await fetch(`/api/consultations/${params.id}/update-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: nextStatus }),
  })
  if (res.ok) router.refresh()
}
```

**API stub needed**: `src/app/api/consultations/[id]/update-status/route.ts`

### P3-4: Customers Page (C8) — Replace Stub

**File**: `src/app/(staff)/staff/customers/page.tsx`

Table layout:
```tsx
columns: Tên | SĐT | Email | Công ty | Đơn hàng | Doanh thu | Đơn cuối | Hành động
```

Hành động: Click → mở `CustomerQuickViewModal` (component đã sẵn tại `src/components/modals/CustomerQuickView.tsx`)

Reuse pattern từ `orders list` page: `listCustomers(filter)` → DataTable → Pagination

### P3-5: Middleware Fix Integration

Sửa `src/middleware.ts` theo P1-1 — đảm bảo customer không vào `/staff/*`.

### P3-6: Wiring — Connect Available Components

Component đã có nhưng chưa import bởi bất kỳ page nào:

| Component | Nơi import |
|-----------|-----------|
| `CustomerQuickViewModal` | `staff/customers/page.tsx` (C8) |
| `ProductEditDrawer` | ✅ **Đã nối** trong `staff/products/products-table.tsx` |
| `PriceChangeModal` | `staff/orders/[id]/page.tsx` (C7 — Dev D) |
| `UploadProofModal` | `staff/orders/[id]/page.tsx` (C7 — Dev D) |

---

## Phase 4: Backend — Query Extensions & Connectors ⏱ 6h

### P4-1: Extend Consultation Data in Order Queries

**File**: `src/lib/data/orders-list.ts`
**Hiện tại** `ORDER_SELECT` chỉ lấy 3 cột từ consultation:
```sql
consultation:consultations!orders_consultation_id_fkey (
  id,
  status,
  product_type     ← thiếu nhiều field!
)
```

**Mở rộng** thành:
```sql
consultation:consultations!orders_consultation_id_fkey (
  id,
  status,
  product_type,
  product_description,
  product_weight,
  notes,
  sales_notes,
  ai_recommendation,
  ai_confidence
)
```

Lợi ích: Khi staff xem chi tiết order, có thể truy xuất context tư vấn gốc.

### P4-2: New API Route — Update Consultation Status

**File mới**: `src/app/api/consultations/[id]/update-status/route.ts`

```typescript
PATCH /api/consultations/:id/update-status
body: { status: 'staff_reviewed' | 'quoted' | 'converted' | 'closed' }

// Auth required: getAuthenticatedProfile, assertStaff
// Validation: status must be valid transition from current
// Implementation: updateConsultationStatus(id, currentStatus, newStatus)
// Return: { success: true, consultation }
// Error: 409 nếu conflict (optimistic lock)
```

Valid transitions (CHECK constraint + business logic):
| Current | Allowed next |
|---------|-------------|
| `ai_processed` | `staff_reviewed`, `cancelled` |
| `staff_reviewed` | `quoted`, `converted`, `closed`, `cancelled` |
| `quoted` | `converted`, `closed`, `cancelled` |
| `converted` | `closed`, `cancelled` |
| anything | `cancelled` |

### P4-3: New API Route — Save Sales Notes

**File mới**: `src/app/api/consultations/[id]/notes/route.ts`

```typescript
PATCH /api/consultations/:id/notes
body: { notes: string }

// Auth required: assertStaff
// Implementation: addSalesNotes(id, notes)
```

### P4-4: New API Route — Assign Consultation

**File mới**: `src/app/api/consultations/[id]/assign/route.ts`

```typescript
PATCH /api/consultations/:id/assign
body: { userId: string }

// Auth required: assertStaff
// Implementation: assignConsultation(id, userId)
```

### P4-5: New API Route — Convert Consultation to Order

**File mới**: `src/app/api/consultations/[id]/convert/route.ts`

```typescript
POST /api/consultations/:id/convert
body: {
  contactName, contactPhone, contactEmail,
  deliveryAddress, paymentMethod, notes?,
  deliveryMethod: 'delivery' | 'pickup'
}

// Auth required: assertStaff
// Steps:
// 1. Get consultation full data via getConsultationFull(id)
// 2. Build order item from AI recommendation:
//    - productId = ai.suggestedProductId
//    - dimensions = ai.suggestedDimensions { length, width, height }
//    - quantity = consultation.desired_quantity ?? moq
//    - isCustom = true
//    - itemName = consultation.product_type
//    - printingSpecs = { mockupUrl, logoUrl, printFaces } if applicable
// 3. Call createOrderWithItems() → returns order ID
// 4. Call convertConsultationToOrder(id, orderId)
// 5. Return { success: true, orderId }
```

Đây là bước quan trọng nhất: kết nối consultation ↔ order pipeline hoàn chỉnh.

### P4-6: Revenue Query Helper

**File mới hoặc thêm vào**: `src/lib/data/revenue.ts`

```typescript
export async function getMonthRevenue(): Promise<number>
// SELECT SUM(total_amount) FROM orders WHERE EXTRACT(MONTH FROM created_at) = MONTH(NOW())
// Service/client bypass RLS (staff page)
```

### P4-7: Open Consultations Count Helper

```typescript
export async function countOpenConsultations(): Promise<number>
// SELECT COUNT(*) FROM consultations WHERE status NOT IN ('closed', 'converted', 'cancelled')
```

---

## Phase 5: Staff Order Detail Enhancement (Dev B/D) ⏱ 4h

### P5-1: Display Consultation Context in Order Detail

**File**: `src/app/(staff)/staff/orders/[id]/page.tsx`
**Hiện tại**: SQL JOIN fetch nhưng UI không render consultation data

**Thêm section** sau Card "Sản phẩm":

```tsx
{order.consultation && (
  <Card>
    <CardTitle>Tư vấn liên quan</CardTitle>
    <div className="space-y-2">
      <SpecRow label="Mã tư vấn" value={order.consultation.id.slice(0, 8).toUpperCase()} />
      <SpecRow label="Trạng thái" value={<StatusBadge status={order.consultation.status} />} />
      {order.consultation.product_description && (
        <SpecRow label="Mô tả khách" value={order.consultation.product_description} />
      )}
      {order.consultation.sales_notes && (
        <blockquote className="rounded bg-blue-50 p-3 text-sm text-blue-800">
          {order.consultation.sales_notes}
        </blockquote>
      )}
    </div>
    <Link href={`/staff/consultations/${order.consultation.id}`} className={btn({ variant: 'outline' })}>
      Xem chi tiết tư vấn
    </Link>
  </Card>
)}
```

**Đồng thời**: Extend ORDER_SELECT trong `orders-list.ts` (P4-1) để fetch thêm field từ consultation.

### P5-2: Wire PriceChange Modal (D6 → C7)

**File**: `src/app/(staff)/staff/orders/[id]/page.tsx`
**Component đã có**: `PriceChangeModal` tại `src/components/modals/PriceChange.tsx`

Khi staff xác nhận đơn (nút "Xác nhận & chốt giá"), nếu tổng tiền chênh lệch đáng kể so với AI estimate → show modal.

```tsx
// Inside StaffOrderActions (hoặc tạo wrapper component mới):
import { PriceChangeModal, isSignificantPriceChange } from '@/components/modals/PriceChange'

// Before confirming, compare staff-chosen price vs AI-recommended price
// If deviation >= threshold → show modal before allowing confirm
```

### P5-3: Wire UploadProof Modal (D7 → C7)

**File**: `src/app/(staff)/staff/orders/[id]/page.tsx`
**Component đã có**: `UploadProofModal` tại `src/components/modals/UploadProof.tsx`

Hiển thị proof ảnh đã upload bởi khách, với buttons "Xác nhận" / "Yêu cầu gửi lại".

---

## Phase 6: Cleanup & Polish (Dev D) ⏱ 6h

### P6-1: About Page Images (D1)

**Files**: 
- `src/app/(public)/about/page.tsx` (line 31: hero background)
- `src/app/(public)/about/components/FactorySection.tsx` (lines 6, 12, 18)

**Thay thế** 4 picsum URLs bằng Cloudinary public URLs. Pattern hiện tại trên landing page: `https://res.cloudinary.com/dbq76uhcf/...`

Upload ảnh thật lên Cloudinary path `landing/about-*` hoặc dùng ảnh product catalog hiện có.

### P6-2: Feature Flags Wiring (D15)

**File**: `src/lib/config/features.ts` (đã khai báo 4 flags)
**Importers**: 0 → cần thêm

Wiring points:
- **Nav items**: Gate consultation/reorder links based on `features.consulation`, `features.reorder`
- **Consultation page access**: Conditionally render `/consultation` based on `features.consultation`
- **SavedProducts**: Gate `save-as-template-button` on `features.savedProducts`
- **Mockup**: Gate mockup generation button on `features.mockup`

Pattern: `if (features?.reorder !== false) { showReorderLink }`

### P6-3: Bank Transfer Details Config (DÙNG SAU)

Thực hiện khi payment flow hoàn thiện — extract hardcoded values thành env variables trong `.env`.

---

## Summary Files Modified / Created

### Modified (~30 lines each unless noted):
| File | Phase | Dev |
|------|-------|-----|
| `src/middleware.ts` | P1-1 | C |
| `src/components/modals/PaymentConfirmation.tsx` | P6-3 | D |
| `src/app/(public)/consultation/consultation-result.tsx` | P2-1 | A |
| `src/app/(public)/consultation/consultation-ready-state.tsx` | P2-1 | A |
| `src/app/(staff)/staff/orders/[id]/page.tsx` | P5-1/2/3 | B/D |
| `src/lib/data/orders-list.ts` ORDER_SELECT | P4-1 | C |
| Various navigation/layout | P6-2 | D |

### Created (new files):
| File | Purpose | Size (est.) |
|------|---------|------------|
| `src/lib/data/consultations-list.ts` | list/get/transition/assign/notes/convert | ~150 lines |
| `src/lib/data/customers.ts` | list/get-stats/detail | ~80 lines |
| `src/types/database.ts` | Full DB types (replace 80-line stub) | ~250 lines |
| `src/app/api/consultations/[id]/request-review/route.ts` | POST endpoint | ~30 lines |
| `src/app/api/consultations/[id]/update-status/route.ts` | PATCH endpoint | ~40 lines |
| `src/app/api/consultations/[id]/notes/route.ts` | PATCH endpoint | ~20 lines |
| `src/app/api/consultations/[id]/assign/route.ts` | PATCH endpoint | ~20 lines |
| `src/app/api/consultations/[id]/convert/route.ts` | POST endpoint | ~60 lines |

### Deleted:
| File | Reason |
|------|--------|
| `src/app/api/consultations/route.ts` | 501 stub, dead code |

### Replacement (stub → real):
| File | Old | New |
|------|-----|-----|
| `src/app/(staff)/staff/page.tsx` | `<UnderDevelopmentPage />` | Real dashboard with stats |
| `src/app/(staff)/staff/consultations/page.tsx` | `<UnderDevelopmentPage />` | Consultations list table |
| `src/app/(staff)/staff/consultations/[id]/page.tsx` | `<UnderDevelopmentPage />` | Consultation review detail |
| `src/app/(staff)/staff/customers/page.tsx` | `<UnderDevelopmentPage />` | Customers list + CustomerQuickViewModal |

---

## Dependency Graph

```
Phase 1 (Infrastructure/BE)
├── P1-1 middleware fix → blocks all /staff routes
├── P1-2 consultation data funcs → required by P3 (all staff pages)
├── P1-3 customers data funcs → required by C8
├── P1-4 DB types → required for type safety across all pages (làm sau)
│
Phase 2 (Frontend: Consultation Flow)
├── P2-1 button on result page → needs P2-2 API route
├── P2-2 request-review API → standalone (no upstream deps)
├── P2-4 delete dead code → independent
│
Phase 3 (Staff Pages)
├── All require P1-1 (middleware auth working) + P1-2/3 (data funcs)
│
Phase 4 (Backend APIs)
├── P4-2 update-status → used by P3-3 consultation review page
├── P4-3/4 notes/assign → used by P3-3
├── P4-5 convert → key bridge between consultation → order
├── P4-1 extend ORDER_SELECT → used by P5-1
│
Phase 5 (Order Detail Enhancement)
├── Requires all above phases partially complete
│
Phase 6 (Cleanup)
├── Independent cleanup tasks
```

---

## Verification Checklist

1. **[Auth]** Login as test-customer@test.com → navigate to /staff/* → redirects to /dashboard ✓
2. **[Auth]** Login as test-sales@test.com → access /staff/* → works ✓
3. **[Consultation Create]** Customer fills form → sees AI result → clicks "Nhờ nhân viên xem giúp" → consultation status updated ✓
4. **[Consultation → Order]** Customer clicks "Thêm vào giỏ" → order created với consultation_id ✓
5. **[Consultation List]** Staff opens /staff/consultations → sees list of consultations with filters ✓
6. **[Consultation Review]** Staff opens consultation detail → sees client input + AI recommendation → clicks "Đồng ý đề xuất" → status → staff_reviewed ✓
7. **[Convert to Order]** Staff clicks "Chuyển thành đơn" trên consultation → new order created → consultation status → converted ✓
8. **[Order Detail Shows Consultation]** Staff opens order → sees consultation context section (if has one) ✓
9. **[PriceChange Modal]** Staff confirms order with significant price diff → PriceChangeModal appears ✓
10. **[Banking Config]** PaymentConfirmation uses environment variables instead of hardcoded values *(làm sau khi payment flow tích hợp)* ✓
11. **[DB Types]** tsc --noEmit passes without missing type errors for any tables ✓
12. **[Build]** npm run build succeeds ✓
13. **[No Dead Code]** /api/consultations route deleted, no 501 imports remain ✓
