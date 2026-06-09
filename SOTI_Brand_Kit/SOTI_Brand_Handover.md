# SOTI Brand Pack — Handover & Implementation Guide

**Purpose:** Apply the **SOTI ("State of the Industry")** look-and-feel — a dark "market terminal" aesthetic by NostraData — throughout the SOTI application, added as a **new theme** (non-destructive: keep any existing styling selectable).

**Source of truth:** `SOTI - Brand Pack (Standalone).html` (the file you provided). It's a self-contained bundle (base64-embedded fonts + a JSON template). Everything below was extracted from its `:root` design tokens and component CSS so you don't need to unpack the bundle yourself.

---

## 0. First steps in the SOTI repo

1. **Store the brand pack in the repo** as the canonical reference. Suggested location:
   ```
   docs/brand/SOTI - Brand Pack (Standalone).html
   ```
   (Copy it from `Downloads/`.) Also commit this handover doc beside it as `docs/brand/SOTI_Brand_Handover.md`.

2. **Add the theme as new, not a replacement.** Scope all tokens under a theme selector (e.g. `[data-theme="soti"]` or a `.theme-soti` wrapper) so the existing look still works. See §4.

3. **Wire up fonts** (§2) — Switzer is *not* on Google Fonts; plan for it.

---

## 1. Design tokens (the core of the brand)

These are the exact `:root` variables from the brand pack. This is the heart of the "look and feel."

```css
:root {
  /* Surfaces (darkest → lightest) */
  --void:    #020407;  /* page surface / deepest background */
  --panel:   #06090C;  /* cards */
  --panel-2: #0C1116;  /* card headers, nested panels */
  --panel-3: #141A21;  /* meta header strips */

  /* Lines / borders */
  --line:    #1F2934;  /* default 1px borders, dot-grid dots */
  --line-2:  #2A3845;  /* stronger borders (screens, segments) */

  /* Text */
  --text:    #E8F4FF;  /* "bone" — primary text & data */
  --dim:     #5A6573;  /* labels, captions, muted prose */
  --dim-2:   #3D4754;  /* faintest labels */

  /* Signal colours */
  --signal:   #5EDDFF; /* CYAN — primary accent, "value", links, highlights */
  --signal-2: #9CECFF; /* lighter cyan */
  --echo:     #6BFFB8; /* MINT — growth, "live"/fresh data, positive delta */
  --warm:     #FF6B47; /* warm orange — decline / negative delta ONLY */

  --on-signal: #06090C; /* text/ink placed ON a cyan fill */

  /* Type families */
  --display: 'Switzer', ui-sans-serif, system-ui, sans-serif;
  --mono:    'JetBrains Mono', ui-monospace, monospace;
}
```

### Colour-role cheat sheet (use these consistently)
| Token | Hex | Use for |
|-------|-----|---------|
| Void | `#020407` | App background surface |
| Panel | `#06090C` | Cards |
| Panel-2 | `#0C1116` | Card headers / nested |
| Signal cyan | `#5EDDFF` | Primary accent, value figures, active states, links |
| Echo mint | `#6BFFB8` | Growth, positive deltas, "live" pings |
| Warm | `#FF6B47` | Decline / negative deltas **only** |
| Text | `#E8F4FF` | Primary text & all data |
| Dim | `#5A6573` | Labels, captions |
| Line | `#1F2934` | Borders + dot grid |

**Two-colour discipline:** the wordmark and most UI stay to **bone text + the cyan/mint signal**. Warm orange is reserved strictly for declines. No gradients on the logo, no decorative rainbow.

---

## 2. Typography & fonts

Two families do all the work:

- **Switzer** — *display*. Headlines, wordmark, KPI values. Weights used: **500, 600, 700, 800, 900**. Heavy (800) for the wordmark/headlines/KPIs.
  - ⚠️ **Not on Google Fonts.** Switzer is free from **Fontshare** (https://www.fontshare.com/fonts/switzer). Options:
    1. Self-host woff2 from Fontshare (recommended for an app), or
    2. Use the Fontshare CSS API `<link>`, or
    3. Extract the embedded woff2s from the brand-pack bundle (they're in the `__bundler/manifest` as base64) if you want byte-identical files.
- **JetBrains Mono** — *data/mono*. **Every number, %, rank, label, breadcrumb, and "terminal" string** is monospace, tabular. Weights: **300, 400, 500, 600, 700**. On Google Fonts.

```html
<!-- JetBrains Mono via Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<!-- Switzer via Fontshare -->
<link href="https://api.fontshare.com/v2/css?f[]=switzer@500,600,700,800,900&display=swap" rel="stylesheet">
```

### Type rules (from the brand pack)
- **Wordmark / headlines / KPI values:** Switzer **800**. Headlines & KPI values use tight tracking (`-.02em`); wordmark slightly open (`+.01em`).
- **Data line example:** `+6.4% · $23.8B · ▲` in JetBrains Mono. Growth in **mint**, decline in **warm**.
- **Labels:** uppercase, letter-spacing `.12em`, in `--dim`, mono.
- Body base: Switzer 500, ~14.5px, line-height 1.55.

---

## 3. Signature visual motifs

These are what make it read as SOTI (don't skip them):

1. **Dark dot-grid surface** — the page background is `--void` plus a faint dot grid + a cyan glow in the top-right:
   ```css
   body {
     background: var(--void);
     color: var(--text);
     font-family: var(--display);
     font-weight: 500;
     -webkit-font-smoothing: antialiased;
     background-image:
       radial-gradient(ellipse at 82% -8%, rgba(94,221,255,.08), transparent 50%),
       radial-gradient(var(--line) 1px, transparent 1px);
     background-size: auto, 22px 22px;
     background-position: 0 0, -1px -1px;
     background-attachment: fixed;
   }
   ```
2. **The "ping"** — a small mint dot that pulses (the radar blip / "fresh data" signal), used next to the wordmark and live indicators:
   ```css
   .ping {
     width:.16em; height:.16em; min-width:9px; min-height:9px; border-radius:50%;
     background: var(--echo);
     box-shadow: 0 0 0 0 color-mix(in srgb, var(--echo) 70%, transparent);
   }
   @media (prefers-reduced-motion: no-preference) {
     .ping { animation: ping 2.6s ease-out infinite; }
     @keyframes ping {
       0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--echo) 60%, transparent); }
       70%  { box-shadow: 0 0 0 .9em transparent; }
       100% { box-shadow: 0 0 0 0 transparent; }
     }
   }
   ```
3. **Hard 1px borders everywhere** (`--line`), **no rounded corners**, **no shadows** except deep "screen" cards. "Infrastructure, not advertising — it should read like a market terminal."
4. **Wordmark:** `SOTI` in Switzer 800 + mint ping. Module variants append `·Rx` / `·OTC` in **cyan italic** (`.mod { color: var(--signal); font-style: italic; font-weight: 700; }`). No glyphs, no gradients.

---

## 4. Recommended integration (as a NEW theme)

Scope every token under a theme attribute so the existing app styling is untouched:

```css
/* soti-theme.css */
[data-theme="soti"] {
  --void:#020407; --panel:#06090C; --panel-2:#0C1116; --panel-3:#141A21;
  --line:#1F2934; --line-2:#2A3845;
  --text:#E8F4FF; --dim:#5A6573; --dim-2:#3D4754;
  --signal:#5EDDFF; --signal-2:#9CECFF; --echo:#6BFFB8; --warm:#FF6B47;
  --on-signal:#06090C;
  --display:'Switzer',ui-sans-serif,system-ui,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,monospace;
}

[data-theme="soti"] body,
[data-theme="soti"] .app-root {
  background: var(--void);
  color: var(--text);
  font-family: var(--display);
  font-weight: 500;
  background-image:
    radial-gradient(ellipse at 82% -8%, rgba(94,221,255,.08), transparent 50%),
    radial-gradient(var(--line) 1px, transparent 1px);
  background-size: auto, 22px 22px;
  background-position: 0 0, -1px -1px;
  background-attachment: fixed;
}
```

Activate with `document.documentElement.dataset.theme = 'soti'` (or set on a wrapper). If the app uses a CSS-in-JS / token system (Tailwind config, MUI theme, design-tokens file), map the §1 tokens into that system instead of raw CSS — same values, native mechanism.

**If the SOTI app is the SOTI product itself** (likely), you may want SOTI as the *default* theme rather than optional — but still implement it as a named theme layer so it's maintainable.

---

## 5. Component recipes (copy from the brand pack)

The brand pack's `<style>` block contains production-ready CSS for every component below. Lift them as-is and rename to your conventions. Key components and their intent:

| Class | Component | Notes |
|-------|-----------|-------|
| `.statusbar` | Sticky top terminal bar | `$ nostradata/...` left, status right; mono uppercase; blurred translucent void bg |
| `.smark` / `.ping` / `.mod` | Wordmark + ping + module suffix | Switzer 800; mint ping; cyan italic `·Rx`/`·OTC` |
| `.cover` | Hero / cover header | 1.5fr/1fr grid; giant `clamp()` wordmark; meta record panel |
| `.meta` | "Product record" key/value panel | Dashed row separators, mono |
| `.sec` / `.sec-head` | Section + numbered header | `.pageno` cyan chip, `$ ./section` mono label, italic-cyan emphasis in `h2 em` |
| `.lede` / `.prose` | Lead sentence / body prose | `.lede` Switzer 600 large; `.prose` mono 13px dim |
| `.card` (`.ch`/`.cb`) | Bordered card w/ header | Header strip on `--panel-2` |
| `.mod-card` | Module feature card | Used for the two-modules section |
| `.swatches` / `.sw` | Colour swatch grid | For palette display |
| `.typ` | Type specimen block | |
| `.kpi` / `.kpis` | KPI / metric cards | Switzer 800 value; `.delta` mint, `.delta.down` warm; `.u` small unit |
| `.screen` / `.titlebar` / `.dash` | "Dash-Bot" dashboard mockup | The fake-browser data screen — great template for real dashboard panels |
| `.bars` / `.bar` (`.track`/`.fill`/`.d`) | Horizontal bar rows | Cyan gradient fill; value+delta on right; `.down` → warm |
| `.basket` | Ranked list panel | Right-column brand lists |
| `.seg` | Segmented toggle | `.on` = cyan fill + `--on-signal` ink (e.g. Rx ↔ OTC) |
| `.crumb` | Drill breadcrumb | `Whole of market › Category › Brand › SKU` |
| `.method` | Methodology 2-col grid | |
| `.aud` / `.a` | Audience cards | |
| `.cta` | Call-to-action panel | Cyan border + faint cyan gradient bg |
| `footer` | Footer | Mono, uppercase, faint |

**Reusable patterns to standardise:**
- Active/selected state = **cyan fill (`--signal`) with `--on-signal` ink** (see `.seg span.on`, `.sec-head .pageno`).
- Positive number = `--echo` (mint); negative = `--warm`. Apply via a `.down`/`.up` modifier.
- Card header strip pattern: `padding:9px 15px; border-bottom:1px solid var(--line); background:var(--panel-2); mono 10.5px; uppercase; letter-spacing:.12em; color:var(--dim)`.

### Print stylesheet
The pack inverts to light for print (`@media print { body { background:#fff; color:#000; background-image:none } ... }`) and disables the ping animation. Carry this over if the app has printable/report views.

---

## 6. Accessibility / quality checklist

- [ ] Respect `prefers-reduced-motion` — the ping animation already guards on it; do the same for any new motion.
- [ ] Contrast: `--text` (#E8F4FF) on `--void` is strong; `--dim` (#5A6573) on `--void` is for *secondary* text only — don't use it for primary content.
- [ ] Cyan (`--signal`) as a link/active colour on dark passes; ensure focus states are visible (add a cyan outline).
- [ ] `color-mix()` is used in a few places — fine in modern browsers; provide a fallback if you must support older targets.
- [ ] Keep the two-colour discipline: don't introduce new accent hues; warm is decline-only.

---

## 7. Suggested task list for the SOTI repo

1. Copy brand pack HTML + this doc into `docs/brand/`.
2. Add `soti-theme.css` (tokens from §1/§4) and load fonts (§2).
3. Apply the dot-grid `body`/root surface (§3).
4. Port shared components (statusbar, cards, KPI, bars, segmented toggle, breadcrumb) from §5 into the app's component library, mapping tokens to the app's styling system.
5. Replace ad-hoc colours/fonts with tokens throughout (search for hex codes & font-family declarations).
6. Add the ping + active-state (cyan-fill) + positive/negative (mint/warm) conventions.
7. Verify print/report views, reduced-motion, and contrast.
8. Commit & push.

---

*Extracted from `SOTI - Brand Pack (Standalone).html`. All hex values, font weights, and component CSS above are taken verbatim from the bundle's design tokens and stylesheet.*
