# User Flows & Navigation — AI Carton Packaging Solution

> Core flows for MVP. Designed for clarity, minimal steps, and customer comfort.

---

## 1. Navigation Structure

Route thật trên đĩa (đối chiếu `src/app/**/page.tsx`). ✅ = đã triển khai, ⚠️ = stub.

```
SITE MAP
│
├── PUBLIC (không cần đăng nhập)
│   ├── /  ································································✅
│   │   ├── Hero (CTA → /consultation)
│   │   ├── "Cách hoạt động" (3 bước: Nhập thông số → AI → Đặt hàng)
│   │   ├── "Sản phẩm của chúng tôi" (3 card tĩnh + link → /pricing)
│   │   ├── "Nhà máy của chúng tôi" (placeholder ảnh + 4 số liệu)
│   │   └── CTA cuối trang
│   │       ⚠️ KHÔNG có logo wall, KHÔNG có FAQ, KHÔNG có contact form,
│   │          không có video nhà máy. Ảnh nền hero là PNG Cloudinary.
│   │
│   ├── /consultation ······················································✅
│   │   MỘT trang: form cột trái + kết quả AI cột phải (render inline)
│   │   ├── ❶ Nhập thông số
│   │   ├── ❷ Kết quả AI  (+ panel "Mockup in" nếu khách chọn in)
│   │   └── ❸ Đặt hàng  →  [Thêm vào giỏ] / [Mua ngay]  (cần đăng nhập)
│   ├── /consultation/result?id=<uuid> ····································✅
│   │   Bản full-page của ❷, deep-link được (không link nội bộ nào trỏ tới)
│   │   ⚠️ KHÔNG còn route ?step=result / ?step=mockup — doc cũ ghi sai
│   │
│   ├── /shop ······························································✅  hàng có sẵn + giỏ
│   ├── /consultation/stock ················································✅  AI tìm mẫu trong kho
│   ├── /order ·····························································🗑  đã nghỉ → redirect /dashboard/custom
│   ├── /pricing ···························································✅  bảng giá + chiết khấu
│   ├── /dieline-lab ·······················································✅  xem trước khuôn bế
│   │   ⚠️ Navbar/Footer đều không có link vào — chỉ vào được bằng URL
│   ├── /about ·····⚠️✅ nội dung tĩnh, hero vẫn dùng ảnh placeholder picsum
│   ├── /login · /register ··················································✅  (route group (guest))
│   │   ⚠️ "Quên mật khẩu" trỏ /forgot-password — trang đó chưa tồn tại
│
├── AUTHENTICATED — Customer  (route group (auth), /dashboard/…)      ✅
│   ├── /dashboard                      overview: stat cards + đơn gần đây
│   ├── /dashboard/cart                 giỏ hàng — dòng stock + dòng custom, sửa quy cách tại chỗ
│   ├── /dashboard/checkout             chọn địa chỉ đã lưu + payment → POST /api/checkout
│   ├── /dashboard/custom               thùng theo yêu cầu: import mẫu đã lưu / tự nhập quy cách
│   ├── /dashboard/orders               danh sách + filter theo status (?status&page&search)
│   ├── /dashboard/orders/[id]          detail + timeline + thumbnail mockup/khuôn bế
│   ├── /dashboard/history              lịch sử đơn
│   ├── /dashboard/reorder              tạo đơn mới từ đơn cũ (?id=)
│   └── /dashboard/profile              sửa hồ sơ (⚠️ "Đổi mật khẩu"/"Xóa tài khoản" chưa có handler)
│
└── AUTHENTICATED — Staff (route group (staff), /staff/…)         ⚠️ TẤT CẢ LÀ STUB
    ├── /staff                              → <UnderDevelopmentPage />
    ├── /staff/consultations  + /[id]       → stub   (API: /api/consultations trả 501)
    ├── /staff/orders         + /[id]       → stub   (API PATCH status đã có, UI chưa)
    ├── /staff/customers                    → stub   (modal CustomerQuickView chưa chỗ gọi)
    └── /staff/products                     → stub   (CatalogTable/ProductEditDrawer chưa nối)
```

> Middleware (`src/middleware.ts`) gate theo pathname: `/dashboard` + `/staff` cần đã đăng
> nhập; `/login` + `/register` redirect về `/dashboard` khi đã đăng nhập. **Chưa check
> `profiles.role`** → customer đã login về lý thuyết vào được `/staff/*` (chỉ thấy stub).
> Navbar public: `Trang chủ · Tư vấn · Về chúng tôi · Bảng giá` + `Dashboard`/`Đăng nhập`.

---

## 2. Core Flow 1 — AI Consultation → Order

### 2.1 Flow Diagram

```
  CUSTOMER                              SYSTEM                          STAFF
    │                                      │                              │
    ├─ Visit landing page (/)              │                              │
    ├─ Click "Bắt đầu tư vấn"              │                              │
    ▼                                      │                              │
  ┌───────────────────────────┐            │                              │
  │  ❶ NHẬP THÔNG SỐ          │            │                              │
  │  (/consultation, client)  │            │                              │
  │                           │            │                              │
  │ • Sản phẩm cần đóng gói   │            │                              │
  │ • Kích thước D×R×C (cm)   │            │                              │
  │ • Trọng lượng (g)         │            │                              │
  │ • Kiểu hộp (optional —    │            │                              │
  │   trống = AI tự chọn)     │            │                              │
  │ • Số lượng thùng cần     │            │                              │
  │ • In ấn? Có / Không       │            │                              │
  │ • Ghi chú (≤100 từ)       │            │                              │
  │                           │            │                              │
  │ ⚠️ KHÔNG có ở bước này:   │            │                              │
  │   logo · vị trí in · liên │            │                              │
  │   hệ · địa chỉ (hỏi sau)  │            │                              │
  └─────────┬─────────────────┘            │                              │
            │  POST /api/ai/recommend      │                              │
            ├─────────────────────────────►│                              │
            │                              ├─ INSERT consultation (pending)
            │                              ├─ getAIProvider()             │
            │                              │   (OpenAICompat | Mock)      │
            │                              ├─ UPDATE status=ai_processed  │
            │  { consultationId, recommendation }                         │
            │◄─────────────────────────────┤                              │
            ▼                                                             │
  ┌─────────────────────────────────────────┐                             │
  │  ❷ KẾT QUẢ AI — cùng trang, cột phải     │                             │
  │  · hộp khuyến nghị: kiểu · số lớp · sóng │                             │
  │  · kích thước · vật liệu · bọc bảo vệ    │                             │
  │  · giá tạm tính · MOQ · lead time         │                             │
  │  · advice · confidence · phương án thay   │                             │
  │                                           │                             │
  │  Nếu "In ấn = Có" → panel MOCKUP IN:      │                             │
  │    upload logo · chọn vị trí in theo      │                             │
  │    kiểu hộp · POST /api/ai/mockup         │                             │
  │    → khuôn bế + ảnh mockup                │                             │
  │                                           │                             │
  │    [Thêm vào giỏ] [Mua ngay] [Lưu làm mẫu]│                            │
  └──────────┬────────────────────────────────┘                            │
             │ ⚠️ hasPrinting → cả hai nút giỏ hàng KHÓA tới khi có mockup  │
             │   (trừ khi service chưa cấu hình → status unavailable)       │
             │ POST /api/cart {kind:'custom', consultationId, ...}          │
             │   → 401: hint rồi redirect /login (mua custom CẦN đăng nhập) │
             ├─────────────────────────────►                               │
             ▼                                                             │
  ┌───────────────────────────────┐                                       │
  │  ❸ Giỏ hàng — /dashboard/cart │                                       │
  │  • Nhiều dòng / 1 đơn: stock  │                                       │
  │    (hàng kho) HOẶC custom      │                                       │
  │    (theo yêu cầu) trộn lẫn     │                                       │
  │  • Dòng custom: tên tự đặt ·  │                                       │
  │    D×R×C · số lớp · ghi chú —  │                                      │
  │    sửa tại chỗ (PATCH custom)  │                                      │
  │  • Số lượng đổi tại chỗ; dòng │                                       │
  │    stock vượt kho bị chặn chọn │                                       │
  │  • Tổng TẠM TÍNH theo         │                                       │
  │    products.base_price —       │                                       │
  │    server tính lại, staff      │                                       │
  │    duyệt đơn giá cuối         │                                       │
  └──────────┬────────────────────┘                                       │
             │  ❹ /dashboard/checkout                                      │
             │  • Địa chỉ: CHỌN từ customer_addresses (default hoặc         │
             │    cái khác) — không nhập lại Họ tên/SĐT/Email/địa chỉ       │
             │    mỗi lần đặt; empty → ensureDefaultAddress() từ profiles   │
             │  • Only remaining inputs: paymentMethod (COD/CK) + notes     │
             │  • POST /api/checkout {cartItemIds, addressId, ...}           │
             │    → server ĐỌC ĐỊA CHỈ TỪ DB, không tin text từ client       │
             ├─────────────────────────────►                               │
             │  201 Created: status=pending · payment_status=unpaid ·       │
             │  delivery_fee=0 · order_code=ORD-YYYYMMDD-XXXXXXXX ·          │
             │  deposit = total≥5.000.000đ ? round(total×50%) : 0            │
             │  contact_*/delivery_address = snapshot địa chỉ đã chọn        │
             │  is_custom=TRUE cho dòng gia công → không trừ kho             │
             │◄─────────────────────────────┤                              │
             ▼                                                             │
  ┌───────────────────────────────┐                                       │
  │  Đã nhận đơn hàng             │                                       │
  │  mã đơn · tổng tạm tính       │                                       │
  │  [Xem đơn hàng của tôi]       │                                       │
  │  [Tiếp tục mua hàng] → /shop  │                                       │
  │  (bank_transfer → tự mở modal │                                       │
  │   Thanh toán)                 │                                       │
  └───────────────────────────────┘                                       │
                                          │  staff đọc đơn qua API         │
                                          ├───────────────────────────────►│
                                          │                    ┌───────────┴──────────┐
                                          │                    │ Staff review UI       │
                                          │                    │ CHƯA LÀM — /staff/*  │
                                          │                    │ là stub; chỉ có       │
                                          │                    │ PATCH /api/orders/   │
                                          │                    │ [id]/status          │
                                          │                    └──────────────────────┘
```

### 2.2 Form Fields — ❶ Nhập thông số (`/consultation`)
Nguồn: `src/app/(public)/consultation/consultation-schema.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `productType` | Text | ✅ | "Vui lòng nhập sản phẩm cần đóng gói", max 200 ký tự |
| `boxStyle` | Select | ❌ | `rsc_a1` \| `am_duong` \| `mailer` — bỏ trống để AI tự chọn |
| `lengthCm` | Number (cm) | ✅ | positive, max 9999 |
| `widthCm` | Number (cm) | ✅ | positive, max 9999 |
| `heightCm` | Number (cm) | ✅ | positive, max 9999 |
| `weightGrams` | Number (g) | ✅ | positive, max 999999 |
| `desiredQuantity` | Number (thùng) | ✅ | int, positive, max 1.000.000 |
| `hasPrinting` | Yes/No toggle | ✅ | Bật → hiện panel Mockup ở ❷ |
| `notes` | Textarea | ❌ | max **100 từ** (đếm bằng whitespace split) |

**Không có trong form này** (doc cũ liệt kê sai): `quantity_per_box` (items/box),
logo upload, print position, họ tên, SĐT, email, company, delivery address,
`preferred_layers`, `flute_type`, `purchase_frequency`. Liên hệ + địa chỉ KHÔNG
còn nằm ở màn đặt hàng — chúng là `customer_addresses`, chọn ở ❹ checkout;
logo + vị trí in thuộc panel Mockup ở ❷. Columns
`consultations.quantity_per_box`, `preferred_layers`, `flute_type`,
`purchase_frequency`, `has_design_file`, `budget`, `delivery_deadline` vẫn tồn
tại trong DB nhưng UI không còn ghi vào.

### 2.3 Payload của hai API đặt hàng

**`POST /api/cart`** — thêm một dòng. Bốn nhánh, một endpoint
(`src/lib/data/cart-add.ts` dispatch):

```jsonc
{ "productId": "<uuid>", "quantity": 500 }                                 // 1. hàng kho
{ "kind": "custom", "consultationId": "<uuid>", "productId": "<uuid>?" }   // 2. từ tư vấn AI
{ "kind": "custom", "savedProductId": "<uuid>" }                            // 3. từ mẫu đã lưu
{ "kind": "custom", "productId": "<uuid>", "quantity": 500,
  "custom": { "length": 30, "width": 20, "height": 15, "layers": 3,
              "boxStyleId": "rsc_a1", "productName": "…", "productCode": "CUS-…" } }  // 4. tự nhập
```

Nhánh 2/3 không cần gửi `quantity`: server lấy `consultations.desired_quantity`
/ `custom_dimensions.quantity`, rồi mới tới 1. `productId` là **neo giá**, bắt
buộc cho mọi dòng (`cart_items.product_id` NOT NULL) → thiếu thì 400
`Chọn sản phẩm cơ sở để tính giá tạm tính`; spec custom sai → 400
`Quy cách không hợp lệ`; neo không tồn tại / không active → 404.

**`POST /api/checkout`** — tạo đơn từ các dòng đã chọn:

```jsonc
{
  "cartItemIds": ["<uuid>", "…"],
  "paymentMethod": "cod" | "bank_transfer",
  "addressId": "<uuid>|omitted",   // omitted → dùng địa chỉ is_default
  "notes": "…"
}
```

Server **không** nhận contact/delivery từ client: `getAddressForCheckout()` đọc
`customer_addresses` rồi mới ghi `orders.contact_*` + `delivery_address`. Không
có địa chỉ nào → 400/404 `OrderError` dịch qua HTTP status.

Hai đường đều đổ vào `createOrderWithItems()`: `unit_price` lấy từ
`products.base_price` (client không quyết định được số tiền), `total_amount` = Σ
subtotal, `deposit_amount` theo `pricing.ts`. `order_items.product_name/code` là
snapshot; dòng custom ghi `is_custom = TRUE` nên `deduct_order_stock` bỏ qua.
Insert `order_items` fail → order vừa tạo bị **delete** để rollback.

---

### 2.4 Mockup in + khuôn bế — `POST /api/ai/mockup`

Panel nằm trong ❷ (`print-mockup-panel.tsx` + `print-mockup-controls.tsx`),
multipart form-data: `consultationId`, `printPosition`, `file` **hoặc** `logoUrl`
(bấm "Tạo lại mockup" gửi lại URL, không upload lại).

Thứ tự server làm (`src/app/api/ai/mockup/route.ts` + `src/lib/mockup/request.ts`):

| Bước | Chi tiết | Lỗi |
|---|---|---|
| 1 đọc form | logo bắt buộc là `image/png\|jpeg\|webp`, ≤10MB; `logoUrl` phải `https` và host `.supabase.co` / `res.cloudinary.com` (chống SSRF) | 400 / 413 / 415 |
| 2 validate | `consultationId` là UUID, tư vấn tồn tại, `status === 'ai_processed'`, `has_printing = true`, `isImageConfigured()` | 400 / 404 / 409 / **503** |
| 3 vị trí in | `isPrintPositionForBoxStyle(boxStyleId, printPosition)` — `rsc_a1` → `2_main`/`4_sides`; `am_duong`/`mailer` → `1_top`. `boxStyleId` lấy từ `ai_recommendation`, fallback `rsc_a1` | 400 |
| 4 quota | `requestMockupSlot(id, 3)` — CAS tăng `mockup_requests` trong DB | **429** `Đã đạt giới hạn 3 lần tạo mockup cho tư vấn này` |
| 5 khuôn bế | dựng SVG từ `ai_suggested_dimensions`/`outerDimensions` + lớp, upload Cloudinary, **lưu trước khi gọi AI** (`onDielineReady` → `updateMockupAssets`) | — |
| 6 ảnh AI | `qwen-image-3.0` qua `/v1/images/edits`, base = `box_styles.mockup_url` của kiểu thùng | **502** (kèm `dielineUrl` đã lưu, khách không mất trắng) |
| 7 | `updateMockupAssets()` ghi `print_faces`, `logo_url`, `mockup_url`, `dieline_url` → 201 | |

Điều kiện để panel hiện: `hasPrinting === true` **và** service còn sống
(`unavailable` thì UI ẩn panel, CTA đặt hàng không bị khóa).

> ⚠️ **Chưa check owner ở bước 2**: route chỉ kiểm tra tư vấn *tồn tại* và
> `has_printing`, không đối chiếu `customer_id` với người đang login (client
> component, cookie không được dùng ở đây). Ai có UUID của tư vấn người khác có
> thể: đốt `mockup_requests` của họ, và **ghi đè** `mockup_url`/`dieline_url`/
> `print_faces`.
> Fix gọn: lấy `user.id` trong route rồi 403 khi `c.customer_id && c.customer_id
> !== user.id` — cùng guard mà `cart-add.ts: fromConsultation()` đã áp cho nhánh
> thêm giỏ từ tư vấn (bản cũ ở `src/lib/mockup/handoff.ts` đã xoá cùng `/order`).
>
> ⚠️ Không có rate limit nào ngoài quota 3 lần/tư vấn → `/api/ai/mockup` và
> `/api/ai/recommend` (mỗi lần gọi tốn tiền API text) đều mở cho người chưa
> đăng nhập.

---

## 3. Order Status State Machine

Nguồn thật duy nhất của transition: `STAFF_TRANSITIONS` + `CUSTOMER_TRANSITIONS`
trong `src/app/api/orders/[id]/status/route.ts`. Server ép bằng CAS
(`.eq('status', order.status)`) rồi ghi `order_status_history`.

```
  pending --> staff_review --> confirmed --> deposit_paid --> production --> completed --> delivered
     |             |               |               |              |
     |             |               |--> staff, bo qua coc -------+
     +-------------+---------------+--------------+--------------+---> cancelled

  Diem vao: customer submit -> pending.  cancelled: trang thai cut, khong duong ra.
  Staff huy duoc o 5 trang thai dau (pending ... production).
  Customer chi huy duoc pending.  completed / delivered / cancelled: het transition.
```


| Từ trạng thái | Staff đi được tới | Customer đi được tới |
|---|---|---|
| `pending` | `staff_review`, `cancelled` | **`cancelled`** |
| `staff_review` | `confirmed`, `cancelled` | — |
| `confirmed` | `deposit_paid`, `production`, `cancelled` | — |
| `deposit_paid` | `production`, `cancelled` | — |
| `production` | `completed`, `cancelled` | — |
| `completed` | `delivered` | — |
| `delivered` | — | — |
| `cancelled` | — | — |

> ⚠️ Doc cũ ghi "cancelled — any stage" là **sai**: `completed`, `delivered`,
> `cancelled` không còn đường sang `cancelled`. Customer chỉ tự hủy được đơn ở
> `pending` (`canCustomerCancelOrder()`).
> Nếu customer thử gọi transition của staff → **403** (không phải 400).
> Trạng thái cuối cùng (không còn transition) → **409**.

### 3.1 Nhãn trạng thái — HAI nguồn, lệch nhau

| `status` | UI (`order-shared.ts` → `ORDER_STATUS_DISPLAY`) | API (`constants.ts` → `ORDER_STATUS_LABELS`) |
|---|---|---|
| `pending` | Chờ xử lý | Chờ xử lý |
| `staff_review` | Đang duyệt | **Đang xem xét** |
| `confirmed` | Đã xác nhận | Đã xác nhận |
| `deposit_paid` | Đã đặt cọc | Đã đặt cọc |
| `production` | Đang sản xuất | Đang sản xuất |
| `completed` | Hoàn thành | Hoàn thành |
| `delivered` | Đã giao | **Đã giao hàng** |
| `cancelled` | Đã hủy | Đã hủy |

Không có emoji trong UI thật (doc cũ dùng ⏳👀✅💰🔧📦❌ — sai).
Toàn bộ customer UI lấy label từ `getOrderStatusLabel()` = cột UI. Hai chuỗi
khác nhau ở `staff_review` và `delivered` là **nợ kỹ thuật**, nên gộp về một chỗ
(`ORDER_STATUS_LABELS` hiện chỉ route status + payment dùng).

---

## 3.B Consultation Status State Machine

```sql
-- CHECK constraint (supabase/migrations): 
pending | ai_processed | staff_reviewed | quoted | converted | closed
```

| Status | Ý nghĩa | Ai set | **Thực tế** |
|---|---|---|---|
| `pending` | Khách gửi form, AI chưa chạy | System | ✅ có thật |
| `ai_processed` | AI đã trả kết quả | System | ✅ có thật |
| `staff_reviewed` | Staff đã duyệt gợi ý AI | Staff | ⚠️ **code không bao giờ set** |
| `quoted` | Staff đã gửi báo giá chốt | Staff | ⚠️ **code không bao giờ set** |
| `converted` | Khách đặt đơn từ tư vấn này | System khi tạo order | ⚠️ **code không bao giờ set** |
| `closed` | Đóng tư vấn | Staff | ⚠️ **code không bao giờ set** |

Chỉ có `POST /api/ai/recommend` đụng tới cột này: insert `pending` → update
`ai_processed`. `POST /api/orders` lưu `consultation_id` nhưng **không** đổi
`consultations.status` sang `converted`. 4 giá trị còn lại đang là chỗ-trống
trong CHECK constraint, chờ UI staff (`/staff/*` hiện là stub).

**Tư vấn ẩn danh**: `customer_id = NULL` nếu chưa login. ⚠️ Không có code nào
link lại sau đó — doc cũ nói "linked via their phone/email" là **bịa**. Hệ quả
khi đặt hàng: `POST /api/cart {kind:'custom', consultationId}` cho phép lấy spec
của tư vấn ẩn danh (guard chỉ chặn khi `customer_id` đã có mà khác người login),
nên ai mở deep-link tư vấn ẩn danh vẫn thêm được mẫu đó vào giỏ của mình.

> ⚠️ **Rò danh tính qua deep-link**: `/consultation/result?id=` gọi
> `getConsultation()` (`src/lib/data/consultations.ts:142`) vốn dùng
> `createAdminClient()` → **vượt RLS**, nên ai cầm được UUID là đọc được toàn bộ
> `ai_recommendation` + `logo_url` + `mockup_url` + `dieline_url` của tư vấn đó,
> kể cả của khách khác. Route thêm giỏ có guard (`cart-add.ts` → 403) nhưng route
> result thì không.
> Fix gọn: `getConsultation(id, { forUserId })` có check owner, hoặc dùng
> `createClient()` (RLS) cho route này.

---

## 4. Staff Flow — Review & Confirm

> ⚠️ **CHƯA TRIỂN KHAI.** Toàn bộ `/staff/*` render `<UnderDevelopmentPage />`
> (`src/app/(staff)/…`). `/api/consultations` trả **501** cho GET + POST.
> Hai mockup dưới đây là **spec**, không phải mô tả code hiện tại — giữ lại vì
> backend cho staff đã có một phần: `GET/PATCH /api/orders/[id]/status`
> (transition table + `allowedTransitions`), `GET /api/orders` (staff thấy mọi
> đơn, filter `status` / `search` / `page` / `limit` / sort).
>
> Ràng buộc còn thiếu ở tầng data: policy RLS đọc role từ
> `auth.jwt() ->> 'role'`, mà role **không** được nhét vào JWT lúc đăng ký hay
> lúc seed → policy đó không bao giờ khớp. Route handler đi vòng qua bằng
> `createAdminClient()` + tự check `profiles.role`, nên API vẫn đúng; nhưng
> page component nào query trực tiếp qua client có cookie sẽ KHÔNG thấy dữ
> liệu staff.

### 4.1 Staff dashboard (spec — chưa có code)

```
┌─────────────────────────────────────────────────────────────────┐
│  STAFF DASHBOARD                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ Tư vấn mới    │ │ Đơn chờ duyệt │ │ Đang sản xuất │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                  │
│  Danh sách consultations (status pending/ai_processed) + orders  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Staff review screen (spec — chưa có code)

```
┌────────────────────────────────────────────────────────────────┐
│  Review Consultation                                             │
│  • Thông tin khách (profiles)  • Kết quả ai_recommendation (JSONB)
│  • Thông số sản phẩm đã nhập   • Logo + mockup + khuôn bế (nếu in)
│  • Staff chốt: final price / MOQ / production time / notes       │
│  → PATCH consultations.status = staff_reviewed → quoted          │
│  (hiện CHƯA có API nào viết các status này)                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Order Tracking — Customer View (`/dashboard/orders/[id]`)

Trang thật là Server Component, Timeline nằm nguyên hàng trên; phía dưới là `grid gap-6 xl:grid-cols-[1fr_360px]` — nội dung chính + cột phải 360px:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Quay lại danh sách đơn hàng                                        │
│  Theo dõi tiến độ yêu cầu                                             │
│  ORD-20260915-1A2B3C4D · [StatusBadge] · [PaymentBadge]               │
│  Tạo lúc 15 thg 9, 2026, 09:30                                        │
├──────────────────────────────────┴───────────────────────────────────┤
│  StatusTimeline (Card, full-wide, nằm TRÊN grid 2 cột)                │
├──────────────────────────────────┬───────────────────────────────────┤
│  ┌────────────────────────────┐  │  Card: Sản phẩm                    │
│  │ ●  ─  ●  ─ ◉  ─ ○  ─ ○  ─  │  │   • <product_name>                │
│  │ ○  ─  ○  ─  ○              │  │     Số lượng 500                  │
│  │ 09/15  09/15 Đang chờ …    │  │     D×R×C · số lớp                │
│  └────────────────────────────┘  │     [Mockup] [Khuôn bế] thumbnails │
│                                  │     (in printing_specs)            │
│  Card: Tóm tắt đơn hàng          │  Card: Liên hệ và giao nhận        │
│  Card: Liên hệ và giao nhận      │                                    │
│  [Hủy đơn]  [Đặt lại]  [Tất cả đơn hàng]                              │
└──────────────────────────────────────────────────────────────────────┘
```

`src/components/ui/status-timeline.tsx` — chi tiết thật:

| | |
|---|---|
| Cấu trúc | `<ol className="grid min-w-[760px] grid-cols-7">` bọc trong `overflow-x-auto` → **7 cột**, loại `cancelled` khỏi dòng thời gian |
| Icon | Phosphor per status: `CheckCircle` pending · `Package` staff_review · `ClipboardText` confirmed · `CurrencyCircleDollar` deposit_paid · `Factory` production · `SealCheck` completed · `Truck` delivered |
| Ngày | `dd/MM/yyyy` (`Asia/Ho_Chi_Minh`) từ `order_status_history.to_status` khớp; `pending` fallback `order.created_at`; chưa tới → `Đang chờ` |
| Đã hủy | activeIndex lui về trạng thái cuối trước khi cancel, cả dòng thời gian render ở trạng thái "chưa đạt", + dòng đỏ `Đơn hàng đã hủy vào dd/MM/yyyy` |
| Progress % | `getOrderProgress()`: `pending` 14% … `delivered` 100%, `cancelled` → 100. Dùng ở **danh sách** đơn, không phải trang detail |

Nút action (đều guarded bằng helper, không phải tự suy trong JSX):

| Nút | Hiện khi | Gọi gì |
|---|---|---|
| `Hủy đơn` | `canCustomerCancelOrder(status)` → chỉ `pending` | `CancelOrderModal` → `PATCH /api/orders/[id]/status` body `{status:'cancelled', notes}` (notes ghép từ lý do chọn + tự do) |
| `Đặt lại` | `canReorderOrder(status)` → `completed` \| `delivered` | `Link /dashboard/reorder?id=<id>` |
| `Tất cả đơn hàng` | luôn | `Link /dashboard/orders` |

> ⚠️ Không có nút "để lại đánh giá" / "thanh toán lại" ở trang này. Không có
> bảng feedback nào trong DB.

---

## 6. Reorder Flow (`/dashboard/reorder`)

```
  CUSTOMER                              SYSTEM
     │  mở /dashboard/reorder?id=<uuid>    │
     ├────────────────────────────────────►│  RSC: check profile.role === 'customer'
     │                                    ├─ getCustomerOrderById(profile.id, id)
     │                                    ├─ !order → notFound()
     │                                    └─ !canReorderOrder(status) → notFound()
     │  ◄── form: các dòng sản phẩm cũ,   │
     │      sửa được từng quantity,       │
     │      chọn paymentMethod, notes     │
     ├─ [Tạo đơn đặt lại] ───────────────►│  POST /api/reorder
     │   { orderId, quantityOverrides:[   │  ├─ re-price theo products.base_price HIỆN TẠI
     │     {sourceItemId, quantity}],     │  ├─ item bị skip nếu product_id null /
     │     paymentMethod?, notes? }       │  │  không active / base_price ≤ 0 → skippedItems
     │                                    │  ├─ insert orders (status pending,
     │                                    │  │  consultation_id NULL, delivery_fee 0)
     │                                    │  ├─ insert order_items (copy dimensions +
     │                                    │  │  printing_specs nguyên vẹn)
     │                                    │  └─ order_status_history:
     │  ◄── 201 { order, copiedItems,     │     notes "Reordered from <mã đơn cũ>"
     │        skippedItems }              │
     ▼                                    │
  "Đã tạo đơn đặt lại: ORD-…  Tổng tiền: …"  + link tới detail
```

| Chi tiết | Giá trị thật |
|---|---|
| Ai dùng được | chỉ `profiles.role === 'customer'` — staff/sales thấy thông báo "Tính năng đặt lại chỉ dành cho tài khoản khách hàng." |
| Param URL | `?id=` (**không phải** `?order_id=`) |
| Danh sách khi không có `id` | 8 đơn gần nhất có status `completed`/`delivered` (`HISTORY_STATUSES`) |
| Giá | server tính lại; UI ghi rõ "Giá cuối cùng sẽ được server tính lại theo dữ liệu hiện tại." |
| Liên kết lại | đơn mới **không** trỏ về consultation cũ (`consultation_id: null`) |
| Rollback | insert `order_items` hoặc history fail → `orders.delete()` đơn vừa tạo |
| 409 | nguồn chưa `completed`/`delivered`; không có item; mọi item đều bị skip |

---

## 7. Customer Dashboard (`/dashboard`)

```
┌────────────────────────────────────────────────────────────────┐
│  Xin chào, <tên cuối trong full_name>             (bạn nếu trống)│
│  Chào mừng trở lại                                              │
├────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │ Tổng đơn hàng  │ │   Đang xử lý   │ │Sản phẩm đã lưu │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│                                                                │
│  [Tư vấn mới]  [Đặt lại]  [Theo dõi đơn]                       │
│                                                                │
│  <DashboardNav /> (Tổng quan·Đơn hàng·Lịch sử·Hồ sơ·Đăng xuất)     │
│  — layout (auth), nằm trên MỌI trang /dashboard/*                  │
│                                                                    │
│  Đơn hàng gần đây                     Xem tất cả →             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ mã đơn · item summary · StatusBadge · PaymentBadge ·     │ │
│  │ total_amount · created_at · → /dashboard/orders/[id]     │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

| Doc cũ nói | Thực tế |
|---|---|
| "In Progress 3 / Saved Products 5" | label tiếng Việt: `Tổng đơn hàng`, `Đang xử lý`, `Sản phẩm đã lưu` |
| Nav doc cũ vẽ ở chân trang | Nav thật nằm ở TRÊN, do `src/components/layout/DashboardNav.tsx` render trong `src/app/(auth)/layout.tsx`: `Tổng quan · Giỏ hàng · Theo yêu cầu · Đơn hàng · Lịch sử · Hồ sơ` + nút Đăng xuất (`signOut()` → `/`). History + Profile KHÔNG orphan |  
| "Quick Actions: [New Consultation] [Reorder] [Track Order]" | đúng, nhãn Việt: `Tư vấn mới` `/consultation`, `Đặt lại` `/dashboard/reorder`, `Theo dõi đơn` `/dashboard/orders` |
| Lỗi data | `<ErrorState />` thay khối stats (không crash cả trang) |

---

## 8. Payment Flow

Hai payment method: `cod` và `bank_transfer` — **chọn ở checkout / reorder**,
mặc định `cod`. Checkout nằm sau middleware `/dashboard` nên luôn cần đăng nhập.

```
  CUSTOMER                              SYSTEM
     │ chọn "Chuyển khoản" ở checkout      │
     ├─ [Đặt hàng] ──────────────────────►│  POST /api/checkout
     │                                    ├─ payment_status = 'unpaid' (mọi đơn mới)
     │                                    ├─ deposit_amount = total ≥ 5.000.000
     │                                    │     ? round(total × 50%) : 0
     │  modal Thanh toán TỰ MỞ             │     (server tính, client không truyền giá)
     │  (PaymentConfirmationModal)         │
     ├─ xem TK: Vietcombank ·            │
     │  0123 456 789 · CONG TY TNHH       │
     │  BAO BI ABC · Số tiền (đặt cọc     │
     │  50% hoặc full) · Nội dung          │
     │  <order_code>[-<sdt>]               │
     ├─ chọn ảnh chứng từ ≤5MB ──────────►│  POST /api/upload  purpose 'payment-proof'
     │                                    │  → bucket order-files (signed, 1h)
     ├─ [Tôi đã chuyển khoản] ───────────►│  POST /api/orders/{id}/payment
     │   { paymentMethod,                  │  ├─ CAS: eq status + payment_status
     │     paymentProofUrl }               │  │  + payment_proof_url (409 nếu đổi giữa trời)
     │                                    │  ├─ CHỈ đổi payment_method +
     │  ◄── "Payment proof submitted.      │  │  payment_proof_url.
     │      Staff verification is          │  ├─ ⚠️ KHÔNG đổi payment_status,
     │      required before payment        │  │  KHÔNG đổi status đơn
     │      is marked paid."               │  └─ KHÔNG ghi order_status_history
     │                                    │
     │  ...staff xác nhận thủ công:        │
     │  muốn đơn lên deposit_paid thì      │
     │  staff phải PATCH .../status riêng  │
     │  (UI chưa có → hiện làm tay qua      │
     │   Supabase dashboard)               │
```

### 8.1 Sự thật về luồng tiền

| Điều | Thực tế trong code |
|---|---|
| Ai được submit chứng từ | chỉ chủ đơn (`canSubmitPayment`); staff chỉ **xem** (`canViewPayment`) |
| Đơn "payable" | `payment_status === 'unpaid'` **và** `status ∈ {pending, staff_review, confirmed}` (`PAYABLE_ORDER_STATUSES`) |
| COD | POST cùng endpoint, `payment_proof_url` bị ép `null`; message `COD selected. Payment will be collected on delivery.` |
| Ai set `payment_status = deposit_paid` / `paid` | **không ai cả.** Không có code nào ghi 2 giá trị đó → cột này luôn `unpaid` cho tới khi có UI staff/integration |
| Ai set `orders.status = deposit_paid` | staff, qua `PATCH /api/orders/[id]/status` |
| `/payment` page | **không tồn tại** (doc cũ liệt kê sai). `src/app/(public)/payment/` không có |
| Số tài khoản | hard-code trong `BANK_TRANSFER_DETAILS` (`src/app/api/orders/[id]/payment/route.ts`) — placeholder, cần thay bằng số thật hoặc đưa vào env/config |
| `delivery_fee` | luôn `0` khi tạo đơn; không có code tính phí ship |
| VAT | `VAT_PERCENTAGE = 10` tồn tại trong `pricing.ts` nhưng **không được dùng** trong `POST /api/orders` — tổng tiền chưa cộng VAT |

---

## 9. UI Design Principles — đối chiếu code

| Principle | code có làm vậy không |
|---|---|
| **Minimal steps** | ✅ tư vấn = 1 trang, 2 cột, không wizard. ⚠️ mockup thêm 1 bước bắt buộc khi khách chọn in |
| **Clear CTAs** | ✅ mỗi màn 1 primary: `Yêu cầu AI tư vấn` → `Tạo ảnh mockup` → `Thêm vào giỏ` / `Mua ngay` → `Đặt hàng`. Màn kết quả có 2 nút cùng khối vì `Mua ngay` chỉ là tắt qua trang giỏ |
| **Visual feedback** | ✅ `StatusTimeline` 7 bước + skeleton `loading.tsx` từng route. ⚠️ progress % (`getOrderProgress`) chỉ ở list, không ở detail |
| **Mobile-first** | ✅ consultation `max-w-6xl` 1 cột → `lg:grid-cols-[1.2fr_1fr]`; cart + checkout `lg:grid-cols-[minmax(0,1fr)_20rem/22rem]`; timeline scroll ngang (`min-w-[760px]`) |
| **Trust signals** | ⚠️ landing có số liệu nhà máy + ảnh Cloudinary, **chưa có** review/đánh giá khách (không có bảng feedback) |
| **No jargon** | ✅ label tiếng Việt + `sóng B/E/BC/EB` giải thích trong result card; `printPositionLabel` dịch sẵn |
| **Help everywhere** | ⚠️ một phần: footnote mockup, hint `blockedByMockup`. **Không có** tooltip "Why this recommendation?" |
| **Fast** | ✅ AI text trả trong 1 request. ⚠️ mockup là request riêng, quota 3 lần/tư vấn, timeout 24h re-host |

---

## 10. Trang theo hiện trạng (thay cho "Recommended Pages for MVP")

| Trạng thái | Trang | Ghi chú |
|---|---|---|
| ✅ P0 xong | `/` landing | hero sticky + reveal animation |
| ✅ P0 xong | `/consultation` | form + result + panel mockup trong 1 trang |
| ✅ P0 xong | `/consultation/result?id=` | bản full-page của kết quả, chỉ vào được bằng deep link |
| ✅ P0 xong | `/shop` · `/consultation/stock` | hàng có sẵn, thêm giỏ / mua ngay |
| ✅ P0 xong | `/dashboard/cart` · `/dashboard/checkout` | giỏ trộn stock + custom, address book |
| ✅ P0 xong | `/dashboard/custom` | import mẫu đã lưu + tự nhập quy cách |
| 🗑 Đã nghỉ | `/order` | form tạo đơn đã xoá, chỉ còn `redirect('/dashboard/custom')` |
| ✅ P0 xong | `/dashboard` · `/dashboard/orders` · `/orders/[id]` · `/history` · `/reorder` · `/profile` | RSC + URL-state modals (`?orderId=<id>`) |
| ✅ P1 xong | `/login` · `/register` | group `(guest)`; ⚠️ "Quên mật khẩu" link tới route chưa tồn tại |
| ✅ P1 xong | `/pricing` · `/about` | pricing đọc thẳng `VOLUME_TIERS`; about còn ảnh placeholder picsum |
| ✅ P2 xong (khác doc cũ) | mockup in + khuôn bế | **không phải trang riêng** — panel trong `/consultation`, cộng `/dieline-lab` (orphan, không có link vào) |
| ✅ P2 xong | reorder | `POST /api/reorder` + `/dashboard/reorder` |
| ❌ P0 **chưa làm** | `/staff/*` | 5 route đều stub; API PATCH status đã có, UI chưa |
| ❌ P1 chưa làm | trang "quên mật khẩu" | link dead ở `/login` |
| ❌ P2 chưa làm | `/payment` | không tồn tại; mọi luồng tiền chạy trong `PaymentConfirmationModal` |
| ❌ P3 chưa làm | `/api/consultations` · `/api/products` | 501 "Under development" — staff page sau này sẽ cần 2 API này |
| ❌ P3 chưa làm | đánh giá đơn hàng | không có table, không có UI |