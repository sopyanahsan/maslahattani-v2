# Design System — Maslahat Tani v2

**Theme:** Clean Professional (Bank/Fintech style)  
**Updated:** May 2026  
**Framework:** Nuxt 3 + Tailwind CSS  

---

## 1. Color Palette

### Brand Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#2563EB` | `blue-600` | CTA buttons, links, active states |
| Primary Dark | `#1E40AF` | `blue-800` | Hover states, emphasis |
| Primary Light | `#DBEAFE` | `blue-100` | Info badges, highlights |

### Semantic Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#059669` | `emerald-600` | Lunas, completed, positive |
| Success Light | `#D1FAE5` | `emerald-100` | Success badges bg |
| Warning | `#D97706` | `amber-600` | Jatuh tempo, pending |
| Warning Light | `#FEF3C7` | `amber-100` | Warning badges bg |
| Danger | `#DC2626` | `red-600` | Overdue, error, void, delete |
| Danger Light | `#FEE2E2` | `red-100` | Danger badges bg |
| Info | `#6366F1` | `indigo-500` | Informational, neutral action |

### Neutral Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Background | `#F8FAFC` | `slate-50` | Page background |
| Surface | `#FFFFFF` | `white` | Card backgrounds |
| Border | `#E2E8F0` | `slate-200` | Card borders, dividers, input borders |
| Border Hover | `#CBD5E1` | `slate-300` | Hover borders |
| Text Primary | `#0F172A` | `slate-950` | Headings, important text |
| Text Body | `#1E293B` | `slate-800` | Body text |
| Text Secondary | `#64748B` | `slate-500` | Captions, helper text |
| Text Muted | `#94A3B8` | `slate-400` | Disabled, placeholder |
| Sidebar Dark | `#0F172A` | `slate-900` | Sidebar background |
| Sidebar Hover | `#1E293B` | `slate-800` | Sidebar hover state |

---

## 2. Typography

### Font Family

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale

| Level | Size | Weight | Color | Usage |
|-------|------|--------|-------|-------|
| H1 | 32px (`text-[32px]`) | Bold (700) | slate-950 | Page titles |
| H2 | 24px (`text-2xl`) | Bold (700) | slate-950 | Section headers |
| H3 | 20px (`text-xl`) | Semibold (600) | slate-900 | Subsection titles |
| H4 | 16px (`text-base`) | Semibold (600) | slate-900 | Card titles |
| Body | 14px (`text-sm`) | Regular (400) | slate-800 | Default body text |
| Caption | 12px (`text-xs`) | Regular (400) | slate-600 | Labels, helper text |
| Mono | 14px (`text-sm font-mono`) | Medium (500) | slate-950 | Nominal/angka, kode |

### Special Cases

| Case | Style | Example |
|------|-------|---------|
| Nominal besar | 28px, Bold, Mono | `Rp 2.500.000` |
| Badge text | 12px, Medium | `Lunas`, `Pending` |
| Table header | 12px, Bold, Uppercase | `NO TRX`, `TOTAL` |
| Button text | 14px, Semibold | `Simpan`, `Batal` |
| Input label | 12px, Semibold, slate-900 | `Nama Produk` |
| Placeholder | 14px, Regular, slate-400 | `Masukkan nama...` |

---

## 3. Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight internal padding |
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Card internal gaps |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Between sections (compact) |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Between page sections |
| `space-10` | 40px | Page padding |

### Layout Rules

- **Page padding**: `p-6` (24px) on desktop, `p-4` (16px) on mobile
- **Card padding**: `p-4` (16px) for data-dense, `p-6` (24px) for spacious
- **Grid gap**: `gap-4` (16px) between cards, `gap-3` (12px) between form fields
- **Section gap**: `space-y-8` (32px) between page sections
- **Max content width**: `max-w-7xl` (1280px)
- **Sidebar width**: `w-64` (256px) desktop, collapsible on mobile

### Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (sidebar visible) |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

---

## 4. Borders & Shadows

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Cards, large buttons |
| `rounded-xl` | 12px | Modals, dialogs |
| `rounded-2xl` | 16px | Login cards, hero sections |
| `rounded-full` | 9999px | Badges, pills, avatars |

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards, dropdowns |
| `shadow-md` | Elevated cards, popovers |
| `shadow-lg` | Floating elements |
| `shadow-xl` | Modals, dialogs |

### Borders

- **Default border**: `border border-slate-200`
- **Focus border**: `border-blue-600 ring-2 ring-blue-100`
- **Error border**: `border-red-500 ring-2 ring-red-100`
- **Divider**: `border-b border-slate-200`

---

## 5. Buttons

### Variants

| Variant | Classes | Usage |
|---------|---------|-------|
| **Primary** | `bg-blue-600 text-white hover:bg-blue-700` | Main CTA, submit |
| **Secondary** | `bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200` | Cancel, secondary action |
| **Danger** | `bg-red-600 text-white hover:bg-red-700` | Delete, destructive |
| **Danger Outline** | `bg-red-50 text-red-600 border border-red-200 hover:bg-red-100` | Soft danger |
| **Ghost** | `bg-transparent text-blue-600 border border-blue-200 hover:bg-blue-50` | Tertiary, link-style |
| **Disabled** | `bg-slate-200 text-slate-400 cursor-not-allowed opacity-50` | Non-interactive |

### Sizes

| Size | Classes | Usage |
|------|---------|-------|
| **Small (sm)** | `h-8 px-3 text-xs rounded-md` | Inline actions, table buttons |
| **Medium (md)** | `h-10 px-4 text-sm rounded-md` | Standard actions |
| **Large (lg)** | `h-12 px-6 text-base rounded-lg` | Primary CTA, modals |

### States

```
Default → Hover → Active → Focus → Disabled
```

- **Focus**: `focus:ring-2 focus:ring-blue-100 focus:outline-none`
- **Loading**: Show spinner (w-4 h-4 animate-spin) + text "Menyimpan..."
- **Transition**: `transition-colors duration-150`

---

## 6. Cards

### Stat Card

```html
<!-- Stat Card -->
<div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
  <p class="text-xs text-slate-600 mb-2">Label</p>
  <p class="text-[28px] font-bold font-mono text-slate-950">Rp 2.500.000</p>
  <p class="text-xs text-emerald-600 mt-1">↑ 12% dari kemarin</p>
</div>
```

### Data Card (Compact)

```html
<!-- Data Card -->
<div class="bg-white p-4 rounded-lg border border-slate-200">
  <h4 class="text-sm font-semibold text-slate-900 mb-3">Title</h4>
  <!-- Dense content here -->
</div>
```

### Section Card

```html
<!-- Section with header -->
<div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
  <div class="px-4 py-3 border-b border-slate-200 bg-slate-50">
    <h3 class="text-sm font-bold text-slate-900">Section Title</h3>
  </div>
  <div class="p-4">
    <!-- Content -->
  </div>
</div>
```

---

## 7. Form Inputs

### Text Input

```html
<div>
  <label class="block text-xs font-semibold text-slate-900 mb-1.5">Label</label>
  <input 
    type="text" 
    placeholder="Placeholder..."
    class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md 
           bg-white text-slate-900 placeholder:text-slate-400
           focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100
           disabled:bg-slate-50 disabled:opacity-60"
  />
  <p class="mt-1 text-xs text-slate-500">Helper text (optional)</p>
</div>
```

### Select

```html
<select class="w-full h-10 px-3 text-sm border border-slate-200 rounded-md 
               bg-white text-slate-900
               focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
  <option value="">Pilih...</option>
</select>
```

### Input States

| State | Border | Background | Ring |
|-------|--------|------------|------|
| Default | `border-slate-200` | `bg-white` | none |
| Focus | `border-blue-600` | `bg-white` | `ring-2 ring-blue-100` |
| Error | `border-red-500` | `bg-white` | `ring-2 ring-red-100` |
| Disabled | `border-slate-200` | `bg-slate-50` | none |
| Read-only | `border-slate-200` | `bg-slate-50` | none |

---

## 8. Tables

### Structure

```html
<div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200">
        <th class="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wide">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <td class="px-4 py-2.5 text-sm text-slate-900">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Rules

- Header: `bg-slate-50`, bold, 12px, uppercase
- Row height: compact (`py-2.5`)
- Hover: `hover:bg-slate-50`
- Divider: `border-b border-slate-200`
- Nominal column: `font-mono` alignment right
- Action column: text links `text-blue-600 hover:text-blue-700`
- No zebra striping (use hover only)

---

## 9. Badges & Status Pills

### Variants

| Status | Classes |
|--------|---------|
| **Lunas / Success** | `bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium` |
| **Pending / Warning** | `bg-amber-100 text-amber-700 ...` |
| **Overdue / Danger** | `bg-red-100 text-red-700 ...` |
| **Aktif / Info** | `bg-blue-100 text-blue-700 ...` |
| **Nonaktif / Neutral** | `bg-slate-100 text-slate-600 ...` |

### Usage

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
  Lunas
</span>
```

---

## 10. Sidebar Navigation

### Structure

```
┌─────────────────────────┐
│  🏪 Maslahat Tani       │  ← Logo area (h-16)
│  Admin Dashboard         │
├─────────────────────────┤
│                          │
│  📊 Dashboard     [act]  │  ← Active: blue-600 bg, white text
│  🛒 Transaksi           │  ← Normal: slate-400 text
│  📦 Produk & Stok       │
│  💰 Hutang              │
│  📈 Laporan             │
│  👤 Kasir               │
│                          │
├─────────────────────────┤
│  ⚙️ Pengaturan          │  ← Bottom section
│  🚪 Logout              │
└─────────────────────────┘
```

### Styles

| Element | Classes |
|---------|---------|
| Container | `w-64 bg-slate-900 text-white min-h-screen flex flex-col` |
| Logo area | `h-16 px-5 flex items-center border-b border-slate-800` |
| Nav item (normal) | `flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 rounded-md mx-2 hover:bg-slate-800 hover:text-white transition` |
| Nav item (active) | `... bg-blue-600 text-white font-medium` |
| Section divider | `my-2 border-t border-slate-800` |

---

## 11. Modals & Dialogs

### Structure

```html
<!-- Overlay -->
<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
  <!-- Dialog -->
  <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
      <h3 class="text-lg font-bold text-slate-950">Title</h3>
      <button class="text-slate-400 hover:text-slate-600">✕</button>
    </div>
    <!-- Body -->
    <div class="px-6 py-5">
      <p class="text-sm text-slate-600">Content here...</p>
    </div>
    <!-- Footer -->
    <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
      <button class="[secondary button]">Batal</button>
      <button class="[primary/danger button]">Konfirmasi</button>
    </div>
  </div>
</div>
```

### Sizes

| Size | Max Width | Usage |
|------|-----------|-------|
| Small | `max-w-sm` (384px) | Confirm dialogs |
| Medium | `max-w-md` (448px) | Forms, details |
| Large | `max-w-lg` (512px) | Complex forms |
| XL | `max-w-2xl` (672px) | Data tables in modal |

---

## 12. Empty & Loading States

### Empty State

```html
<div class="flex flex-col items-center justify-center py-16 px-4">
  <div class="text-5xl mb-4">📭</div>
  <p class="text-base font-semibold text-slate-900 mb-1">Tidak ada data</p>
  <p class="text-sm text-slate-600 mb-6 text-center">
    Mulai dengan membuat transaksi baru atau import data
  </p>
  <button class="[primary button]">+ Buat Baru</button>
</div>
```

### Loading State

```html
<div class="flex flex-col items-center justify-center py-12">
  <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
  <p class="text-sm text-slate-600">Memuat data...</p>
</div>
```

### Skeleton Loading

```html
<div class="animate-pulse">
  <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-slate-200 rounded w-1/2"></div>
</div>
```

---

## 13. Toast / Notifications

### Variants

| Type | Classes |
|------|---------|
| **Success** | `bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900` |
| **Error** | `bg-red-50 border-l-4 border-red-500 text-red-900` |
| **Warning** | `bg-amber-50 border-l-4 border-amber-500 text-amber-900` |
| **Info** | `bg-blue-50 border-l-4 border-blue-500 text-blue-900` |

### Position

- Top-right corner: `fixed top-4 right-4 z-[100]`
- Auto-dismiss: 5 seconds
- Animation: slide-in from right, fade-out

---

## 14. Icons

### Library

**Lucide Icons** (via `lucide-vue-next`)

### Rules

- Size: 16px for inline, 20px for buttons, 24px for navigation
- Color: Inherit from parent text color
- Stroke width: 2px (default)
- Only use icons for **functional** purpose (not decorative)

### Common Icons

| Icon | Usage |
|------|-------|
| `Plus` | Add/create action |
| `Pencil` | Edit action |
| `Trash2` | Delete action |
| `Search` | Search input |
| `ChevronDown` | Dropdown indicator |
| `X` | Close/dismiss |
| `Check` | Success/confirm |
| `AlertTriangle` | Warning |
| `Loader2` | Loading (animate-spin) |
| `Eye` / `EyeOff` | Show/hide password |

---

## 15. Animation & Transitions

### Durations

| Speed | Duration | Usage |
|-------|----------|-------|
| Fast | 150ms | Hover states, color changes |
| Normal | 200ms | Modals, dropdowns |
| Slow | 300ms | Page transitions, accordions |

### Common Transitions

```css
/* Hover color change */
transition-colors duration-150

/* Modal enter */
transition-all duration-200 ease-out

/* Sidebar collapse */
transition-all duration-300 ease-in-out
```

### No animation on:

- Table row hover (instant `bg-slate-50`)
- Button active state (instant)
- Focus ring (instant)

---

## 16. Responsive Behavior

### Mobile (< 1024px)

- Sidebar: Hidden, toggle via hamburger menu
- Stat cards: 2 columns → 1 column
- Tables: Horizontal scroll
- Modals: Full-width with `max-w-full mx-4`
- Navigation: Bottom tab bar (kasir webapp)

### Desktop (>= 1024px)

- Sidebar: Fixed left, always visible
- Content: `ml-64` offset
- Stat cards: 4 columns grid
- Tables: Full width, no scroll
- Modals: Centered with max-width

---

## 17. Dark Mode (Phase 2)

> Not implemented in Phase 1. Placeholder for future.

Will use Tailwind `dark:` prefix with CSS variables for theming.

---

## 18. Naming Conventions

### CSS Classes (Tailwind)

- Use utility-first approach
- Extract to components when pattern repeats 3+ times
- Use `@apply` sparingly (only for base styles)

### Component Naming

```
Button → BaseButton.vue
Card → BaseCard.vue, StatCard.vue
Modal → BaseModal.vue
Badge → StatusBadge.vue
Input → FormInput.vue, FormSelect.vue
Table → DataTable.vue
```

### Color Variables (if using CSS custom properties)

```css
:root {
  --color-primary: #2563EB;
  --color-primary-dark: #1E40AF;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-secondary: #64748B;
}
```

---

## Summary — Quick Reference

```
Background:     slate-50    (#F8FAFC)
Card:           white       + border-slate-200 + shadow-sm + rounded-lg
Button Primary: blue-600    + text-white + rounded-md + h-10
Button Danger:  red-600     + text-white + rounded-md
Input:          border-slate-200 + rounded-md + h-10 + focus:ring-blue
Badge Success:  emerald-100 + text-emerald-700 + rounded-full
Badge Warning:  amber-100   + text-amber-700 + rounded-full
Badge Danger:   red-100     + text-red-700 + rounded-full
Table Header:   bg-slate-50 + text-xs + font-bold + uppercase
Sidebar:        bg-slate-900 + text-white + w-64
Modal:          white + rounded-xl + shadow-xl + max-w-md
```

---

**This document is the source of truth for all frontend UI decisions.**  
Update this file whenever design tokens or patterns change.
