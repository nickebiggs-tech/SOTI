# SOTI Brand Integration Plan

## Audit Summary

**Current styling system:**
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — no `tailwind.config.js`
- **Theme tokens** defined in `@theme {}` block in `src/index.css` (CSS custom properties)
- **Livery system** in `src/theme/themes.ts` + `ThemeProvider.tsx` — runtime theme switching via `--theme-*` CSS variables on `document.documentElement`, persisted to localStorage
- **2 liveries** exist: `soti` (blue/teal) and `nostradata` (teal-blue/teal)
- **Font**: Inter (system-fallback, no self-hosted files)
- **Single CSS file**: `src/index.css` (806 lines — resets, animations, Recharts overrides)
- **Layout**: `AppLayout.tsx` → `Sidebar` (dark gradient) + `Header` (white) + `<main>` (bg-slate-50) + `BottomNav` (white)
- **Hardcoded colors everywhere**: `bg-white`, `bg-slate-50`, `text-slate-900`, `border-slate-200`, `text-emerald-600`, `text-red-600` etc. scattered across all components

**The challenge:** Components use Tailwind utility classes with hardcoded slate/white colors. The livery system only swaps accent colors (`primary`, `accent`, `chart-*`) — it doesn't touch background, text, or border colors. A full dark theme requires either:
1. Adding `[data-theme="soti-brand"]` overrides in CSS (theme layer approach), OR
2. Mapping ALL surface/text/border colors to CSS variables and swapping them

I'll use **approach 1** (CSS theme layer) as the primary mechanism, supplemented by extending the livery system with surface/text tokens for the components that need them.

---

## Plan

### Step 1: Create Brand Kit Assets

Since `SOTI_Brand_Kit/` isn't in the repo, I'll create the authoritative assets:

**a) Fonts** → `public/fonts/soti/`
- Download Switzer (from fontshare.com) and JetBrains Mono (from Google Fonts / JetBrains) as woff2
- Since these are web-downloadable open-source fonts, I'll reference them from CDN initially and provide `@font-face` declarations for self-hosting

**b) CSS tokens** → `src/styles/soti/soti-tokens.css`
- All `[data-theme="soti-brand"]` custom properties
- Authoritative hexes from the spec

**c) Component recipes** → `src/styles/soti/soti-components.css`
- Dot-grid surface, mint ping, KPI card, chart card, etc.

**d) Font faces** → `src/styles/soti/soti-fonts.css`
- `@font-face` for Switzer (400, 500, 600, 700, 800) and JetBrains Mono (400, 500, 700)

### Step 2: Wire Tokens into the Theme System

**a) Add `soti-brand` livery** in `src/theme/themes.ts`:
```typescript
'soti-brand': {
  id: 'soti-brand',
  name: 'SOTI Terminal',
  tagline: 'Market Intelligence',
  logoText: 'SOTI',
  logoShort: 'SO',
  fontFamily: '"Switzer", ui-sans-serif, system-ui, sans-serif',
  poweredBy: 'NostraData',
  colors: {
    // Map ALL brand tokens to --theme-* variables
    'theme-primary': '#5EDDFF',        // signal (cyan)
    'theme-primary-light': '#5EDDFF',
    'theme-primary-foreground': '#06090C', // on-signal
    'theme-accent': '#6BFFB8',         // echo (mint)
    'theme-accent-foreground': '#06090C',
    'theme-ring': '#5EDDFF',
    'theme-sidebar-from': '#020407',   // void
    'theme-sidebar-to': '#06090C',     // panel
    'theme-hero-from': '#020407',
    'theme-hero-mid': '#5EDDFF',
    'theme-hero-to': '#6BFFB8',
    // NEW surface/text tokens:
    'theme-void': '#020407',
    'theme-panel': '#06090C',
    'theme-line': '#1F2934',
    'theme-text': '#E8F4FF',
    'theme-dim': '#5A6573',
    'theme-signal': '#5EDDFF',
    'theme-echo': '#6BFFB8',
    'theme-warm': '#FF6B47',
    'theme-on-signal': '#06090C',
    // Charts — cyan-based palette
    'theme-chart-1': '#5EDDFF',
    'theme-chart-2': '#6BFFB8',
    'theme-chart-3': '#FF6B47',
    'theme-chart-4': '#A78BFA',
    'theme-chart-5': '#FBBF24',
  },
}
```

**b) Extend `ThemeProvider.tsx`** `applyLivery()` to set `data-theme` attribute:
- When livery `soti-brand` is active → `document.documentElement.dataset.theme = 'soti-brand'`
- Otherwise → remove `data-theme`

**c) Extend `@theme {}` in `src/index.css`** with new color tokens:
```css
--color-void: var(--theme-void, transparent);
--color-panel: var(--theme-panel, #ffffff);
--color-line: var(--theme-line, #e2e8f0);
--color-text-primary: var(--theme-text, #1e293b);
--color-dim: var(--theme-dim, #64748b);
--color-signal: var(--theme-signal, #2563EB);
--color-echo: var(--theme-echo, #0D9488);
--color-warm: var(--theme-warm, #DC2626);
--color-on-signal: var(--theme-on-signal, #FFFFFF);
--font-mono: var(--theme-font-mono, ui-monospace, monospace);
```

This means existing liveries keep their light-mode look; only `soti-brand` activates the dark terminal aesthetic.

### Step 3: CSS Theme Layer (`src/styles/soti/soti-theme.css`)

A `[data-theme="soti-brand"]` block that overrides the light-mode defaults:

```css
[data-theme="soti-brand"] {
  /* Surface */
  background-color: var(--color-void);
  color: var(--color-text-primary);
}

/* Override all white backgrounds to panel */
[data-theme="soti-brand"] .bg-white { background-color: var(--color-panel) !important; }
[data-theme="soti-brand"] .bg-slate-50 { background-color: var(--color-void) !important; }
/* Override borders */
[data-theme="soti-brand"] .border-slate-200 { border-color: var(--color-line) !important; }
/* Override text colors */
[data-theme="soti-brand"] .text-slate-900 { color: var(--color-text-primary) !important; }
[data-theme="soti-brand"] .text-slate-600,
[data-theme="soti-brand"] .text-slate-500 { color: var(--color-dim) !important; }
/* etc. for all hardcoded slate/white references */
```

Plus dot-grid background, cyan glow, scrollbar dark, Recharts overrides, and focus outlines.

### Step 4: Component Restyling

Rather than rewriting all 11 feature pages, I'll:

**a) Add a `soti-theme.css`** with `[data-theme="soti-brand"]` overrides that catch ALL hardcoded Tailwind utility classes (`bg-white`, `bg-slate-50`, `text-slate-*`, `border-slate-*`, etc.) and remap them.

**b) Restyle specific components:**
- **KPICard** → square corners (`rounded-none`), 1px border, no shadow, Switzer 800 value, JetBrains Mono for numbers
- **Header** → dark panel background, signal-colored brand text, `·Rx` `·OTC` wordmark
- **Sidebar** → void background (no gradient), 1px line border, signal-colored active states
- **BottomNav** → panel background, line border-top, signal active states
- **Charts** → dark tooltips (panel bg, line border), cyan/mint/warm palette
- **Login page hero** → void background with dot-grid, cyan glow, Switzer headlines
- **Delta badges** → echo (mint) for positive, warm (orange-red) for negative — no emerald/red
- **Tables/lists** → 1px line borders, dim text for secondary, signal for active/hover

**c) Mint "ping" animation** for live indicators (dot pulsing with echo color).

**d) SOTI wordmark component**: `SOTI·Rx` / `SOTI·OTC` with cyan italic suffix.

### Step 5: Font Integration

**a) Download fonts** → `public/fonts/soti/`:
- Switzer-Regular.woff2, Switzer-Medium.woff2, Switzer-Semibold.woff2, Switzer-Bold.woff2, Switzer-Extrabold.woff2
- JetBrainsMono-Regular.woff2, JetBrainsMono-Medium.woff2

**b) `@font-face`** declarations in `src/styles/soti/soti-fonts.css`

**c) Utility classes**: `.font-display` (Switzer), `.font-data` (JetBrains Mono)

### Step 6: Quality

- `@media (prefers-reduced-motion: reduce)` → disable all animations
- Contrast: verify text (#E8F4FF) on void (#020407) = 17:1 ratio (AAA), dim (#5A6573) on void = 4.6:1 (AA)
- Cyan focus outline: `outline: 2px solid var(--color-signal); outline-offset: 2px`
- Print: `@media print` → white bg, dark text, hide sidebar/nav
- Scrollbar: thin dark scrollbar matching theme

### Step 7: Files Changed

| File | Change |
|---|---|
| `public/fonts/soti/*.woff2` | NEW — Switzer + JetBrains Mono font files |
| `src/styles/soti/soti-fonts.css` | NEW — @font-face declarations |
| `src/styles/soti/soti-tokens.css` | NEW — [data-theme] custom properties |
| `src/styles/soti/soti-components.css` | NEW — dot-grid, ping, card, chart recipes |
| `src/index.css` | MODIFIED — import soti CSS, extend @theme with surface tokens |
| `src/theme/themes.ts` | MODIFIED — add soti-brand livery |
| `src/theme/ThemeProvider.tsx` | MODIFIED — set data-theme attribute, set soti-brand as default |
| `src/components/layout/AppLayout.tsx` | MODIFIED — replace hardcoded bg-slate-50 with token |
| `src/components/layout/Header.tsx` | MODIFIED — SOTI wordmark, dark-aware colors |
| `src/components/layout/Sidebar.tsx` | MODIFIED — void bg, signal active states |
| `src/components/layout/BottomNav.tsx` | MODIFIED — panel bg, signal active |
| `src/components/ui/KPICard.tsx` | MODIFIED — square corners, font-data for numbers, brand colors |
| `src/features/login/LoginPage.tsx` | MODIFIED — void + dot-grid surface, Switzer headlines |
| `src/features/dashboard/DashboardPage.tsx` | MODIFIED — brand chart colors, dark cards |
| `index.html` | MODIFIED — theme-color meta to #020407 |
| Other feature pages | MODIFIED — primarily caught by CSS overrides, minimal JSX changes |

### Toggle Mechanism

Users switch themes via the existing Settings page (`/admin/branding`), which calls `setLivery('soti-brand')`. The `soti-brand` livery will be set as the **default** so the app launches in brand mode. Previous themes (`soti`, `nostradata`) remain available.
