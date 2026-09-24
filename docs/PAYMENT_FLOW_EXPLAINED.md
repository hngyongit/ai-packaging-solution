# Payment Flow — Giải Thích Chi Tiết

## Tổng Quan

Hệ thống hỗ trợ 3 phương thức thanh toán:
- **COD** (Cash on Delivery) — Thanh toán khi nhận hàng
- **Bank Transfer** — Chuyển khoản ngân hàng  
- **PayOS** — Thanh toán qua cổng PayOS

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Customer   │────▶│ Checkout API │────▶│  Create Order │───▶│  Staff Review│
│   (Cart)     │     │ /api/checkout │     │ /api/orders   │    │ (pending)   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────┬──────┘
                                                                      │
                                                       ┌──────────────▼──────────────┐
                                                       │   Paid?                     │
                                                       ├───────────┬─────────────────┤
                                                        No         Yes                │
                                                        │            │                │
                                                    ┌─────▼─────┐ ┌─▼──────────────┐    │
                                                    │ Staff    │ │ payos/create │    │
                                                    │ Confirms │ │ (PayOS link) │    │
                                                    └─────┬─────┘ └─┬──────────────┘    │
                                                          │                 │        │
                                                      ┌───▼──────┐   ┌───▼──────┐      │
                                                      │ Deposit  │   │ PayOS    │      │
                                                      │ paid?    │   │ webhook  │      │
                                                      └────┬─────┘   └───▲──────┘      │
                                                           │          │              │
                                                           │     ┌────┴────┐         │
                                                          No      │ Paid    │Yes       │
                                                               └────┬────┘         │
                                                                    │               │
                                                              ┌─────▼──────┐    │
                                                              │ Staff      │◄───┘
                                                              │ moves to   │
                                                              │ production │
                                                              └────────────┘
```

---

## Chi Tiết Từng Endpoint

### 1. POST `/api/checkout` — Tạo đơn từ giỏ hàng

**Mục đích:** Validate tồn kho → tạo order → xóa cart items.

**Luồng:**
```
Client sends { cartItemIds, paymentMethod, addressId }
    │
    ▼
① Validate auth (getAuthenticatedProfile)
    │
    ▼
② Validate zod schema (cartItemIds min 1, paymentMethod enum)
    │
    ▼
③ assertStockAvailable(profile.id, cartItemIds)
   → Kiểm tra từng dòng trong cart:
     - Nếu kind === 'custom': bỏ qua stock check
     - Nếu kind === 'stock': kiểm tra line.quantity > product.stockQuantity
     → Trả về { lines: CartLine[], issues: StockIssue[] }
    │
    ▼
④ getAddressForCheckout(profile.id, addressId)
   → Lấy địa chỉ thực tế từ customer_addresses DB (không tin dữ liệu client gửi lên)
    │
    ▼
⑤ createOrderWithItems(...input, profile)
   → Insert vào `orders` với status = 'pending', payment_status = 'unpaid'
   → Insert các `order_items` tương ứng
   → Insert `order_status_history` (from_status=null → to_status='pending')
   → Trả về created order
    │
    ▼
⑥ clearCartItems(profile.id, cartItemIds)
    │
    ▼
⑦ Return { data: { id, order_code, total_amount, payment_method } }
```

**File:** [`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts), [`src/lib/data/orders-create.ts`](../src/lib/data/orders-create.ts)

**关键点:**
- Tồn kho được check SERVER-SIDE (hard block nếu vượt quá)
- Địa chỉ lấy từ DB, không phải từ input client
- Order luôn bắt đầu ở status `'pending'` (chờ staff duyệt)
- Sau khi tạo thành công → xóa cart items → refresh cart badge

---

### 2. POST `/api/orders/[id]/payos/create` — Tạo link thanh toán PayOS

**Mục đích:** Customer tạo một link thanh toán PayOS cho đơn hàng của họ.

**Auth:** Chỉ customer là owner của order (checked `order.customer_id === profile.id`).

**Luồng:**
```
GET order by ID
    │
    ▼
① Check: order exists + customer_id matches
    │
    ▼
② Check: !order.payment_status === 'paid' (chưa thanh toán)
    │
    ▼
③ Check: total_amount > 0
    │
    ▼
④ Check: !order.payos_payment_id (chưa có link nào trước đó)
    │
    ▼
⑤ Check: order.status ∈ PAYABLE_STATUSES
   PAYABLE_STATUSES = ['pending', 'staff_review', 'confirmed', 'deposit_paid']
    │
    ▼
⑥ Generate unique orderCode = timestamp-based (6-digit min)
    │
    ▼
⑦ Call createPaymentLink(orderCode, totalAmount, description, returnUrl)
   → PayOS API v2
   → Headers: X-ClientId, X-API-Key, X-Paysignature (HMAC-SHA256)
   → Body: { orderCode, amount, description, cancelUrl, returnUrl }
    │
    ▼
⑧ Save payos_payment_id to orders table
    │
    ▼
⑨ Return { paymentUrl, payosPaymentId }
```

**File:** [`src/app/api/orders/[id]/payos/create/route.ts`](../src/app/api/orders/%5Bid%5D/payos/create/route.ts)

**关键点:**
- Mỗi order chỉ tạo được 1 link PayOS duy nhất
- Link chỉ valid khi order chưa được thanh toán
- Sau khi tạo → redirect customer đến PayOS URL
- `payos_payment_id` được lưu để webhook có thể tìm đúng order

---

### 3. POST `/api/payos/webhook` — Xử lý callback từ PayOS

**Mục đích:** Khi customer hoàn tất thanh toán trên PayOS → PayOS gọi webhook này.

**Auth:** Public endpoint (gọi từ server PayOS, không cần auth).

**Luồng (đơn giản):**
```
① Verify checksum HMAC-SHA256 từ PayOS payload
   → Không match? return 400 'Invalid checksum'
    │
    ▼
② Chỉ process khi body.status === 'paid'
   → Các status khác (cancelled) ignore
    │
    ▼
③ Find order by payos_payment_id (orderCode)
   → Không tìm thấy? return 200 (don't retry unknown orders)
    │
    ▼
④ Idempotency check: nếu payment_status === 'paid' rồi → skip
    │
    ▼
⑤ Amount verification: total_amount !== webhook.amount → log error, return success
   (Don't auto-update — let staff handle manually)
    │
    ▼
⑥ Update order: set payment_status = 'paid', payment_method = 'payos'
    │
    ▼
⑦ Auto-transition: nếu order status ∈ ['confirmed', 'deposit_paid']
   → Move to 'production'
   → Log history entry
    │
    ▼
⑧ Log payment confirmation in order_status_history
   → notes: "Đã thanh toán qua PayOS — Transaction: XXX"
    │
    ▼
⑨ Return { status: 'Success' }
```

**File:** [`src/lib/payos/webhook.ts`](../src/lib/payos/webhook.ts), [`src/app/api/payos/webhook/route.ts`](../src/app/api/payos/webhook/route.ts)

**关键点:**
- Webhook MUST be idempotent (PayOS có thể retry nhiều lần)
- Amount mismatch → NOT automatic fail, just log and return success
- Chỉ auto-transition confirmed/deposit_paid → production
- pending/staff_review vẫn đứng yên, chờ staff xác nhận thủ công

---

## Chi Tiết Database Schema

### Table: `orders` (relevant columns)

| Column | Type | Description |
|--------|------|-------------|
| `status` | text | Status workflow: pending → staff_review → confirmed → deposit_paid → production → completed → delivered |
| `payment_status` | text | 'unpaid' \| 'deposit_paid' \| 'paid' |
| `payment_method` | text | 'cod' \| 'bank_transfer' \| 'payos' (CHECK constraint) |
| `total_amount` | numeric | Tổng tiền đơn hàng |
| `deposit_amount` | numeric | Tiền đặt cọc (nếu total ≥ threshold) |
| `payos_payment_id` | text | External PayOS transaction ID |
| `customer_id` | uuid | FK → profiles.id |

### Table: `order_status_history`

| Column | Type | Description |
|--------|------|-------------|
| `order_id` | uuid | FK → orders.id |
| `from_status` | text | Previous status (nullable for initial) |
| `to_status` | text | New status |
| `changed_by` | uuid | FK → profiles.id (who triggered the change) |
| `notes` | text | Free-text explanation |
| `created_at` | timestamptz | When status changed |

---

## Chi Tiết Client-Side (Frontend)

### checkout-form.tsx — Form thanh toán

```tsx
// State management
const [serverError, ...] = useState('') // Server-side validation errors
const [issues, ...] = useState([]) // Stock issues (409 conflict)
const [createdOrder, ...] = useState(null) // Success response
const [selectedPaymentMethod, ...] = useState('cod') // Last chosen method

// onSubmit flow
async function onSubmit(values) {
  // 1. Call /api/checkout with cart IDs + payment method + addressId
  const response = await fetch('/api/checkout', { ... })
  
  // 2a. Handle 409 — stock issues
  if (response.status === 409 && body?.issues) {
    setIssues(body.issues) // Show what's overstock
    return
  }
  
  // 2b. Handle other errors
  if (!response.ok) {
    setServerError(translateCheckoutError(body?.error))
    return
  }
  
  // 2c. Success!
  notifyCartUpdated() // Updates cart badge in navbar
  setSelectedPaymentMethod(method)
  setCreatedOrder(body.data) // Shows success UI
}
```

### checkout-parts.tsx — CheckoutSuccess component

```tsx
export function CheckoutSuccess({ order, paymentMethod }) {
  async function payWithPayOS() {
    // Redirect to PayOS for checkout
    const res = await fetch(`/api/orders/${order.id}/payos/create`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.paymentUrl) {
      window.location.href = data.paymentUrl
    }
  }
  
  useEffect(() => {
    // Auto-trigger PayOS redirect when payment method is PayOS
    if (paymentMethod === 'payos') {
      void payWithPayOS()
    }
  }, [paymentMethod])
  
  // Render success card with order info + CTA buttons
}
```

**关键点:**
- Khi chọn PayOS → tự động redirect ngay sau khi order tạo xong
- Khi chọn COD/Bank Transfer → customer chờ staff xác nhận
- Sau khi redirect PayOS → customer trở lại site → webhook sẽ cập nhật payment_status

---

## PayOS Integration Details

### Env Variables Required

```bash
PAYOS_CLIENT_ID=<your merchant ID from dashboard>
PAYOS_API_KEY=<admin API key>
PAYOS_CHECKSUM_KEY=<checksum signing key>
```

### Signature Algorithm

```javascript
// For creating payment links:
requestBody = JSON.stringify({
  orderCode, amount, description, cancelUrl, returnUrl
})
signature = HMAC-SHA256(requestBody, CHECKSUM_KEY)
headers = {
  'X-ClientId': CLIENT_ID,
  'X-API-Key': API_KEY,
  'X-Paysignature': signature
}
```

### Webhook Verification

```javascript
// Incoming webhook payload contains webhookChecksum
verifyWebhookChecksum(payload):
  remove webhookChecksum from payload
  compute = HMAC-SHA256(JSON.stringify(rest), CHECKSUM_KEY)
  return compute === provided_webhookChecksum
```

**Note:** PayOS v2 API expects:
- `amount` as integer (rounded)
- `description` must be ≤ 255 characters
- `returnUrl` must be HTTPS
- `cancelUrl` must be HTTPS

---

## Error Handling Summary

| Scenario | Error Response | Action |
|----------|---------------|--------|
| Unauthorized (no session) | 401 `{ error: 'Unauthorized' }` | Redirect to login |
| Cart not found / empty | 409 `{ error: 'Giỏ hàng đã thay đổi...' }` | Reload page |
| Overstock detected | 409 `{ issues: [...] }` | Show issues, let user adjust quantity |
| Invalid form data | 400 `{ details: {...} }` | Display validation errors in form |
| PayOS already paid | 400 `{ error: 'Order already paid' }` | Refresh order status |
| Non-payable status | 400 `{ error: 'Cannot create payment link...' }` | Wait for staff to confirm |
| PayOS creation fails | 500 `{ error: err.message }` | Display error message |
| Webhook checksum invalid | 400 `{ status: 'Failure' }` | Ignore (malicious/replay) |
| Webhook amount mismatch | 200 `{ status: 'Success' }` | Log, let staff handle manually |

---

## Lưu Ý Quan Trọng

1. **RLS (Row Level Security)**: Tất cả query đi qua admin client (bypass RLS). Điều này có nghĩa staff/customer chỉ có thể thao tác thông qua API route, không truy cập trực tiếp database.

2. **Idempotency**: Webhook handler phải an toàn với duplicate calls. Sử dụng `payment_status === 'paid'` làm guard chính.

3. **Concurrency**: Có race condition tiềm ẩn giữa webhooks từ PayOS và manual updates từ staff. Hiện tại đang dùng optimistic approach (webhook overwrite, staff override khi cần).

4. **Missing route**: File `src/app/api/orders/[id]/payos/status/route.ts` hiện chứa code của `products-admin.ts` — cần tạo lại route này để check trạng thái thanh toán real-time từ phía client.

5. **Deposit logic**: Theo pricing config, nếu total_amount ≥ DEPOSIT_THRESHOLD thì tự động tính deposit = total × DEPOSIT_PERCENTAGE. Customer phải thanh toán deposit trước khi sản xuất.
