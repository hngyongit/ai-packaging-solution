# UI Rules — Tasteskill Implementation Layer

> **This file is the implementation layer for `.agents/skills/design-taste-frontend/SKILL.md`**
> The Tasteskill governs the **design direction** (what). This file provides the **concrete Tailwind tokens** (how).
> **Always read the Tasteskill first, then use this file for exact classes.**

---

## 0. How This Works with the Tasteskill

### Workflow

```
1. Read Tasteskill → infer Design Read → set Three Dials
2. Come here for concrete Tailwind classes
3. Generate UI following both
```

### Three Dials → Tailwind Mapping

| Dial | Low (1-3) | Medium (4-6) | High (7-10) |
|---|---|---|---|
| **VARIANCE** | Centered, symmetrical, grid-aligned | Split layouts, asymmetric whitespace | Off-grid, overlapping, artsy |
| **MOTION** | Static, no animations | Scroll-reveal, hover transitions | Sticky-stack, parallax, physics |
| **DENSITY** | Max whitespace, large type | Balanced, standard spacing | Compact, data-dense |

### Design Read Declaration

Before any UI code, output one line:
```
Design Read: <page kind> for <audience>, with a <vibe> language, leaning toward <aesthetic>.
```

Example for this project:
```
Design Read: Landing page for manufacturing B2B buyers, with a clean industrial language, leaning toward restrained Tailwind + shadcn + factory photography.
```

---

## 1. Design Token System

### Colors

```css
/* Primary palette — industrial blue, trustworthy */
Primary:   blue-600 (#2563eb)    → hover: blue-700
Secondary: slate-600 (#475569)   → hover: slate-700
Accent:    amber-500 (#f59e0b)   → hover: amber-600

/* Semantic */
Success:   emerald-600 (#059669)
Error:     red-600 (#dc2626)
Warning:   amber-500 (#f59e0b)
Info:      sky-600 (#0284c7)

/* Neutral — use Zinc or Slate consistently, never mix */
Background: white (#ffffff) or gray-50 (#f9fafb)
Surface:    white
Border:     gray-200 (#e5e7eb)
Text:       gray-900 (#111827)
Text-muted: gray-500 (#6b7280)
```

**Tasteskill color rules:**
- **One palette per project** — do not mix warm and cool grays
- **No AI purple glow** — no automatic purple gradients or button glows
- **Max 1 accent color**, saturation < 80% by default
- **Shadows tinted to background hue** — no pure-black drop shadows on light backgrounds
- **Shape consistency**: pick ONE corner-radius scale and stick to it

### Typography

```css
/* Font families — prefer Geist, Satoshi, or Cabinet Grotesk over Inter */
font-sans: Geist, Satoshi, 'Cabinet Grotesk', system-ui, sans-serif
font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace

/* Scale */
h1-display:  text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none
h1:          text-3xl md:text-4xl font-bold tracking-tight
h2:          text-2xl font-semibold tracking-tight
h3:          text-xl font-semibold
body:        text-base text-gray-600 leading-relaxed max-w-[65ch]
body-sm:     text-sm
caption:     text-xs text-gray-500
eyebrow:     text-[11px] font-mono uppercase tracking-[0.18em] text-gray-500
```

**Tasteskill typography rules:**
- **Inter discouraged as default** — pick Geist, Satoshi, or Cabinet Grotesk first
- **Serif very discouraged** — only when brand brief explicitly names a serif font
- **Italic descender clearance**: use `leading-[1.1]` + `pb-1` on italic display text
- **Font pairings**: Geist + Geist Mono, Satoshi + JetBrains Mono, Cabinet Grotesk + Inter Tight

### Spacing

```css
/* Standard spacing scale (Tailwind defaults) */
page-section:       py-16 md:py-24
page-section-tight: py-12 md:py-16
card-padding:       p-6
component-gap:      gap-4
section-gap:        space-y-8
input-block:        space-y-1         /* label + input */
```

### Border Radius

```css
/* Pick ONE scale and use it everywhere */
cards:     rounded-lg     (8px)
buttons:   rounded-md     (6px)
inputs:    rounded-md     (6px)
badges:    rounded-full   (pill)
modals:    rounded-xl     (12px)
```

### Shadows

```css
card:        shadow-sm hover:shadow-md transition-shadow
dropdown:    shadow-lg
modal:       shadow-xl
button:      shadow-sm
```

---

## 2. Motion System

Reference the Tasteskill's Three Dials. Motion intensity is driven by `MOTION_INTENSITY`:

| MOTION | Transitions | Scroll-reveal | Special effects |
|---|---|---|---|
| 1-3 | `transition-colors` only | None | None |
| 4-6 | `transition-all` + hover scale | `motion` `whileInView` | Stagger on lists |
| 7-10 | Spring physics | Sticky-stack, parallax | GSAP ScrollTrigger |

### Scroll-reveal (MOTION >= 4)

```tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'

export function FadeIn({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

### Interactive feedback (all levels)

```tsx
// Button tactile feedback
<button className="active:scale-[0.98] transition-transform ...">
  Click me
</button>
```

### Motion rules

- **Motion must be motivated** — every animation must communicate hierarchy, feedback, or state transition
- **Respect `prefers-reduced-motion`** — use `useReducedMotion()` from `motion/react`
- **No infinite loops** on informational content — only for status indicators
- **Tailwind built-in**: `transition-colors`, `transition-shadow`, `animate-pulse`, `animate-spin` (for loading only)

---

## 3. Component Rules

### 3.1 Buttons

```tsx
// Primary action
<button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
  Submit
</button>

// Secondary action
<button className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Cancel
</button>

// Danger
<button className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
  Delete
</button>

// Ghost (no border, no bg)
<button className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
  Edit
</button>

// Icon button (square)
<button className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
  <Icon className="h-5 w-5" />
</button>
```

**Rules:**
- Button text MUST fit on one line at desktop (max 3 words for primary CTAs)
- No duplicate CTA intent on the same page (one label per intent)
- WCAG AA contrast: 4.5:1 for body text, 3:1 for large text (18px+)

### 3.2 Input Fields

```tsx
// Text input — label ABOVE input, never placeholder-as-label
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Product Name
  </label>
  <input
    type="text"
    placeholder="e.g. Coffee beans"
    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
  />
  <p className="text-xs text-gray-500">Enter the product you need packaging for</p>
</div>

// Select
<select className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
  <option value="">Select box type</option>
  <option value="3-layer">3-layer carton</option>
  <option value="5-layer">5-layer carton</option>
</select>

// Textarea
<textarea
  rows={3}
  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  placeholder="Additional requirements..."
/>

// Number input (for dimensions, weight)
<div className="relative">
  <input
    type="number"
    min={0}
    step={0.1}
    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    placeholder="0"
  />
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">cm</span>
</div>
```

**Form rules (Tasteskill Section 4.6):**
- Label ABOVE input — never placeholder-as-label
- Helper text optional but present in markup
- Error text BELOW input
- Standard `gap-2` or `space-y-1` for input blocks
- Audit every form: WCAG AA contrast on labels, placeholders, focus rings, error text

### 3.3 Cards

```tsx
// Default card
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
  <p className="mt-2 text-sm text-gray-600">Card description content here.</p>
</div>

// Product card
<div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
  <div className="aspect-[4/3] bg-gray-100">
    {/* Product image */}
  </div>
  <div className="p-4 space-y-2">
    <h3 className="font-semibold text-gray-900">Product Name</h3>
    <p className="text-sm text-gray-500">Description</p>
    <p className="text-lg font-bold text-blue-600">Price</p>
  </div>
</div>

// Stats card
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <p className="text-sm font-medium text-gray-500">Total Orders</p>
  <p className="mt-2 text-3xl font-bold text-gray-900">128</p>
  <p className="mt-1 text-sm text-emerald-600">↑ 12% from last month</p>
</div>
```

**Card rules (Tasteskill Section 4.4):**
- Use cards ONLY when elevation communicates real hierarchy
- Otherwise use `border-t`, `divide-y`, or negative space for grouping
- For data-dense pages (DENSITY > 7): avoid generic card containers

### 3.4 Layout Patterns

```tsx
// Page section — centered
<section className="py-16 md:py-24">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Section Title
      </h2>
      <p className="mt-4 text-base text-gray-600">
        Section description
      </p>
    </div>
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Cards */}
    </div>
  </div>
</section>

// Two-column layout
<div className="grid gap-8 lg:grid-cols-2">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>

// Sidebar layout (dashboard)
<div className="flex min-h-screen">
  <aside className="w-64 border-r border-gray-200 bg-white">
    {/* Sidebar navigation */}
  </aside>
  <main className="flex-1 p-6">
    {/* Main content */}
  </main>
</div>
```

**Layout rules (Tasteskill Section 4.3, 4.7):**
- **Anti-center bias**: when VARIANCE > 4, force split-screen or asymmetric layouts
- **Section-layout-repetition ban**: each layout family appears at most ONCE per page
- **Zigzag alternation cap**: max 2 consecutive image+text split sections
- **Eyebrow restraint**: max 1 eyebrow per 3 sections
- **Grid over flex-math**: use CSS Grid, never `w-[calc(33%-1rem)]`
- **Mobile collapse**: every multi-column layout must declare the `< 768px` fallback

### 3.5 Navigation

```tsx
// Navbar
<nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <div className="flex items-center gap-8">
      <Link href="/" className="text-xl font-bold text-gray-900">
        Logo
      </Link>
      <div className="hidden md:flex items-center gap-6">
        <Link href="/consultation" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Get Started
        </Link>
        <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Products
        </Link>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
        Sign In
      </Link>
      <Link href="/register" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Get Started
      </Link>
    </div>
  </div>
</nav>
```

**Nav rules (Tasteskill Section 4.7):**
- Must render on a single line at desktop (1024px)
- Height cap: 64-72px default, max 80px
- If items don't fit: condense labels or move to hamburger

### 3.6 Tables

```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Order ID
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Customer
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
          Status
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
          Total
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 bg-white">
      <tr className="hover:bg-gray-50">
        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
          #ORD-001
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
          John Doe
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Completed
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-right text-gray-900">
          5,000,000₫
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 3.7 Status Badges

```tsx
const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
} as const

<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
  {status}
</span>
```

### 3.8 Interactive UI States (Tasteskill Section 4.5)

```tsx
// Loading — skeleton matching the final layout shape
<div className="animate-pulse space-y-4">
  <div className="h-48 rounded-lg bg-gray-200" />
  <div className="h-4 w-3/4 rounded bg-gray-200" />
  <div className="h-4 w-1/2 rounded bg-gray-200" />
</div>

// Empty state — beautifully composed, indicates how to populate
<div className="flex flex-col items-center justify-center py-16">
  <Icon className="h-12 w-12 text-gray-400" />
  <h3 className="mt-4 text-lg font-semibold text-gray-900">No orders yet</h3>
  <p className="mt-2 text-sm text-gray-500">Get started by submitting a consultation request.</p>
  <button className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
    Start Consultation
  </button>
</div>

// Error state — inline, contextual
<div className="rounded-md border border-red-200 bg-red-50 p-4">
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-red-500 mt-0.5" />
    <div>
      <h4 className="text-sm font-medium text-red-800">Failed to load orders</h4>
      <p className="mt-1 text-sm text-red-600">Please try again or contact support.</p>
    </div>
  </div>
</div>

// Button loading
<button disabled className="... disabled:opacity-50 disabled:cursor-not-allowed">
  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
  Loading...
</button>
```

**Tasteskill state rules:**
- **Loading**: skeletal loaders matching final layout shape, not generic circular spinners
- **Empty states**: beautifully composed, indicate how to populate
- **Error states**: clear, inline (forms), contextual (toasts only for transient)
- **Tactile feedback**: `active:scale-[0.98]` on buttons simulates physical push

### 3.9 Multi-step Form (Wizard)

```tsx
// Step indicator
<div className="flex items-center justify-center gap-2">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center gap-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
        currentStep === i
          ? 'bg-blue-600 text-white'
          : currentStep > i
          ? 'bg-emerald-600 text-white'
          : 'bg-gray-200 text-gray-600'
      }`}>
        {currentStep > i ? '✓' : i + 1}
      </div>
      <span className="text-sm font-medium text-gray-700">{step}</span>
      {i < steps.length - 1 && <div className="h-px w-12 bg-gray-200" />}
    </div>
  ))}
</div>
```

---

## 4. Hero Section Rules (Tasteskill Section 4.7)

```tsx
// Hero — must fit in initial viewport
<section className="relative min-h-[100dvh] flex items-center pt-24 pb-16">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-none">
        Headline max 2 lines
      </h1>
      <p className="mt-6 text-lg text-gray-600 max-w-[65ch] leading-relaxed">
        Subtext max 20 words, max 4 lines
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link href="/consultation" className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700">
          Get Started
        </Link>
        <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Learn More
        </Link>
      </div>
    </div>
  </div>
</section>
```

**Hero rules (non-negotiable):**
- Must fit in initial viewport (use `min-h-[100dvh]`, not `h-screen`)
- Headline max 2 lines on desktop
- Subtext max 20 words AND max 4 lines
- CTAs visible without scroll
- Max 4 text elements: eyebrow (optional) + headline + subtext + CTAs
- No "used by" logos, trust strips, or feature lists inside the hero
- Top padding max `pt-24` (≈6rem) at desktop
- Font scale: `text-4xl md:text-5xl lg:text-6xl` for most heroes

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Container |
|---|---|---|
| `sm` | 640px | `max-w-7xl` (1280px) |
| `md` | 768px | `px-4 sm:px-6 lg:px-8` |
| `lg` | 1024px | |
| `xl` | 1280px | |
| `2xl` | 1536px | |

**Mobile-first**: always start with mobile styles, add `sm:`, `md:`, `lg:` overrides.

```tsx
// Mobile-first grid — always declare the < 768px fallback
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* Single column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## 6. Accessibility

- All buttons **must** have `aria-label` or visible text
- Form inputs **must** have associated `<label>` elements (no placeholder-as-label)
- Images **must** have `alt` text
- Color contrast: text on colored backgrounds must pass WCAG AA (4.5:1 body, 3:1 large text)
- Focus states: `focus:outline-none focus:ring-2 focus:ring-blue-500` on all interactive elements
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`
- Respect `prefers-reduced-motion` — use `useReducedMotion()` from `motion/react`
- Audit every form: labels, placeholders, focus rings, error text all pass WCAG AA

---

## 7. Prohibited Patterns

- ❌ No inline styles (`style={{ }}`) — use Tailwind classes
- ❌ No raw CSS modules — Tailwind only
- ❌ No custom color values — use the defined palette
- ❌ No `any` types in TypeScript
- ❌ No `dangerouslySetInnerHTML`
- ❌ No `useEffect` for data fetching — use Server Components
- ❌ No `h-screen` for hero sections — use `min-h-[100dvh]`
- ❌ No complex flexbox math (`w-[calc(33%-1rem)]`) — use CSS Grid
- ❌ No placeholder-as-label
- ❌ No AI purple gradients or glow effects
- ❌ No mixing warm and cool grays in the same project
- ❌ No duplicate CTA intent on the same page

---

## 8. Quick Reference — Most Common Patterns

| Element | Classes |
|---|---|
| Page section | `py-16 md:py-24 mx-auto max-w-7xl px-4` |
| Card | `rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md` |
| Primary button | `rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-[0.98]` |
| Input | `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm` |
| Form label | `block text-sm font-medium text-gray-700` |
| Helper text | `text-xs text-gray-500` |
| Table header | `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-50` |
| Table cell | `whitespace-nowrap px-6 py-4 text-sm` |
| Badge | `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium` |
| Hero headline | `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none` |
| Hero subtext | `mt-6 text-lg text-gray-600 max-w-[65ch] leading-relaxed` |
| Section title | `text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl` |
| Eyebrow label | `text-[11px] font-mono uppercase tracking-[0.18em] text-gray-500` |