# SOTI Brand Kit

Everything needed to apply the **SOTI ("State of the Industry")** dark "market
terminal" brand by NostraData to an application. Extracted from the official
`SOTI - Brand Pack (Standalone).html`.

## Contents

| File | What it is |
|------|------------|
| **PROMPT_FOR_SOTI_REPO.md** | ⭐ The prompt to paste into Claude Code inside the SOTI repo. Start here. |
| **SOTI_Brand_Handover.md** | Full implementation guide: tokens, fonts, motifs, component recipes, checklist. |
| **soti-theme.css** | Design tokens (CSS custom properties) + the signature dark dot-grid surface, scoped to `[data-theme="soti"]`. |
| **soti-components.css** | Reusable components (statusbar, cards, KPI, bars, segmented toggle, breadcrumb, dashboard "screen", CTA, footer), scoped. |
| **soti-fonts.css** | `@font-face` rules for the self-hosted fonts. Fix `url()` paths to match your app. |
| **fonts/** | The actual woff2 files (Switzer 500–900 + JetBrains Mono latin/latin-ext, normal + italic). |
| **SOTI - Brand Pack (Standalone).html** | The original reference. Open in a browser to see the target look. |

## Quick start

1. Copy this whole folder into the SOTI repo (e.g. repo root, temporarily).
2. Open **PROMPT_FOR_SOTI_REPO.md**, copy the fenced prompt, and run it in Claude
   Code from the repo root.
3. The agent will install the assets, wire the tokens into your styling system,
   activate the theme, and restyle the app throughout — as a non-destructive theme.

## The brand in one screen

- **Surface:** Void `#020407` + faint dot-grid + a cyan glow top-right.
- **Accents:** Signal cyan `#5EDDFF` (primary), Echo mint `#6BFFB8` (growth/live),
  Warm `#FF6B47` (decline only).
- **Text:** Bone `#E8F4FF`; Dim `#5A6573` for labels.
- **Type:** Switzer 800 for display/headlines/KPIs; JetBrains Mono for every number.
- **Feel:** hard 1px borders, square corners, no fluff — *infrastructure, not advertising.*
- **Signature:** the pulsing mint "ping" (radar blip = fresh data); `SOTI·Rx` /
  `SOTI·OTC` wordmark with cyan-italic module suffix.
