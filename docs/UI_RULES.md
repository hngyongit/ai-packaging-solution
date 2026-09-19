# UI Rules — Tasteskill Implementation Layer

> **This file is the implementation layer for `.agents/skills/design-taste-frontend/SKILL.md`**
> The Tasteskill governs the **design direction** (what). This file provides the **concrete tokens + classes actually used in this codebase** (how).
> **Always read the Tasteskill first, then use this file for exact classes.**
>
> ⚠️ Bản trước của file này mô tả một design system *mong muốn* (Geist, Radix, hex palette) chưa từng tồn tại trong repo.
> Từ bản này, mọi giá trị đều đối chiếu đĩa ngày 16/09/2026: `src/app/globals.css`, `tailwind.config.ts`, `components.json`, `src/components/ui/*`.
> Quy nào code chưa tuân theo thì ghi rõ **(chưa tuân)**, không xóa rule.

---

## 0. How This Works with the Tasteskill

### Workflow

```
1. Read Tasteskill → infer Design Read → set Three Dials
2. Come here for concrete classes (chỉ dùng class/token có thật ở đây)
3. Generate UI following both
```

### Three Dials → mapping thật của project

| Dial | Low (1-3) | Medium (4-6) | High (7-10) | **Project đang ở** |
|---|---|---|---|---|
| **VARIANCE** | Centered, symmetrical, grid-aligned | Split layouts, asymmetric whitespace | Off-grid, overlapping, artsy | **4–5**: landing split hero; consultation `lg:grid-cols-[1.2fr_1fr]`; order `[minmax(0,1fr)_24rem]` |
| **MOTION** | Static, no animations | Scroll-reveal, hover transitions | Sticky-stack, parallax, physics | **6–7 riêng cho landing** (sticky hero + reveal + float); dashboard vẫn mức 2 (`transition-colors` + skeleton) |
| **DENSITY** | Max whitespace, large type | Balanced, standard spacing | Compact, data-dense | **~5**: marketing rộng rãi; form dùng primitive compact (`h-8` inputs) |

### Design Read Declaration

Before any UI code, output one line:
```
Design Read: <page kind> for <audience>, with a <vibe> language, leaning toward <aesthetic>.
```

Example for this project:
```
Design Read: Landing page for manufacturing B2B buyers, with a clean industrial language, leaning toward restrained Tailwind + shadcn(base-nova) + factory photography.
```

---

## 1. Design Token System

### Colors — oklch CSS variables (`src/app/globals.css`, `@layer base`)

Tailwind map: `theme.extend.colors` nối thẳng `var(--*)` (`bg-primary`, `text-muted-foreground`, `border-input`, `ring-ring`…). KHÔNG hard-code hex mới.

| Token | Light (`:root`) | Dark (`.dark`) | Vai trò |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | nền trang — áp qua `body { @apply bg-background text-foreground }` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | chữ chính |
| `--card` / `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | bề mặt nổi |
| `--primary` | `oklch(0.51 0.23 264)` /* blue-600 */ | `oklch(0.922 0 0)` | hành động chính — **công nghiệp xanh, không purple** |
| `--secondary` / `--muted` / `--accent` | `oklch(0.97 0 0)` (neutral 50) | `oklch(0.269 0 0)` | nền phụ |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | lỗi/hủy |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | viền card/bảng |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | viền input |
| `--ring` | `oklch(0.51 0.23 264)` /* blue-600 */ | `oklch(0.65 0.23 264)` | focus ring |
| `--chart-1..5` | grayscale ramp | grayscale ramp | placeholder — **chưa chart nào dùng** (`recharts` không có trong deps) |
| `--sidebar-*` | neutral ramp | neutral ramp | placeholder shadcn — dashboard nav KHÔNG dùng (xem §3.13) |

**Quy tắc màu:**
- **One palette** — toàn bộ trung tính là **cool gray** (oklch chroma 0). ⚠️ **(chưa tuân toàn phần)**: 54 file `.tsx` vẫn hard-code `gray-*`/`blue-*`/`emerald-*` của Tailwind thay vì token. `gray` (cool) và `slate` **không trộn** — repo đang chuẩn hóa quanh `gray-*`, số `slate` xuất hiện chủ yếu trong `rgba()` bóng đổ. Migration dần: mỗi lần sửa file nào thì đổi file đó sang token.
- **No AI purple glow** ✅ đang tuân thủ — accent duy nhất là blue-600; amber chỉ cho cảnh báo (`ProtectionBox` nền `bg-amber-50`).
- **Shadows tinted**: `shadow-[0_12px_36px_rgba(15,23,42,0.06)]` (StatusTimeline) — tint blue-slate, không pure black.
- **Dark mode: INERT.** `.dark` block có đủ token và 6 file có class `dark:`, nhưng: `tailwind.config.ts` KHÔNG có `darkMode` key (mặc định `media`) và **không có code nào toggle** (`classList.add('dark')` không tồn tại). Đừng thêm `dark:` variant vào PR mới cho tới khi có theme switcher — chúng không chết, nhưng không ai thấy để review.

### Typography

```css
/* REAL: Inter qua next/font (src/app/layout.tsx), biến --font-sans */
font-sans: Inter, system-ui, sans-serif   /* html className="font-sans" + inter.variable */
font-mono: ui-monospace, monospace
```

⚠️ Tasteskill nói "Inter discouraged" — project này **chọn Inter có ý thức** (B2B VN, cần fallback hệ thống nhẹ). Rule được override ở đây; ghi lại để ai đọc skill gốc khỏi "fix" thành Geist.

`font-heading`: `card.tsx` và `dieline-lab` dùng class `font-heading`, nhưng **không có `font-heading` trong `theme.extend.fontFamily`** — Tailwind bỏ qua class này (biến `--font-heading: var(--font-sans)` trong `.theme` không nối vào config). Hệ quả: heading đang render bằng sans như mọi thứ khác. hoặc thêm `heading: ['var(--font-sans)']` vào config, hoặc bỏ class.

Type scale ĐANG DÙNG THẬT (không phải scale tưởng tượng):

| Vai trò | Class thật | Ví dụ |
|---|---|---|
| Display hero | `text-4xl md:text-5xl` (+tracking-tight) | landing hero |
| H1 trang con | `text-2xl font-bold tracking-tight text-foreground` | `/dashboard/orders`, reorder |
| H1 lớn hơn | `text-2xl … sm:text-3xl` | order detail "Theo dõi tiến độ yêu cầu" |
| H1 form | `text-3xl font-bold` + sub `text-sm text-muted-foreground` | `/consultation` |
| Section title | `text-xl font-semibold` / `text-2xl font-bold sm:text-3xl` | dashboard, landing |
| Card title | `text-base font-semibold` (`CardTitle`) | cards |
| Body | `text-sm` (form) / `text-base text-gray-600` (marketing) | — |
| Meta | `text-xs text-muted-foreground`, `text-[11px] text-gray-400/500` | footnote mockup, ngày timeline |

### Spacing

```css
/* Standard Tailwind defaults — KHÔNG có screens/spacing override */
page-section:       py-16 md:py-24      /* marketing */
page-tight:         px-4 py-10 sm:px-6 lg:px-8   /* /shop, /pricing, /consultation wrapper */
card-padding:       p-4 … p-8 tùy biến qua Card(variant size sm|default)
component-gap:      gap-4 / gap-6 / space-y-6
section-gap:        space-y-8            /* dashboard root */
input-block:        space-y-1            /* label + control (components/consultation/fields) */
container:          max-w-7xl (marketing/dashboard list) · max-w-6xl (consultation) · max-w-5xl (timeline card, modal xl)
```

### Border Radius

```css
/* REAL: scale derive từ một biến */
--radius: 0.625rem;                      /* = 10px */
rounded-lg  = var(--radius)              /* 10px — button, input, textarea, card-ish */
rounded-md  = calc(var(--radius) - 2px)  /* 8px  — select trigger nhỏ, chip */
rounded-sm  = calc(var(--radius) - 4px)  /* 6px */
rounded-xl  = mặc định Tailwind 12px     /* Card + Modal content */
rounded-full / rounded-4xl               /* badge pill */
```

⚠️ Button/Input primitive đã là `rounded-lg`; **đừng** thêm `rounded-md` chồng lên. Các file cũ chưa migration vẫn dùng `rounded-md` cho ảnh/skeleton thô (thumbnail ở `custom/saved-profile-cards.tsx`, `dashboard/loading.tsx`) — giữ nguyên khi không sửa file đó, đổi sang token khi có việc.

### Shadows

```css
card:        ring-1 ring-foreground/10   /* Card THẬT dùng ring, không shadow */
elevated:    shadow-[0_12px_36px_rgba(15,23,42,0.06)]   /* StatusTimeline */
hover-card:  hover:shadow-md transition-shadow          /* landing product cards */
modal:       shadow-lg + backdrop bg-black/50
```

---

## 2. Motion System

`motion` v11 là dependency, nhưng **đừng mặc định dùng nó**. Cơ chế chuẩn của project là CSS-first:

### 2.1 Scroll-reveal chuẩn (landing) — CSS + IntersectionObserver

```tsx
// src/app/(public)/page.tsx — khối nội dung:
<div data-reveal className="reveal">…</div>

// useEffect (client):
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible')
        io.unobserve(e.target)            // ONE-WAY: hiện rồi giữ nguyên
      }
    }
  },
  { threshold: 0, rootMargin: '0px 0px -35% 0px' },  // block phải vào ≥35% viewport
)
```

```css
/* globals.css — root trang phải mang class `reveal-init` (đang là
   <div className="overflow-x-clip reveal-init"> ở page.tsx:147); từng block
   bên dưới mang class `reveal`. CSS chỉ áp opacity:0 khi có .reveal-init
   => nếu quên bọc root, nội dung hiển thị bình thường (fail-safe). */
.reveal-init .reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity 1s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-init .reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal-init .reveal { transform: none; transition: opacity 1s ease; }
  /* Fade GIỮ LẠI, chỉ bỏ slide — blanket opt-out từng làm ẩn nội dung
     trên Win11 tắt animation effects / remote desktop / battery saver. */
}
```

Lý do không dùng `whileInView` ở landing: comment trong code ghi "motion's whileInView was unreliable on this page".

### 2.2 `FadeIn` (motion/react) — chỉ `/about`

`src/components/ui/FadeIn.tsx` — component khớp spec cũ (`whileInView`, `viewport={{ once: true, amount: 0.3 }}`, ease `[0.16,1,0.3,1]`, `useReducedMotion()` fallback plain div). Caller DUY NHẤT: 4 section trong `src/app/(public)/about/`. Trang khác dùng thì hỏi đã — đừng lan nó ra.

### 2.3 Hero landing — exception có chủ đích

`h-[125dvh]` + `sticky top-0 h-[100dvh]`: hero pin 1/4 màn hình rồi mới nhả (rule "hero fit viewport" bị override ở đây — xem §4). Decor float: `animate-[floatDec_4s_ease-in-out_infinite]` ×3 (delay 1s/2s), keyframe khai báo trong `<style jsx global>` đầu page. Infinite loop cho DECOR ảnh thùng — rule "no infinite loops" chỉ áp cho text/data.

### 2.4 Feedback tương tác (mọi màn)

- `Button` primitive đã bake `active:not-aria-[haspopup]:translate-y-px` — không cần tự viết `active:scale-[0.98]` (pattern cũ ở dashboard quick-actions vẫn còn, đừng thêm mới).
- Loading: `loading.tsx` skeletons từng route + nút đổi label `Đang gửi...` / `Đang tạo mockup...` / `Đang phân tích...` (label state, không spinner tron trọc).
- `transition-colors` / `transition-all` trên interactive; `animate-spin` chỉ cho spinner.

---

## 3. Component Rules

### 3.0 UI stack — ĐỌC TRƯỚC KHI TẠO COMPONENT

- shadcn CLI style **`base-nova`** trên **`@base-ui/react`** (KHÔNG phải Radix). `components.json`: `iconLibrary: phosphor`, `rsc: true`, aliases `@/components/ui`.
- Primitive inventory (`src/components/ui/`, 14 file): `button badge card empty-state error-state input label modal select separator status-badge status-timeline textarea FadeIn`. KHÔNG có dialog/dropdown/toast/checkbox — modal tự chứa trong `modal.tsx` (`Dialog` từ base-ui). Muốn `dropdown-menu` → `npx shadcn add` chứ không tự viết.
- **Icon**: `@phosphor-icons/react` cho client components. Server components (`dashboard/*`, `pricing`, `status-timeline`, `empty-state`, `error-state`) import từ **`@phosphor-icons/react/dist/ssr`** — tránh kéo cả barrel vào RSC bundle. `lucide-react` chỉ tồn tại trong `select.tsx` (code CLI sinh); đừng import thêm từ nó.
- `cn()` ở `src/lib/utils.ts` (clsx + tailwind-merge) — mọi className động qua `cn`.
- Form: **react-hook-form + zod** (`zodResolver`) — xem §3.8.

### 3.1 Buttons — dùng `Button`/`buttonVariants`

```tsx
import { Button, buttonVariants } from '@/components/ui/button'
import { ArrowRight } from '@phosphor-icons/react'

<Button type="submit" size="lg" disabled={isSubmitting || !isAuthed}>
  {isSubmitting ? 'Đang gửi...' : 'Gửi đơn hàng'}
  <ArrowRight className="h-4 w-4" />
</Button>

// Link trông như button — KHÔNG bọc <a> trong <Button>:
<Link href="/consultation" className={buttonVariants({ size: 'lg', variant: 'outline' })}>…</Link>
```

Variants thật: `default outline secondary ghost destructive link`. Sizes thật: `default(xs h-8) · xs · sm · lg · icon · icon-xs · icon-sm · icon-lg` — ⚠️ `lg` CHỈ cao `h-9`, khác xa assumption "size lớn = to" (scale nhỏ vì base-nova compact); muốn nút marketing to thì thêm class `px-6 py-3` như landing đang làm. SVG trong button tự `size-4` nếu không có size class.

**Rules:**
- Text CTA ≤ 3 từ một dòng ✅ đang tuân (`Gửi đơn hàng`, `Tạo ảnh mockup`, `Đặt hàng ngay`).
- One primary per màn, label 1-nghĩa ✅: consult `Yêu cầu AI tư vấn` → mockup `Tạo ảnh mockup` → `Đặt hàng ngay` → order `Gửi đơn hàng`.
- Focus style thật (baked): `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` — pattern cũ `focus:outline-none focus:ring-2` trong các file thô nên giữ nguyên nếu không sửa file, không viết mới.

### 3.2 Inputs — `Input`/`Textarea`/`Label`

```tsx
<div className="space-y-1">
  <Label htmlFor="product-type">Sản phẩm cần đóng gói</Label>
  <Input id="product-type" {...register('productType')} placeholder="VD: Cafe hạt, mỹ phẩm" />
  {errors.productType && <p className="text-xs text-red-600">{errors.productType.message}</p>}
</div>
```

- Control cao `h-8` (compact), `text-base → md:text-sm`, `rounded-lg`, `border-input`, placeholder `text-muted-foreground`. `aria-invalid` tự đỏ + ring destructive — RHF `register` + zod đã set.
- **Label ABOVE, never placeholder-as-label** ✅ (form nào cũng vậy). Helper dưới control `text-xs text-gray-500`.
- Đơn vị `cm`: `Input` chưa có slot suffix → form tư vấn nhét đơn vị vào `placeholder` + `aria-label` ("Dài" / "Chiều dài (cm)"), form quy cách tự nhập để `(cm)` trong `label`. Pattern `relative` + `<span className="absolute right-3 top-1/2…">` hiện chỉ còn ở icon show/hide mật khẩu (`login`, `register`).
- File input thật: `<input type="file" accept=…>` ẩn bằng `sr-only` + `ref.click()` từ Button (print-mockup-controls), KHÔNG styling file-input thô.

### 3.3 Selects

Hai loại cùng tồn tại:
1. **`<select>` thô** trong form mua hàng (`custom-spec-form.tsx`, `checkout-form.tsx`, mockup position) — class: `block w-full rounded-lg border border-input bg-white px-3 py-2 text-sm …`; validation tự nhiên, không JS. MVP đang ưu tiên loại này.
2. **`Select` base-ui** (`ui/select.tsx`) — chỉ dùng ở toolbar filter dashboard (`OrdersToolbar`). Trigger `h-8 rounded-md`. Chỉ add thêm chỗ nào cần combobox thật (nhiều options + search).

### 3.4 Cards — `Card` base-nova

```tsx
<Card>
  <CardHeader><CardTitle>Sản phẩm</CardTitle><CardDescription>…</CardDescription></CardHeader>
  <CardContent>…</CardContent>
</Card>
```

`rounded-xl` + `ring-1 ring-foreground/10` + padding qua `--card-spacing` (1rem; `size="sm"` → 0.75rem). Không bọc `border border-gray-200 bg-white p-6` chồng lên — spec cũ là card tự chế, nay đã có primitive.

### 3.5 Navigation

- Navbar public (`components/layout/navbar.tsx`): `Trang chủ · Tư vấn · Về chúng tôi · Bảng giá`, phải: `Dashboard` (khi login) hoặc `Đăng nhập`/`Đăng ký`. Mobile: disclosure (`aria-expanded`), không hamburger tự chế mới.
- `DashboardNav` (xem §3.13) là nav phụ trong `(auth)` — KHÔNG phải sidebar 264px; spec cũ "Sidebar layout w-64 border-r" **không có trong code**.
- Rules còn hiệu lực: 1 dòng ở desktop, height ≤ 72px, condense label trước khi hamburger.

### 3.6 Tables + lists

- Bảng staff/dashboard: header **bắt buộc `scope="col"`** (4 chỗ hiện có đều có), `text-xs uppercase tracking-wider text-gray-500`, số phải `text-right`, trạng thái dùng `StatusBadge`.
- Danh sách đơn không dùng `<table>` — `OrderCard` (space-y-4). Đừng đổi sang table khi chưa có desktop data-grid requirement.
- Rỗng → `EmptyState`:

```tsx
<EmptyState
  title="Chưa có đơn hàng"
  description="Đơn đặt từ giỏ hàng hoặc đặt lại sẽ xuất hiện tại đây."
  actionHref="/shop" actionLabel="Mua hàng"
/>
```

(`rounded-lg border-dashed`, icon Phosphor mặc định `Package`.)

### 3.7 Status badge — KHÔNG tự chế pill

`src/components/ui/status-badge.tsx`: `inline-flex h-5 rounded-full border px-2 py-0.5 text-xs font-medium` + nhóm màu theo trạng thái: `pending/staff_review/confirmed → amber`, `production/deposit_paid → blue`, `completed/delivered → emerald`, `cancelled → red`; label TỪ `getOrderStatusLabel()` — đừng hard-code string trạng thái trong JSX. `Badge` generic (base-nova, variants default/secondary/destructive/outline/ghost/link) cho tag loại, không phải trạng thái đơn.

### 3.8 Forms — RHF + zod, error là UX

```tsx
const form = useForm<OrderFormValues>({ resolver: zodResolver(orderSchema), mode: 'onChange' })
// zod: message TIẾNG VIỆT ('Số điện thoại phải đủ 10 chữ số'),
//      superRefine cho rule liên trường (deliveryAddress bắt buộc khi 'delivery')
// API lỗi server → translateOrderError() mapping EN→VI trước khi hiển thị
{serverError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{serverError}</div>}
```

- Validate client = zod schema **là single source**, UI field lấy từ schema file. Mỗi form một schema khai báo cạnh form, server validate lại ở route:

| Form | Client schema | Server validate |
|---|---|---|
| Tư vấn | `consultation/consultation-schema.ts` | `consultationInputSchema` (`lib/data/consultations.ts`) |
| Quy cách tự nhập | `manualSchema` trong `custom-spec-form.tsx` | `customSpecSchema` (`lib/data/custom-spec.ts`) qua `POST /api/cart` |
| Checkout | `checkoutSchema` trong `checkout-form.tsx` | `src/app/api/checkout/route.ts` |
| Địa chỉ | `address-form-modal.tsx` | `src/app/api/addresses/[id]/route.ts` |
- CTA disabled khi chưa đủ điều kiện + 1 dòng hint giải thích (`Tạo ảnh mockup để tiếp tục đặt hàng.`) — pattern `blockedByMockup`.

### 3.9 Interactive states

Loading skeleton (`loading.tsx`) khớp shape thật; error inline `border-red-200 bg-red-50`; 404/error toàn trang có CTA (`ErrorCard` result page, `ErrorState` dashboard). Empty state có đường thoát (actionHref). ✅ đang tuân.

### 3.10 Modal — URL-state pattern (đặc sản project)

`src/components/ui/modal.tsx` props: `trigger? title description children footer className contentClassName size default|lg|xl open onOpenChange`. Sizes = `max-w-lg / 2xl / 5xl`.

Dashboard KHÔNG giữ modal state trong React — trạng thái nằm ở URL (`order-modals.tsx`):

```tsx
const createOpen = searchParams.get('modal') === 'create'
const detailOpen = Boolean(selectedOrder && searchParams.get('orderId'))
function closeModal() {
  const params = new URLSearchParams(searchParams.toString())
  params.delete('modal'); params.delete('orderId')
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
}
```

Deep-link được, refresh giữ nguyên, back đóng modal. Modal mới trong dashboard follow pattern này. Hai modal không-URL (`PaymentConfirmationModal`, `CancelOrderModal`) là local state vì chúng là bước cuối của flow không cần chia sẻ link.

### 3.11 StatusTimeline

`src/components/ui/status-timeline.tsx`: `<ol className="grid min-w-[760px] grid-cols-7">` trong `overflow-x-auto`; 7 bước (trục `cancelled` ra khỏi track, hiển thị bằng dòng đỏ `Đơn hàng đã hủy vào dd/MM/yyyy`); icon Phosphor `/dist/ssr` per-status (xem USER_FLOWS §5); node reached `bg-gray-950`, current `border-blue-600 text-blue-600` + halo `shadow-[0_0_0_4px_rgba(37,99,235,0.12)]`; ngày `Intl` `dd/MM/yyyy` timeZone `Asia/Ho_Chi_Minh`. Label qua `getOrderStatusLabel`. Đừng render timeline thứ hai tự chế.

### 3.12 Dieline SVG engine — vùng màu ĐẶC BIỆT

`src/lib/dieline/*` + `src/features/dieline/DielinePreview.tsx`:

- Nét vẽ là **hằng số kỹ thuật có nghĩa vật lý cho xưởng**, KHÔNG đổi sang theme token, KHÔNG "đồng bộ palette":
  `cut #111827` (đường cắt/dao) · `crease #2563eb` (đường cấn — dash `[5,3.2]`) · `dim #dc2626` (kích thước) · fill `#0f172a` opacity 0.035 · label text `#0f172a`. (Nguồn: `STYLE` ở `index.ts:522`. Note: token này *trùng màu* blue/red Tailwind nhưng đừng replace = `var(--primary)` — semantics khác nhau.)
- Geometry thuần mm → `viewBox` mm; stroke width scale theo khổ (`sw = max(w,h)/800`); artwork inset lề an toàn 10% cạnh ngắn (`fitArtwork`); hình in render DƯỚI nét cắt/cấn TRÊN lớp tô.
- SVG vào DOM bằng `dangerouslySetInnerHTML` (1 chỗ duy nhất: `DielinePreview.tsx:328`) với chuỗi engine tự sinh; `esc()` escape `& < >` cho text. Đây là carve-out chính thức của rule §7.
- Zoom/pan tính bằng inline style (xem §7).

### 3.13 DashboardNav

`components/layout/DashboardNav.tsx` (client, trong `(auth)/layout.tsx`): pill row `Tổng quan · Đơn hàng · Lịch sử · Hồ sơ` + `Đăng xuất` (`supabase.auth.signOut()` → `router.push('/')`). Active theo `usePathname()`. Không tự thêm nav thứ hai.

---

## 4. Hero Section Rules

**Landing thật là ngoại lệ đã chốt, đừng "sửa" về spec chung:**
`<section className="relative h-[125dvh]">` + bên trong `sticky top-0 h-[100dvh]` — hero pin 25% chiều cao để tạo hiệu ứng nhả lớp; decor `floatDec` 3 ảnh. Rule viewport bên dưới áp dụng cho **hero của trang khác** (hiện chỉ `/about`).

```tsx
// Hero — must fit in initial viewport
<section className="relative flex min-h-[100dvh] items-center py-24">
  …
</section>
```

**Hero rules:**
- `min-h-[100dvh]`, không `h-screen` (mobile URL bar)
- Headline ≤ 2 dòng desktop; subtext ≤ 20 từ
- CTA không cần scroll; ≤ 4 text element
- Không logo-wall/trust-strip trong hero ✅ (không có anywhere, đừng thêm)
- Font scale hero marketing: `text-4xl md:text-5xl`, weight bold, `tracking-tight`

---

## 5. Responsive Breakpoints

Tailwind mặc định, `tailwind.config.ts` KHÔNG override `screens`:
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
Mobile-first: base class = mobile, `sm:/md:/lg:` = override. Mọi grid 2+ cột phải khai fallback 1 cột (các form page đều `grid … lg:grid-cols-[…]`). Breakpoint design-chosen: layout split ở **lg** (1024); dashboard detail split ở **xl** (1280).

---

## 6. Accessibility — hiện trạng thật

✅ Đang có:
- Label assoc (`htmlFor`/`id`) ở form; `aria-label` icon-only buttons (mockup controls, select triggers)
- Focus-visible ring baked trong primitive (`focus-visible:ring-3 ring-ring/50`), không dùng `:focus`
- Semantic `nav/main/section/h1-duy-nhất/trang`; `<table>` có `scope="col"`
- `aria-invalid` error states; reduced-motion cho reveal + FadeIn (`useReducedMotion`)
- `lang="vi"` trên `<html>`

⚠️ Nợ đã biết (fix khi chạm file tương ứng):
- `/#faq` dead anchor ở footer (section không tồn tại)
- `/login` "Quên mật khẩu" trỏ route chưa tạo
- Nút `Đổi mật khẩu` / `Xóa tài khoản` ở profile không handler → nút "chết" vẫn render (rule: không render action không chạy được)
- File `<input type=file>` ẩn qua `sr-only` OK, nhưng thiếu `aria-describedby` nối "PNG, JPG…" helper text

---

## 7. Prohibited Patterns (+ carve-outs CÓ PHÉP đã kiểm chứng)

- ❌ No inline styles — **ngoại lệ thật** (3 file): computed-only: `style={{ width: \`${progress}%\` }}` (progress bar), `style={{ left: tipX, top: tipY }}` (tooltip động), viewport transform `DielinePreview`. Class tĩnh vẫn phải là Tailwind.
- ❌ No raw CSS modules — **ngoại lệ có chủ đích**: `globals.css` (token + `.reveal` + `@keyframes`), `page.tsx` landing (`<style jsx global>` cho `floatDec`). Không tạo `.module.css` mới.
- ❌ No hard-coded hex ngoài token palette — **ngoại lệ**: màu kỹ thuật dieline §3.12; `rgba()` shadow tint; màu `<StatusBadge>` groups (đang gray-classes debt).
- ❌ No `any` — ⚠️ repo đang sạch `any` tường minh; JSONB giữ `Record<string, unknown>` + reader functions (`getMockupUrl`…) thay vì cast.
- ❌ No `dangerouslySetInnerHTML` — **duy nhất 1 chỗ**: output engine dieline (`DielinePreview.tsx:328`), chuỗi máy-sinh + `esc()`. Không bao giờ cho user content.
- ❌ No `useEffect` data-fetching → Server Components ✅ (RHF fetch chỉ trong event handler — form submit flows — chấp nhận được vì cần giữ state máy khách).
- ❌ No `h-screen` — hero dùng `h-[125dvh]` theo §4.
- ❌ No flex-math `w-[calc(...)]` → CSS Grid ✅ (split layout toàn `[a_b_c]` templates).
- ❌ No placeholder-as-label ✅ · No purple-gradient/glow ✅ · No duplicate CTA intent ✅
- ⚠️ `<img>` thô: `eslint-disable-next-line @next/next/no-img-element` ×10 chỗ, có chủ đích — `next.config.mjs` chỉ whitelist `picsum.photos`; ảnh Cloudinary/Supabase chưa vào `remotePatterns` nên KHÔNG dùng `next/image` được. Khi thêm host vào config → xóa disable tương ứng.

---

## 8. Quick Reference — class có thật trong repo

| Element | Classes |
|---|---|
| Page section marketing | `py-16 md:py-24` + inner `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Form page shell | `bg-gray-50 px-4 py-10 sm:px-6 lg:px-8` + `mx-auto max-w-6xl` (consult) / `max-w-7xl` (order) |
| Split layout | `grid gap-8 lg:grid-cols-[1.2fr_1fr]` · `lg:grid-cols-[minmax(0,1fr)_24rem]` · detail: `grid gap-6 xl:grid-cols-[1fr_360px]` |
| Card | `<Card>` primitive (ring-1, rounded-xl) — KHÔNG tự `rounded-lg border bg-white p-6` |
| Button via Link | `className={buttonVariants({ size: 'lg', variant: 'outline' })}` |
| Nút marketing to | `rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700` (file cũ) → mới: `<Button size>` + padding override |
| Form label / error / helper | `text-sm font-medium` (Label) · `text-xs text-red-600` · `text-xs text-gray-500` |
| Table header / cell | `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-50` · `whitespace-nowrap px-6 py-4 text-sm` |
| Status pill | `<StatusBadge status={…} />` primitive, không string literal |
| Section eyebrow | `text-xs font-medium text-blue-700 uppercase` ("Giá ước tính") — không mono, không tracking-[0.18em] |
| Money/date | `formatCurrency` / `formatDateTime` / `getOrderStatusLabel` từ `src/lib/data/order-shared.ts` |
