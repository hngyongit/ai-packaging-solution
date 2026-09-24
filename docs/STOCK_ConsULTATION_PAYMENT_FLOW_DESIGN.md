# Thiết Kế Luồng Thanh Toán Cho Stock Consultation

## TÓM TẮT YÊU CẦU

Thiết kế lại flow mua thùng carton **có sẵn** (stock products):
1. **Giữ nguyên** flow tư vấn `/consultation` cho custom packaging
2. **Sửa lại** flow `/consultation/stock`:
   - Điền form → AI tìm match → hiển thị kết quả
   - Click **"Mua ngay"** → đến trang checkout → điền thông tin liên lạc
   - Submit checkout → tạo order (status = pending) cho staff review
   - Sau khi staff duyệt → customer quay về dashboard → click **"Thanh toán ngay"**
   - Tạo payos_payment_id → redirect đến PayOS thanh toán
   - Sau khi thanh toán thành công → webhook trả về → cập nhật status order

## PHÂN TÍCH HIỆN TRẠNG

### Luồng current (broken/incomplete):

```
Form → /api/ai/recommend-stock → StockMatches
     ↓
Click "Thêm vào giỏ" → addToCart() → /api/cart POST → vào cart
Click "Mua ngay" → check login → redirect /consultation/stock/checkout ❌ PAGE KHÔNG TỒN TẠI!
```

**VẤN ĐỀ NGHIÊM TRỌNG:**
- `/consultation/stock/checkout` **KHÔNG tồn tại** trong codebase
- Cart hook `useAddToCart.buyNow()` chỉ support route `/dashboard/checkout?items=X` (dành cho cart flow)
- Không có cơ chế "tạm giữ" order từ stock consultation mà không qua cart
- Current checkout route `/api/checkout` yêu cầu `cartItemIds` → phụ thuộc vào cart items

### Files liên quan đang tồn tại:

| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `src/app/(public)/consultation/stock/page.tsx` | ✅ OK | Simple wrapper |
| `src/app/(public)/consultation/stock/stock-consultation-form.tsx` | ✅ OK | Form + fetch AI recommend |
| `src/app/(public)/consultation/stock/stock-result-panel.tsx` | ✅ OK | Panel + StatusBadges |
| `src/app/(public)/consultation/stock/stock-match-card.tsx` | ⚠️ CẦN SỬA | Nút "Mua ngay" redirect sai route |
| `src/components/cart/use-add-to-cart.ts` | ⚠️ CẦN SỬA | buyNow() chỉ support cart flow |
| `src/app/api/checkout/route.ts` | ⚠️ CẦN SỬA | Yêu cầu cartItemIds |
| `src/lib/payos/client.ts` | ✅ OK (fix rồi) | Dùng @payos/node SDK |
| `src/app/api/orders/[id]/payos/create/route.ts` | ⚠️ CẦN SỬA | Need env variable fix |
| `src/lib/payos/webhook.ts` | ✅ OK (fix rồi) | Xử lý webhook + auto-transition |

## THIẾT KẾ MỚI — LUỒNG STOCK CONSULTATION PAYMENT

### Flow hoàn chỉnh mới:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Điền form trên /consultation/stock              │
│ ─────────────────────────                               │
│ User nhập: productType, dimensions, weight, quantity    │
│ Click "Tìm thùng có sẵn"                                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: AI recommend → StockResultPanel                 │
│ ─────────────────────────                               │
│ API: POST /api/ai/recommend-stock                       │
│ Response: [{ productId, productCode, maxDimensions... }] │
│ Hiển thị danh sách matches với confidence score         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Click "Mua ngay"                                 │
│ ─────────────────────────                               │
│ Kiểm tra đăng nhập → Nếu chưa → redirect /login          │
│ Nếu đã → redirect đến /consultation/stock/checkout       │
│ Params: ?productId=X&quantity=Y                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Trang checkout (MỚI)                             │
│ ─────────────────────────                               │
│ Page: src/app/(public)/consultation/stock/checkout.tsx   │
│ Display product info + preview price                    │
│ Form: tên, SĐT, email, địa chỉ, ghi chú                  │
│ Submit: tạo order DIRECTLY (không qua cart!)             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: POST /api/consultation/checkout (MỚI)            │
│ ─────────────────────────                               │
│ Input: productId, quantity, contactInfo                   │
│ Process: validate stock → createOrder → save to DB      │
│ Output: { id, order_code, total_amount }                │
│ Action: redirect to /consultation/stock/success?id=ORDER_ID│
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Redirect to dashboard orders                     │
│ ─────────────────────────                               │
│ After success → redirect to /dashboard/orders/{orderId}  │
│ Order status: pending (chờ staff review)                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 7: Customer waits for staff to approve              │
│ ─────────────────────────                               │
│ Staff reviews in /staff/orders/{id}                      │
│ Changes status → confirmed/deposit_paid                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 8: Customer sees "Thanh toán ngay" button           │
│ ─────────────────────────                               │
│ In /dashboard/orders/{orderId}:                          │
│ Button visible if order.status ∈ PAYABLE_STATUSES        │
│ Click → POST /api/orders/{id}/payos/create               │
│ Response: { paymentUrl, payosPaymentId }                 │
│ Redirect to: window.location.href = paymentUrl           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 9: PayOS payment                                    │
│ ─────────────────────────                               │
│ Customer pays on PayOS checkout page                    │
│ Success → redirect to returnUrl                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 10: Webhook updates order                           │
│ ─────────────────────────                               │
│ PayOS calls: POST /api/payos/webhook                    │
│ Verify checksum → Find order by payos_order_code        │
│ Update: payment_status='paid', status='confirmed'        │
│ Auto-transition: confirmed → production                  │
│ Return: { status: 'Success', message: '...' }            │
└─────────────────────────────────────────────────────────┘
```

## CHI TIẾT IMPLEMENTATION

### A. FILE CẦN TẠO MỚI:

#### 1. `src/app/(public)/consultation/stock/checkout.tsx` (PAGE MỚI)
```tsx
// Component: StockCheckoutPage
// Layout: giống dashboard/checkout nhưng minimal hơn
// Steps:
//   1. Fetch product info từ productId param
//   2. Show product details + estimated price
//   3. Contact info form (name, phone, email, address, notes)
//   4. Submit → POST /api/consultation/checkout
//   5. On success → redirect to /dashboard/orders/{orderId}?created=true
```

#### 2. `src/app/api/consultation/checkout/route.ts` (ROUTE MỚI)
```ts
// POST /api/consultation/checkout
// Input validation: productId(uuid), quantity(positive int), contact info
// Steps:
//   1. Validate stock availability directly (not via cart)
//   2. Calculate total from product basePrice × quantity
//   3. Create order with status='pending'
//   4. Return created order data
// NO CART INVOLVEMENT — direct order creation
```

#### 3. `src/app/(public)/consultation/stock/success.tsx` (PAGE THÀNH CÔNG)
```tsx
// Display confirmation message
// Show order details
// Link to /dashboard/orders/{orderId}
```

### B. FILE CẦN SỬA:

#### 1. `src/app/(public)/consultation/stock/stock-match-card.tsx`
**Change:**
- Remove/add: "Thêm vào giỏ" option remains but optional
- Fix "Mua ngay" to redirect to new checkout page
- Keep existing functionality intact

#### 2. `src/components/cart/use-add-to-cart.ts`
**Change:**
- Add `buyNowDirect()` method for stock consultation
- This bypasses cart and goes straight to checkout

#### 3. `src/app/api/orders/[id]/payos/create/route.ts`
**Change:**
- Replace `req.headers.get('origin')` with `process.env.NEXT_PUBLIC_SITE_URL`
- Ensure proper error handling

#### 4. `src/app/(auth)/dashboard/orders/page.tsx` hoặc detail page
**Change:**
- Add "Thanh toán ngay" button when order qualifies
- Handle PayOS redirect

#### 5. `src/lib/payos/webhook.ts`
**Change:**
- Already fixed — verify final implementation is correct

### C. ORDER STATUS FLOW MỚI CHO STOCK PRODUCTS:

```
pending → staff_review → confirmed/deposit_paid → production → completed → delivered
                                                    ↑
                                          (PayOS payment required here)
```

- Khi tạo đơn từ stock consultation: `status=pending`
- Sau staff review approved: `status=confirmed` hoặc `status=deposit_paid` (nếu có deposit threshold)
- Chỉ khi `payment_method === 'payos'` AND `status ∈ ['confirmed', 'deposit_paid']` mới có nút "Thanh toán ngay"
- Sau webhook confirm: `payment_status=paid`, tự động transition `status=production`

## CHECKLIST IMPLEMENTATION

### Phase 1: Tạo checkout page cho stock consultation
- [ ] Tạo `src/app/(public)/consultation/stock/checkout.tsx`
- [ ] Tạo `src/app/api/consultation/checkout/route.ts`
- [ ] Test endpoint với cURL trước khi connect frontend

### Phase 2: Fix stock-match-card redirect
- [ ] Update `handleBuyNow()` function
- [ ] Redirect to `/consultation/stock/checkout?productId=X&quantity=Y`
- [ ] Keep "Thêm vào giỏ" button for alternative flow

### Phase 3: Đảm bảo payment creation flow
- [ ] Fix `src/app/api/orders/[id]/payos/create/route.ts` URL building
- [ ] Ensure `NEXT_PUBLIC_SITE_URL` used instead of `req.headers.get('origin')`
- [ ] Test PayOS link creation manually

### Phase 4: Dashboard order detail button
- [ ] Add conditional "Thanh toán ngay" button
- [ ] Only show when order is payable (status in PAYABLE_STATUSES)
- [ ] Handle loading state and error display

### Phase 5: Test end-to-end
- [ ] Test full flow từ form → checkout → order created → PayOS payment → webhook
- [ ] Verify all status transitions correct
- [ ] Verify webhook updates order correctly

## LƯU Ý QUAN TRỌNG

1. **Không phá vỡ current checkout flow** — `/dashboard/checkout` và `/api/checkout` phải tiếp tục hoạt động cho custom cart products
2. **Stock consultation checkout** là flow SEPARATE — không依赖 vào cart system
3. **Webhook verification** phải đúng format — PayOS v2 expects sorted queryString
4. **Environment variables** phải đầy đủ: `PAYOS_*` + `NEXT_PUBLIC_SITE_URL` (https:// với ngrok)
5. **Security**: Tất cả API endpoints phải validate auth/ownership properly
