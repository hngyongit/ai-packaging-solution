# Payment Flow — Giải Thích Chi Tiết

## Tổng Quan

Hai phương thức thanh toán:

| Phương thức | Thu tiền thế nào |
|---|---|
| **COD** | Không thu trước. Đơn vị vận chuyển thu hộ toàn bộ khi giao. |
| **bank_transfer** | Khách chuyển khoản qua **PayOS**. PayOS là *cơ chế thi hành* của chuyển khoản, **không phải** một phương thức riêng. |

**Cọc (deposit)** — lớp chống rủi ro cho đơn lớn, độc lập với phương thức:

```
total_amount ≥ 5.000.000đ  →  deposit_amount = total × 50%
```

Đơn đạt ngưỡng **phải cọc trước khi sản xuất, kể cả đơn COD**. Phần còn lại thu khi giao (COD) hoặc qua PayOS (bank_transfer).

`payment_status`: `unpaid` → `deposit_paid` → `paid`

Nguồn sự thật duy nhất cho các luật này: [`src/lib/data/order-payment.ts`](../src/lib/data/order-payment.ts) — server và UI dùng chung, không chép lại luật ở hai chỗ.

```
┌─────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  Customer    │──▶│ POST          │──▶│ orders       │──▶│ Staff review │
│  (cart)      │   │ /api/checkout │   │ status=      │   │ /confirm     │
└─────────────┘   └───────────────┘   │ pending      │   │ → confirmed  │
                                       │ payment_     │   │ (trừ kho)    │
                                       │ status=unpaid│   └──────┬───────┘
                                       └──────────────┘          │
                                                                 ▼
                                        ┌────────────────────────────────────┐
                                        │ Đơn có cọc?                        │
                                        ├──────────────┬─────────────────────┤
                                        │  Có          │  Không              │
                                        ▼              ▼                     │
                              ┌─────────────────┐  ┌──────────────────────┐  │
                              │ Khách trả cọc   │  │ COD: không thu trước │  │
                              │ qua PayOS       │  │ bank_transfer: trả   │  │
                              │ → deposit_paid  │  │ toàn bộ qua PayOS    │  │
                              └────────┬────────┘  └──────────┬───────────┘  │
                                       │                      │              │
                                       └──────────┬───────────┘              │
                                                  ▼                          │
                                    ┌───────────────────────────┐            │
                                    │ canEnterProduction()?     │            │
                                    │ đủ cọc / không cần cọc    │            │
                                    └─────────────┬─────────────┘            │
                                                  ▼                          │
                                          ┌──────────────┐                   │
                                          │ production   │◀──────────────────┘
                                          └──────────────┘
```

---

## Luật thanh toán — `src/lib/data/order-payment.ts`

| Hàm | Ý nghĩa |
|---|---|
| `orderRequiresDeposit(order)` | `deposit_amount > 0` **và** `total ≥ DEPOSIT_THRESHOLD` |
| `getOutstandingAmount(order)` | Số tiền phải trả lần kế tiếp. Chưa cọc → cọc (nếu có); đã cọc → phần còn lại; COD không cọc → **0** |
| `canPayViaPayOS(order)` | Còn nợ tiền **và** status ∈ `confirmed`/`deposit_paid`/`production`. Staff phải xác nhận và **chốt giá trước**, rồi khách mới nhận mail mời thanh toán — thu tiền trên giá tạm tính là thu sai số, kể cả tiền cọc (cọc tính theo % giá cuối). |
| `canEnterProduction(order)` | Đơn phải cọc → chỉ khi `payment_status === 'deposit_paid'` hoặc `'paid'` |

`canEnterProduction()` được enforce ở **hai lớp**:
1. `validateTransition()` — chặn PATCH status khi role staff
2. `transitionOrderStatus()` — phòng thủ, chặn cả đường gọi thẳng hàm

---

## Các Endpoint

### 1. POST `/api/checkout` — Tạo đơn từ giỏ hàng

`cartItemIds[]`, `paymentMethod` (`cod` | `bank_transfer`), `addressId`, `notes`.

```
① Auth → ② zod → ③ assertStockAvailable (hard block, 409 + issues)
→ ④ getAddressForCheckout (đọc DB, không tin text client)
→ ⑤ createOrderWithItems: status=pending, payment_status=unpaid,
     deposit_amount = total ≥ 5tr ? total×50% : 0
→ ⑥ clearCartItems → 201
```

File: [`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts), [`src/lib/data/orders-create.ts`](../src/lib/data/orders-create.ts)

### 2. POST `/api/orders/[id]/payos/create` — Tạo link PayOS

Auth: customer sở hữu đơn. Tạo link cho **đúng số tiền còn nợ** (`getOutstandingAmount`), không phải luôn `total_amount`.

```
① owner check → ② đã có payos_payment_id? → 409 (trả link cũ)
→ ③ canPayViaPayOS? → 400 kèm lý do (chưa chốt giá / không còn nợ)
→ ④ link cũ còn mở (PayOS báo PENDING/PROCESSING)? → trả lại chính link đó (`reused: true`)
→ ⑤ amount = getOutstandingAmount(order); isDeposit = đơn phải cọc && chưa cọc
→ ⑤ createPaymentLink(orderCode, amount, ...)
→ ⑥ lưu payos_payment_id, payos_order_code, payos_amount
```

`payos_amount` là mốc để webhook đối chiếu — chống ghi nhận thiếu tiền.
`payos_checkout_url` lưu URL của link đang mở: khách rời đi rồi quay lại đơn vẫn bấm trả tiếp được, không phải tạo link mới.

File: [`src/app/api/orders/[id]/payos/create/route.ts`](../src/app/api/orders/%5Bid%5D/payos/create/route.ts)

### 3. POST `/api/payos/webhook` — Callback từ PayOS

Public endpoint. Chữ ký HMAC-SHA256 trên các field **đã sắp xếp** của `body.data`.

```
① Verify checksum → sai: 400
② status cancelled/failed → xoá payos_payment_id/payos_amount, mở lại đường tạo link. 200
③ Tìm đơn: payos_payment_id → payos_order_code → transactionId
④ Idempotency: payment_status === 'paid' → bỏ qua
⑤ Đối chiếu amount < payos_amount → 400, KHÔNG ghi nhận
⑥ Chưa cọc mà đơn phải cọc → lần này là CỌC (deposit_paid)
   Đã cọc → TẤT TOÁN (paid)
⑦ Ghi order_status_history
⑧ canEnterProduction() && status ∈ [confirmed, deposit_paid]
   → production (CAS theo status cũ, + history)
```

File: [`src/lib/payos/webhook.ts`](../src/lib/payos/webhook.ts)

> Webhook **không** tự đẩy đơn COD sang production — đơn COD không cọc không có callback nào. Staff dùng nút "Chuyển sang sản xuất" ở `/staff/orders/[id]`, và nút đó cũng bị chặn nếu chưa cọc.

### 4. GET/POST `/api/orders/[id]/payment` — Xem / đổi phương thức

Không còn upload minh chứng chuyển khoản. Đổi phương thức chỉ khi `payment_status === 'unpaid'` và status chưa qua sản xuất.

### 5. Nút "Thanh toán ngay" hiện ở đâu

Cùng một luật `canPayViaPayOS()` cho cả hai chỗ, không chép điều kiện:

| Màn hình | Nút hiện khi |
|---|---|
| `/dashboard/checkout` (ngay sau khi đặt) | **không bao giờ** — chỉ báo "chờ nhân viên xác nhận" |
| `/dashboard/orders/[id]` (quay lại sau) | đơn đã chốt giá, còn nợ tiền |

Sau khi đặt, đơn luôn ở `pending` và giá còn tạm tính → chưa mời trả. Staff xác nhận xong (`confirmed`) thì hệ thống gửi mail hướng dẫn; lúc đó khách vào đơn mới thấy nút.

Trang chi tiết đọc `orders.payos_checkout_url`: còn link thì bấm là đi thẳng sang PayOS, không có thì gọi API tạo link. Nhãn đổi theo bước thu — "Đặt cọc ngay" / "Thanh toán phần còn lại" / "Thanh toán ngay".

> Đơn COD không cọc không bao giờ có nút: không thu trước, đơn vị vận chuyển thu hộ khi giao.
> Đơn COD **có** cọc vẫn có nút — cọc áp dụng bất kể phương thức.

### 6. Mail thông báo cho khách

Gửi tự động trong `transitionOrderStatus()` — một chỗ, phủ mọi đường đổi trạng thái (staff UI, `/confirm`, `/approve`, PATCH status, webhook).

| Mốc | Nội dung |
|---|---|
| `confirmed` | Đã chốt giá + **bước tiếp theo** (đặt cọc / thanh toán / chờ giao) |
| `deposit_paid` | Đã nhận cọc |
| `production` / `completed` / `delivered` | Tiến độ |
| `cancelled` | Đã hủy |

Nút trong mail bám theo `getOrderNextStep()` — cùng luật thanh toán, không hardcode. Đơn COD không cọc nhận mail nói rõ "không cần trả trước, thu hộ khi giao".

**Mail không bao giờ làm hỏng giao dịch**: `sendOrderEmail()` bắt mọi lỗi và trả `false`; thất bại được ghi vào `order_status_history` để staff biết mà gọi lại khách. Thiếu `contact_email` thì bỏ qua, chỉ log.

File: [`src/lib/mail/order-mail.ts`](../src/lib/mail/order-mail.ts), transporter dùng chung ở [`src/lib/mail/transport.ts`](../src/lib/mail/transport.ts) (Gmail SMTP, chung với OTP).

---

## Bảng lỗi

| Tình huống | Response | Việc cần làm |
|---|---|---|
| Chưa đăng nhập | 401 | Đăng nhập |
| Vượt tồn kho | 409 + `issues` | Giảm số lượng |
| Đơn chưa chốt giá mà tạo link | 400 `Đơn chưa được chốt giá…` | Chờ staff xác nhận |
| Đã có link PayOS đang mở | 409 + `existingPaymentId` | Dùng link cũ |
| Checksum webhook sai | 400 | Bỏ qua (giả mạo/replay) |
| Số tiền webhook < `payos_amount` | 400 | Không ghi nhận, kiểm tra thủ công |
| Chuyển production khi chưa cọc | 409 `Đơn từ 5.000.000đ phải đặt cọc 50%…` | Thu cọc trước |

---

## Env

```bash
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
NEXT_PUBLIC_SITE_URL=   # https, dùng cho returnUrl/cancelUrl
```

## Lưu Ý

1. **RLS**: mọi query đi qua admin client (service role). Khách/staff chỉ thao tác qua API route.
2. **Idempotency**: `payment_status === 'paid'` là guard chính; webhook an toàn với retry.
3. **Sau khi thu tiền, `payos_payment_id` bị xoá** để lần thu tiếp theo (phần còn lại sau cọc) tạo được link mới. `payos_transaction_id` giữ lại để tra cứu.
4. **Self-check**: `npx tsx scripts/order-payment-selfcheck.mts` (luật cọc/thanh toán) và `npx tsx scripts/order-mail-selfcheck.mts` (nội dung mail theo từng bước).
