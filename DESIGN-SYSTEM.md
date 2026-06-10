# Ngalir POS — Design System & UI Showcase

> **Brand**: Ngalir (Posify E-Pos Agenku)
> **Platform**: Web App (Mobile-first PWA)
> **Stack**: Vue 3 + TypeScript + Tailwind CSS + Lucide Icons
> **Target**: Kasir / Cashier Operator di toko retail & BRILink agent

---

## 1. Color System

### Primary Brand

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `primary-50` | `#eff6ff` | `blue-50` | Subtle background, icon container bg |
| `primary-100` | `#dbeafe` | `blue-100` | Badge bg, soft highlight |
| `primary-200` | `#bfdbfe` | `blue-200` | Border accent, FAB shadow |
| `primary-400` | `#60a5fa` | `blue-400` | Link hover, secondary icon |
| `primary-500` | `#3b82f6` | `blue-500` | FAB idle, gradient start |
| `primary-600` | `#2563eb` | `blue-600` | **Primary CTA**, active tab, brand icon | 
| `primary-700` | `#1d4ed8` | `blue-700` | CTA hover, gradient end |
| `primary-800` | `#1e40af` | `blue-800` | Deep emphasis |
| `primary-900` | `#1e3a8a` | `blue-900` | Dark brand text |

### Semantic Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `success` | `#059669` | `emerald-600` | Positive action, profit, cash-in |
| `success-light` | `#D1FAE5` | `emerald-100` | Success badge bg |
| `warning` | `#D97706` | `amber-600` | Pending, attention |
| `warning-light` | `#FEF3C7` | `amber-100` | Warning badge bg |
| `danger` | `#DC2626` | `red-600` | Error, destructive, cash-out |
| `danger-light` | `#FEE2E2` | `red-100` | Error badge bg |
| `info` | `#6366F1` | `indigo-500` | Informational |

### Neutral Palette

| Usage | Tailwind Class |
|-------|---------------|
| Page background | `bg-slate-50` |
| Card background | `bg-white` |
| Primary text | `text-slate-900` / `text-slate-800` |
| Secondary text | `text-slate-600` / `text-slate-500` |
| Muted text | `text-slate-400` |
| Border | `border-slate-200` |
| Divider subtle | `border-slate-100` / `border-slate-50` |
| Input bg | `bg-slate-50` / `bg-slate-100` |
| Sidebar dark | `bg-[#0F172A]` (`sidebar-dark`) |

### Gradient Presets

```css
/* Dashboard stat card - Retail */
bg-gradient-to-br from-blue-500 to-blue-700

/* Dashboard stat card - BRILink */
bg-gradient-to-br from-emerald-500 to-emerald-700

/* Login page background */
bg-gradient-to-br from-white to-blue-50/80
```

### Dark Mode

- Strategy: `class`-based toggle (`darkMode: 'class'`)
- Surface: `dark:bg-slate-900` / `dark:bg-slate-950`
- Text: `dark:text-slate-100`
- Border: `dark:border-slate-700` / `dark:border-slate-800`

---

## 2. Typography

### Font Stack

| Role | Font | Tailwind Class | Fallback |
|------|------|----------------|----------|
| **Heading & UI** | Josefin Sans | `font-sans` | system-ui, -apple-system, sans-serif |
| **Monospace / Data** | Source Sans 3 | `font-mono` | Source Sans Pro, system-ui, sans-serif |

### Type Scale

| Element | Size | Weight | Class |
|---------|------|--------|-------|
| Page title | 20-24px | Bold (700) | `text-xl font-bold` / `text-2xl font-bold` |
| Section heading | 14-16px | Bold (700) | `text-sm font-bold` / `text-base font-bold` |
| Body text | 14px | Regular (400) | `text-sm` |
| Label / Caption | 11-12px | Semibold (600) | `text-[11px] font-semibold` / `text-xs font-semibold` |
| Micro text | 9-10px | Medium (500) | `text-[9px]` / `text-[10px]` |
| Data / Price | 14-20px | Bold mono | `text-sm font-mono font-bold` / `text-xl font-bold font-mono` |
| Input text | 14-16px | Regular | `text-sm` / `text-base` |

### Line Height & Spacing

- Body: `leading-relaxed` (1.625) for readability
- Headings: `leading-tight` (1.25)
- Tracking: `tracking-tight` for brand title, `tracking-widest` for PIN input

---

## 3. Spacing & Layout

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `0.5` | 2px | Micro gap (icon-badge) |
| `1` | 4px | Tight element gap |
| `1.5` | 6px | Label-input gap |
| `2` | 8px | Component internal padding |
| `3` | 12px | Card internal padding (compact) |
| `4` | 16px | Standard section padding |
| `5` | 20px | Section padding (spacious) |
| `6` | 24px | Major section gap |
| `8` | 32px | Page-level spacing |

### Layout Patterns

| Pattern | Implementation |
|---------|---------------|
| **Mobile-first** | All views start from `min-width: 0`, scale up with `md:` |
| **Bottom nav height** | `h-16` (64px) with `pb-20` content offset |
| **Top bar height** | `h-14` (56px) sticky |
| **Content area** | `min-h-[calc(100vh-7.5rem)]` |
| **Max content width** | `max-w-6xl mx-auto` (desktop) |
| **Page padding** | `p-4` (16px all sides) |
| **Card gap** | `space-y-4` / `space-y-5` between sections |
| **Grid columns** | `grid-cols-2` / `grid-cols-3` (mobile), up to `grid-cols-5` (desktop) |

### Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| `sm` | 640px | Small tablet adjustments |
| `md` | 768px | Tablet — show cart panel, side-by-side layouts |
| `lg` | 1024px | Desktop — wider panels |

---

## 4. Components Library

### 4.1 Buttons

```html
<!-- Primary CTA -->
<button class="w-full h-10 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
  Proses Pembayaran
</button>

<!-- Secondary -->
<button class="h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors">
  Batal
</button>

<!-- Danger -->
<button class="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors shadow-sm">
  Hapus
</button>

<!-- Ghost / Outline -->
<button class="h-11 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
  <ArrowDownIcon class="w-4 h-4" /> Cash In
</button>

<!-- Icon Button -->
<button class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
  <ScanBarcodeIcon class="w-5 h-5" />
</button>

<!-- Quick Amount Chip -->
<button class="flex-1 h-8 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200">
  50rb
</button>
```

**Button Rules:**
- Primary: `rounded-xl`, `h-10` to `h-12`, `font-bold`
- Touch targets: minimum `h-10` (40px), preferred `h-11`/`h-12`
- Active feedback: `active:scale-[0.98]` on primary CTAs
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- Loading: Replace text with `<Loader2Icon class="w-5 h-5 animate-spin" />`

### 4.2 Cards

```html
<!-- Standard Card -->
<div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
  <!-- content -->
</div>

<!-- Gradient Stat Card -->
<div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
  <p class="text-[11px] font-medium opacity-80 mb-1">Penjualan Retail</p>
  <h2 class="text-xl font-bold font-mono">Rp 1.250.000</h2>
  <p class="text-[10px] opacity-70 mt-1">12 transaksi</p>
</div>

<!-- Quick Access Card -->
<div class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
  <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
    <ShoppingCartIcon class="w-5 h-5" />
  </div>
  <span class="text-[10px] font-medium text-slate-700 text-center">Kasir</span>
</div>

<!-- Login Card (Glassmorphism-lite) -->
<div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
  <!-- content -->
</div>
```

### 4.3 Inputs

```html
<!-- Standard Input -->
<input class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition" />

<!-- Search Input with Icon -->
<div class="relative flex-1">
  <SearchIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
  <input class="w-full bg-slate-100 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border border-transparent outline-none transition-all" />
</div>

<!-- PIN Input (Large Centered) -->
<input class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all tracking-widest text-center text-lg" inputmode="numeric" />

<!-- Money Input -->
<input class="w-full h-11 px-4 text-base font-mono border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none text-right" type="number" />
```

**Input Rules:**
- Height: `h-10` standard, `h-11` for money, `py-3` for auth forms
- Border radius: `rounded-md` standard, `rounded-lg` medium, `rounded-xl` auth
- Focus state: `focus:border-blue-500 focus:ring-2 focus:ring-blue-100`
- Background: `bg-white` or `bg-slate-50` / `bg-slate-100` for search

### 4.4 Badges & Tags

```html
<!-- Count Badge -->
<span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">5</span>

<!-- Status Badge -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Aktif</span>

<!-- Category Chip (Active) -->
<button class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-600 text-white">Semua</button>

<!-- Category Chip (Inactive) -->
<button class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200">Makanan</button>

<!-- Online Indicator -->
<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
<!-- Offline -->
<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
```

### 4.5 Modals & Dialogs

```html
<!-- Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="close"></div>
  <!-- Panel -->
  <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
    <!-- content -->
  </div>
</div>

<!-- Mobile Bottom Sheet -->
<div class="fixed inset-x-0 top-0 bottom-16 z-50 flex items-end justify-center">
  <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
  <div class="relative bg-white/95 backdrop-blur-xl rounded-t-2xl w-full max-h-full flex flex-col animate-slide-up shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60">
    <!-- content -->
  </div>
</div>
```

**Modal Rules:**
- Overlay: `bg-black/30` to `bg-black/50` + `backdrop-blur-[2px]`
- Panel: `rounded-2xl` desktop, `rounded-t-2xl` mobile sheet
- z-index: `z-50` modals, `z-[90]` confirm, `z-[100]` toast
- Glassmorphism (cart): `bg-white/95 backdrop-blur-xl border border-white/60`

### 4.6 Toast Notifications

```html
<!-- Structure -->
<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
  <div class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium bg-white border-emerald-200">
    <!-- Left accent bar -->
    <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-emerald-500" />
    <!-- Icon + Message + Close -->
  </div>
</div>
```

**Toast Variants:** `success` (emerald), `error` (red), `warning` (amber), `info` (blue)
**Animation:** Slide from right `translateX(110%)` → `translateX(0)`
**Duration:** 3-5 seconds with progress bar

### 4.7 Navigation

#### Bottom Navigation (Mobile — 5 tabs max)

```html
<nav class="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200">
  <div class="max-w-3xl mx-auto grid grid-cols-5 h-16 relative">
    <!-- Tab Item -->
    <a class="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-900">
      <HomeIcon class="w-5 h-5" />
      <span>Beranda</span>
    </a>
    <!-- Active Tab -->
    <a class="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-blue-600">
      <HomeIcon class="w-5 h-5" />
      <span>Beranda</span>
    </a>
    <!-- Center FAB (Kasir) -->
    <a class="flex flex-col items-center justify-center relative">
      <div class="absolute -top-5 w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
        <ShoppingCartIcon class="w-6 h-6 text-white" />
      </div>
      <span class="mt-7 text-[10px] text-blue-600">Kasir</span>
    </a>
  </div>
</nav>
```

#### Top Bar

```html
<header class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
  <!-- Left: Brand icon + name -->
  <div class="flex items-center gap-2">
    <div class="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
      <DropletsIcon class="w-4 h-4 text-white" />
    </div>
    <div>
      <p class="text-sm font-bold text-slate-950 leading-tight">Ngalir</p>
      <p class="text-[10px] text-slate-500">Toko · Kasir1</p>
    </div>
  </div>
  <!-- Right: Status indicators -->
</header>
```

### 4.8 Floating Action Elements

```html
<!-- Mobile Floating Cart Bar (Glassmorphism) -->
<div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[500px]">
  <button class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-all active:scale-[0.98]">
    <!-- Cart info + Total + Bayar button -->
  </button>
</div>
```

---

## 5. Icons

### Library: Lucide Vue Next

- **Size Standard**: `w-5 h-5` (navigation), `w-4 h-4` (inline), `w-3 h-3` (micro)
- **Style**: Stroke-based, consistent 2px stroke width
- **Color**: Inherit from parent (`text-blue-600`, `text-slate-500`, etc.)

### Common Icons Used

| Context | Icon | Class |
|---------|------|-------|
| Brand | `Droplets` | `w-4 h-4 text-white` (in blue container) |
| Home/Dashboard | `Home` | `w-5 h-5` |
| Kasir/POS | `ShoppingCart` | `w-5 h-5` / `w-6 h-6` (FAB) |
| BRILink | `Landmark` | `w-5 h-5` |
| Reports | `BarChart3` | `w-5 h-5` |
| Settings | `Settings` | `w-5 h-5` |
| Search | `Search` | `w-4 h-4` |
| Close | `X` | `w-5 h-5` / `w-3.5 h-3.5` |
| Loading | `Loader2` | `w-5 h-5 animate-spin` |
| Success | `CheckCircle` | `w-5 h-5 text-emerald-500` |
| Error | `XCircle` | `w-5 h-5 text-red-500` |
| Warning | `AlertTriangle` | `w-5 h-5 text-amber-500` |
| Cash In | `ArrowDown` | `w-4 h-4` |
| Cash Out | `ArrowUp` | `w-4 h-4` |
| Plus (add) | `Plus` / `PlusCircle` | `w-3 h-3` / `w-5 h-5` |
| Minus | `Minus` | `w-3 h-3` |
| Lock (PIN) | `Lock` | `w-7 h-7` (auth), `w-4 h-4` (inline) |
| User | `User` | `w-4 h-4` |

**Rule**: Never use emojis as structural icons. Always Lucide SVG.

---

## 6. Animation & Transitions

### Page Transitions

```css
/* Slide + Fade (page navigation) */
.page-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Scale down (login form steps) */
.scale-down-enter-active { transition: all 0.3s ease; }
.scale-down-leave-active { transition: all 0.2s ease; }
.scale-down-enter-from { opacity: 0; transform: scale(0.96) translateY(8px); }
.scale-down-leave-to { opacity: 0; transform: scale(0.96) translateY(-8px); }
```

### Micro-interactions

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Button press | instant | - | `active:scale-[0.98]` |
| Toast enter | 250ms | `ease` | `translateX(110%) → 0` |
| Toast leave | 200ms | `ease` | `0 → translateX(110%)` |
| Modal fade | 200ms enter / 150ms leave | `ease` | `opacity: 0 → 1` |
| Cart float bar | 300ms | `ease` | slide-up appear |
| Bottom sheet | 300ms | `ease-out` | `animate-slide-up` |
| Loading spinner | infinite | linear | `animate-spin` |
| Pulse indicator | infinite | - | `animate-pulse` |
| Data refresh | 150ms | `ease-out` | `dataFadeIn` keyframe |

### Transition Names (Vue)

| Name | Type | Usage |
|------|------|-------|
| `page` | Slide + Fade | Router view transitions |
| `toast` | Slide right | Toast notifications |
| `cart-float` | Slide up | Mobile cart bar |
| `confirm-fade` | Fade | Confirm dialog |
| `scale-down` | Scale + Fade | Login form steps |
| `fade-in` | Fade | Success overlay |
| `slide-up` | Slide up + Fade | Text appear after animation |

### Motion Rules

1. **Enter > Exit**: Enter 300ms, Exit 200ms (exit faster)
2. **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for navigation
3. **Max duration**: Never exceed 400ms for UI transitions
4. **Reduced motion**: Respect `prefers-reduced-motion`
5. **No blocking**: Animations never block user input
6. **Spatial continuity**: Forward = slide left/up, Back = slide right/down

---

## 7. Shadows & Effects

### Shadow Scale

| Level | Class | Usage |
|-------|-------|-------|
| Subtle | `shadow-sm` | Cards, standard elevation |
| Medium | `shadow-md` | Stat cards, hover state |
| Strong | `shadow-lg` | FAB, floating elements |
| Elevated | `shadow-xl` | Toasts, popovers |
| Glass | `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` | Floating cart bar |
| Card soft | `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` | Login card |
| Modal | `shadow-[0_20px_60px_rgba(0,0,0,0.15)]` | Bottom sheet |

### Glassmorphism

```css
/* Floating Cart Bar */
bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]

/* Cart Modal Panel */
bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)]

/* Overlay */
bg-black/30 backdrop-blur-[2px]
```

### Border Radius Scale

| Size | Class | Usage |
|------|-------|-------|
| Small | `rounded-md` | Inputs, standard buttons |
| Medium | `rounded-lg` | Cards (compact), selects |
| Large | `rounded-xl` | Cards, buttons CTA, modals |
| XL | `rounded-2xl` | Modal panels, bottom sheets |
| Full | `rounded-3xl` | Login card, auth containers |
| Pill | `rounded-full` | Badges, chips, avatars, indicators |

---

## 8. Responsive Behavior

### Mobile (< 768px)

- Bottom navigation visible (5 tabs + center FAB)
- Full-width content, `p-4` padding
- Cart as floating bar → opens full bottom sheet
- Grid: `grid-cols-2` to `grid-cols-4` for products
- Modal: bottom sheet (`rounded-t-2xl`, full width)

### Tablet/Desktop (>= 768px)

- Bottom nav hidden on POS (cart panel shown as sidebar)
- POS: Split view — products left, cart right (`w-[380px]`)
- Modal: centered dialog (`max-w-sm`, `rounded-2xl`)
- Grid: up to `grid-cols-5` for products
- Content max-width: `max-w-6xl`

---

## 9. State Patterns

### Loading

```html
<!-- Full page -->
<div class="flex items-center justify-center py-16">
  <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
</div>

<!-- Button loading -->
<button disabled class="... disabled:opacity-50">
  <Loader2Icon class="w-5 h-5 animate-spin" />
  <span>Memproses...</span>
</button>
```

### Empty State

```html
<div class="flex flex-col items-center justify-center py-12 text-center">
  <PackageIcon class="w-12 h-12 text-slate-300 mb-3" />
  <p class="text-sm text-slate-500">Produk tidak ditemukan</p>
</div>
```

### Error State

```html
<!-- Inline error -->
<div class="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
  Error message here
</div>

<!-- Alert with icon -->
<div class="bg-red-50 border-l-4 border-red-500 rounded-md p-4">
  <div class="flex items-start gap-2">
    <AlertCircleIcon class="w-5 h-5 text-red-600 shrink-0" />
    <p class="text-sm text-red-800">Login gagal. Periksa username dan PIN.</p>
  </div>
</div>
```

### Success State

```html
<div class="bg-white rounded-xl border border-slate-200 p-5 text-center space-y-3">
  <CheckCircleIcon class="w-12 h-12 text-emerald-500 mx-auto" />
  <h2 class="text-lg font-bold text-slate-800">Shift Ditutup</h2>
  <p class="text-xs text-slate-500">Ringkasan tersedia di admin panel.</p>
</div>
```

---

## 10. Z-Index Management

| Layer | Value | Usage |
|-------|-------|-------|
| Base content | `0` | Normal flow |
| Sticky banner | `z-20` | Settings changed notification |
| Top bar / Bottom nav | `z-30` | Layout navigation |
| Floating cart bar | `z-40` | Mobile cart floating button |
| Modals / Sheets | `z-50` | Cart modal, cash in/out modal |
| Confirm dialog | `z-[90]` | GlobalConfirm (above modals) |
| Toast notifications | `z-[100]` | GlobalToast (highest) |

---

## 11. Accessibility

### Color Contrast

- Primary text on white: `slate-900` → ratio > 12:1 ✓
- Secondary text: `slate-600` → ratio > 5:1 ✓
- Muted text: `slate-500` → ratio 4.6:1 ✓ (minimum AA)
- White on blue-600: ratio > 4.5:1 ✓
- White on emerald-600: ratio > 4.5:1 ✓

### Touch Targets

- Minimum: `h-10` (40px) for all interactive elements
- Preferred: `h-11` / `h-12` for primary actions
- Navigation: `w-14 h-14` FAB, full grid cell for tab items
- Spacing between targets: minimum `gap-2` (8px)

### Focus States

- Default: `focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100`
- Active tab: Visual color change (`text-blue-600`)
- Keyboard accessible: Tab order follows visual order

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Page Transition Specification

### Forward Navigation (deeper)
- **Enter**: `translateX(20px)` + `opacity: 0` → `translateX(0)` + `opacity: 1`
- **Leave**: `translateX(0)` + `opacity: 1` → `translateX(-10px)` + `opacity: 0`
- **Duration**: Enter 300ms, Leave 200ms
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

### Backward Navigation (shallower)
- **Enter**: `translateX(-20px)` + `opacity: 0` → `translateX(0)` + `opacity: 1`
- **Leave**: `translateX(0)` + `opacity: 1` → `translateX(10px)` + `opacity: 0`
- **Duration**: Enter 300ms, Leave 200ms

### Tab Switch (same level)
- **Effect**: Fade only (no directional slide)
- **Duration**: 200ms
- **Easing**: `ease`

---

## 13. File Structure Convention

```
frontend/src/
├── shared/
│   ├── assets/css/main.css         # Base + component layer styles
│   ├── components/                  # Shared UI (Toast, Confirm, etc.)
│   ├── composables/                 # Shared hooks (useToast, useConfirm)
│   ├── services/                    # API services
│   └── stores/                      # Pinia stores
├── webapp/
│   ├── layouts/KasirLayout.vue      # App shell (top bar + bottom nav)
│   ├── views/                       # Page components
│   ├── components/                  # Webapp-specific components
│   └── router.ts                    # Route definitions
└── admin/                           # Separate admin panel
```

---

## 14. Design Tokens Summary (Quick Copy)

```js
// tailwind.config.js — Key tokens
{
  colors: {
    primary: { DEFAULT: '#2563EB', 600: '#2563eb', 700: '#1d4ed8' },
    success: { DEFAULT: '#059669', light: '#D1FAE5' },
    warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
    danger: { DEFAULT: '#DC2626', light: '#FEE2E2' },
  },
  fontFamily: {
    sans: ['Josefin Sans', 'system-ui', 'sans-serif'],
    mono: ['Source Sans 3', 'system-ui', 'sans-serif'],
  },
  borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem' },
}
```

---

## 15. Anti-Patterns (AVOID)

| Never Do | Do Instead |
|----------|-----------|
| Use emojis (🛒 ⚙️) as icons | Use Lucide SVG icons |
| Random shadow values | Use defined shadow scale |
| Hardcode hex in templates | Use Tailwind tokens / semantic colors |
| `height: 100vh` on mobile | Use `min-h-dvh` or `calc(100vh - offset)` |
| Disable viewport zoom | Keep `initial-scale=1` without `maximum-scale` |
| Animate `width`/`height` | Animate `transform`/`opacity` only |
| Toast without auto-dismiss | Auto-dismiss in 3-5s with progress |
| Modal without escape route | Always provide X button + overlay click |
| Navigation without active state | Highlight current route (`text-blue-600`) |
| Inline styles for colors | Use Tailwind classes or CSS custom properties |
| Mix `rounded-md` and `rounded-xl` randomly | Follow radius scale per component type |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-06-10 | 1.0 | Initial design system documentation |
