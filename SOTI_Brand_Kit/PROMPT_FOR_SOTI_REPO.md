# Prompt to paste into Claude Code (run from the root of the SOTI repo)

> Copy everything in the fenced block below into Claude Code while your working
> directory is the SOTI application repo. First, copy this whole `SOTI_Brand_Kit/`
> folder somewhere the agent can read it (e.g. into the repo root, temporarily),
> then run the prompt. Adjust the two PATH lines at the top if you put it elsewhere.

---

```
You are applying the official SOTI ("State of the Industry") brand — a dark
"market terminal" look by NostraData — across this application. A complete brand
kit has been provided. Treat it as the source of truth.

BRAND KIT LOCATION: ./SOTI_Brand_Kit        (contains fonts/, the 3 CSS files,
                    the standalone brand-pack HTML, and SOTI_Brand_Handover.md)

Goal: make the app adopt the SOTI look and feel THROUGHOUT, implemented as a
named theme layer (not a hard fork of styles), so it's maintainable and the
previous styling isn't silently destroyed.

Do the following:

1. READ FIRST
   - Read SOTI_Brand_Kit/SOTI_Brand_Handover.md fully — it documents the tokens,
     fonts, signature motifs (dot-grid surface, mint "ping", hard 1px borders,
     ·Rx/·OTC cyan-italic wordmark), and component recipes.
   - Then inspect THIS repo: identify the framework (React/Vue/Next/plain/etc.),
     the styling system (CSS modules / Tailwind / styled-components / MUI / SCSS
     tokens), where global styles and fonts are loaded, and the main layout
     shell. Report what you found before making changes.

2. INSTALL THE BRAND KIT
   - Move the brand assets into a sensible home, e.g.:
       src/styles/soti/soti-theme.css
       src/styles/soti/soti-components.css
       src/styles/soti/soti-fonts.css
       public/fonts/soti/*.woff2           (the 9 woff2 files)
       docs/brand/SOTI - Brand Pack (Standalone).html   (reference)
       docs/brand/SOTI_Brand_Handover.md
   - Fix the url() paths in soti-fonts.css to wherever the woff2 files actually
     live for this app's static-asset setup.
   - Switzer is NOT on Google Fonts — keep it self-hosted from the provided
     woff2s. JetBrains Mono may stay self-hosted or use the Google Fonts CDN.

3. WIRE THE TOKENS INTO THIS APP'S STYLING SYSTEM
   - The tokens are CSS custom properties scoped under [data-theme="soti"].
     Map them into whatever this app actually uses:
       * Tailwind  -> add the colours/fonts to tailwind.config (theme.extend),
                      reading from the CSS vars or duplicating the hex values.
       * MUI/Chakra/styled -> create a SOTI theme object from the same tokens.
       * CSS/SCSS  -> import the provided CSS files in the global entry.
   - Tokens (authoritative hex values):
       void #020407 · panel #06090C · panel-2 #0C1116 · panel-3 #141A21
       line #1F2934 · line-2 #2A3845
       text #E8F4FF · dim #5A6573 · dim-2 #3D4754
       signal(cyan) #5EDDFF · signal-2 #9CECFF · echo(mint) #6BFFB8 · warm #FF6B47
       on-signal #06090C
       display = Switzer (500–900) · mono = JetBrains Mono (300–700)

4. ACTIVATE THE THEME
   - Set data-theme="soti" on <html> (or the app root). Implement it as a theme
     so it can coexist with any existing theme; if SOTI is meant to be the app's
     only identity, make it the default theme but still via the theme mechanism.
   - Apply the signature SOTI surface to the app shell/background: the --void
     base + the dot-grid + the top-right cyan glow (see soti-theme.css body rule).

5. RESTYLE THROUGHOUT (this is the bulk of the work)
   - Replace hard-coded colours and font-families across the app with the tokens.
     Search the codebase for hex colours and font-family declarations and migrate
     them. Numbers, %s, ranks, labels, codes -> JetBrains Mono, tabular-nums.
     Headlines / KPI values / wordmark -> Switzer 800.
   - Adopt the SOTI conventions everywhere they apply:
       * Active / selected state  = cyan fill (--signal) with --on-signal ink.
       * Positive / growth        = mint (--echo).  Negative / decline = warm
         (--warm) ONLY. Don't introduce new accent hues.
       * Hard 1px borders (--line), square corners, no decorative shadows
         (except the deep "screen" panel shadow). "Infrastructure, not advertising."
       * The mint "ping" on live/fresh-data indicators.
   - Port the provided components (statusbar, cards, KPI cards, bar rows,
     segmented toggle, breadcrumb, ranked list, dashboard "screen", CTA, footer)
     from soti-components.css into this app's component library, translated to its
     component model rather than pasted as global CSS where that's the convention.
   - Build/keep the SOTI wordmark: "SOTI" in Switzer 800 + the mint ping, with
     ·Rx / ·OTC module suffixes in cyan italic.

6. QUALITY
   - Respect prefers-reduced-motion (the ping already guards on it).
   - Ensure contrast: --text on --void for primary content; --dim for secondary
     only. Add a visible cyan focus outline for keyboard nav.
   - Verify print/report views (the theme inverts to light + drops motion).
   - Run the app, fix visual regressions, and confirm the look matches the
     standalone brand-pack HTML (open it side by side).

7. WRAP UP
   - Summarise the files changed and how to toggle the theme.
   - Commit on a feature branch (e.g. feat/soti-brand) and open a PR.

Before large sweeping edits, show me the integration plan (where tokens go, how
the theme is activated, the list of components/screens to restyle) and proceed
once it looks right.
```

---

## Notes for you (not part of the prompt)

- If you prefer the agent to plan first, prepend: *"Start in plan mode."*
- If the app is a specific stack you already know (e.g. Next.js + Tailwind), say
  so in the prompt — it lets the agent skip discovery and go straight to the
  Tailwind config + globals.
- If SOTI should fully replace the old look (no dual-theme), tell it:
  *"Make SOTI the only theme; remove the previous palette/typography."*
