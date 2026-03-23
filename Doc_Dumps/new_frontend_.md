# 🎨 GUIDE Frontend — Red Noir Design System Adoption Plan

> **Reference:** Superdesign AI landing page (red noir style)  
> **Goal:** Adopt the reference's dark-premium visual language across every GUIDE page  
> **Rule:** No logic changes — styling, layout, and visual polish only

---

## 1. Design Tokens — The Foundation

Extract a unified set of tokens from the reference and apply project-wide.

### 1.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-deepblack` | `#000000` | Page & modal backgrounds |
| `--bg-dark` | `#0d1117` | Card interiors, editor area |
| `--bg-card` | `#161b22` | Elevated surfaces (nav, cards) |
| `--bg-surface` | `rgba(255,255,255,0.05)` | Glassmorphic panels, inputs |
| `--border-subtle` | `rgba(255,255,255,0.10)` | Card borders, dividers |
| `--border-hover` | `rgba(255,255,255,0.20)` | Hover emphasis borders |
| `--accent-red` | `#ef233c` | Primary CTA, active states, highlights |
| `--accent-red-glow` | `rgba(239,35,60,0.5)` | Button glows, shadows |
| `--accent-red-soft` | `rgba(239,35,60,0.1)` | Background tints, badges |
| `--text-primary` | `#ffffff` | Headings, primary content |
| `--text-secondary` | `#e6edf3` | Body text |
| `--text-muted` | `#8b949e` | Labels, captions, timestamps |
| `--text-dim` | `#484f58` | Hints, disabled content |
| `--success` | `#3fb950` | Pass states, online indicators |
| `--warning` | `#d29922` | Caution states |
| `--error` | `#f85149` | Failures, destructive actions |

### 1.2 Typography

| Token | Font | Usage |
|---|---|---|
| `--font-display` | `'Manrope', sans-serif` | All headings (h1–h3), logo, hero text |
| `--font-body` | `'Inter', sans-serif` | Body text, labels, buttons, inputs |

**Sizes (reference mapping):**

| Element | Size | Weight | Letter-Spacing |
|---|---|---|---|
| Hero heading | `clamp(3rem, 8vw, 6rem)` | 600–700 | `-0.04em` (tight) |
| Section heading | `clamp(1.75rem, 4vw, 3rem)` | 600 | `-0.02em` |
| Card title | `1.25rem` – `1.5rem` | 600 | normal |
| Body | `0.875rem` – `1rem` | 400 | normal |
| Caption / badge | `0.625rem – 0.75rem` | 600–700 | `0.05em` (wide) |
| Button | `0.75rem` – `0.875rem` | 700 | `0.08em` (uppercase) |

### 1.3 Spacing & Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Inputs, small buttons |
| `--radius-md` | `12px` | Cards, panels |
| `--radius-lg` | `16px` | Modals, hero cards |
| `--radius-full` | `9999px` | Pill buttons, badges, navbar |
| `--shadow-glow` | `0 0 30px rgba(239,35,60,0.1)` | Highlighted card shadow |
| `--shadow-deep` | `0 8px 32px rgba(0,0,0,0.5)` | Floating elements |

---

## 2. Global Stylesheet Overhaul

### 2.1 File: `index.css`  — Complete Rebuild

**Current problems:** Triple `#root` conflicts, Tailwind import, light-mode media query, system font stack.

**Changes:**

```css
/* ── Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@200;400;600;700;800&display=swap');

/* ── Tailwind (keep) ── */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── CSS Variables ── */
:root {
  --bg-deepblack: #000000;
  --bg-dark: #0d1117;
  --bg-card: #161b22;
  --bg-surface: rgba(255,255,255,0.05);
  --border-subtle: rgba(255,255,255,0.10);
  --border-hover: rgba(255,255,255,0.20);
  --accent-red: #ef233c;
  --accent-red-glow: rgba(239,35,60,0.5);
  --accent-red-soft: rgba(239,35,60,0.1);
  --text-primary: #ffffff;
  --text-secondary: #e6edf3;
  --text-muted: #8b949e;
  --font-display: 'Manrope', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}

/* ── Base Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  background: var(--bg-deepblack);
  color: var(--text-secondary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

::selection {
  background: var(--accent-red);
  color: white;
}
```

> **DELETE** the `@media (prefers-color-scheme: light)` block entirely.

### 2.2 File: `App.css` — Strip to Bare Minimum

**Delete** all leftover Vite styles (`.logo`, `.card`, `.read-the-docs`, `@keyframes logo-spin`).  
**Delete** the duplicate `#root` styling.  
Keep only if any app-level transition styles are needed; otherwise make this file empty.

---

## 3. Shared Components to Create

### 3.1 `components/StarfieldBackground.jsx` [NEW]

Replaces the existing `Particles.jsx` on auth pages and adds the reference's star-field + gradient orb to **all** pages.

**Visual elements from reference:**
- Gradient base: `from-[#1a0505] to-black` (dark red tint at top)
- Two layers of small white star dots (`box-shadow` sprites) animating upward
- Central radial red glow orb (`blur-[120px]`, very subtle `red-600/5`)
- Faint grid overlay with radial mask

**Implementation approach:** A reusable React component that renders a fixed-position `div` with CSS-only animations (no canvas, no JS animation loop). This replaces the CPU-heavy Canvas-based `Particles.jsx`.

### 3.2 `components/ShinyButton.jsx` [NEW]

The reference's "shiny CTA" button with a conic-gradient spinning border.

**CSS properties:**
- `@property --gradient-angle` for animating the conic gradient
- `background: linear-gradient(#000, #000) padding-box, conic-gradient(...) border-box`
- `border: 2px solid transparent`
- Dotted noise overlay via `::before` pseudo-element
- `border-radius: 9999px` (pill shape)

**Variants:**
- `primary` — spinning red conic border (main CTA)
- `secondary` — static `bg-zinc-900 border-zinc-800` (like "View on GitHub")
- `ghost` — transparent with `border-white/10` hover glow

### 3.3 `components/GlassNav.jsx` [NEW]

A glassmorphic floating navbar that replaces the current page-specific headers.

**Properties from reference:**
- `position: fixed; top: 0; width: 100%; z-index: 50; padding-top: 1.5rem`
- Inner pill: `bg-black/60 backdrop-blur-xl border border-white/10 rounded-full`
- Logo: red rotated square `w-5 h-5 bg-[#ef233c] rounded-sm rotate-45`
- Gradient blur band above: `backdrop-filter: blur(8px)` with mask fade

**Use on:** Dashboard, HiringManagerDashboard, ResultsDashboard (the authenticated pages).  
Auth pages (Signin/Signup) do NOT need a navbar.

### 3.4 `components/GlassCard.jsx` [NEW]

Reusable card component matching the reference's bento-grid cards.

**Properties:**
- `border: 1px solid var(--border-subtle)`
- `background: linear-gradient(to bottom, rgba(25,25,35,0.5), black)` or `var(--bg-card)`
- `backdrop-filter: blur(12px)`
- `border-radius: var(--radius-md)` (12px)
- On hover: `border-color: var(--border-hover)`, `translateY(-2px)`, subtle red radial glow overlay
- `overflow: hidden` to clip hover effects

---

## 4. Page-by-Page Adoption Plan

### 4.1 Signin (`Signin.jsx` + `Signin.css` [NEW])

**Current:** All inline styles, generic form, `Particles` canvas background, `ElectricBorder` wrapper.

**Adoption:**

| Area | Current | New (Red Noir) |
|---|---|---|
| Background | Canvas Particles (200 particles) | `StarfieldBackground` (CSS-only) |
| Form wrapper | `ElectricBorder` canvas animation | `GlassCard` with subtle red border glow |
| Heading | `<h2>Signin</h2>` plain white | Manrope, gradient text `from-white to-white/40`, larger size |
| Inputs | Inline `border: 1px solid #ccc` | `bg-white/5 border border-white/10 rounded-full`, focus: `border-[#ef233c]` |
| Submit btn | White bg, black text | `ShinyButton primary` — spinning red conic border, dark bg, white text |
| Nav link | `<p>` tag with `onClick` | Proper `<button>` styled as text link with red hover |
| Error msgs | `alert()` | Inline error banner below form (red tint bg, `border-red/30`) |
| Layout | `position: fixed, height: 100vh` | Flexbox centering with `min-height: 100vh` as a normal page |

**New file: `Signin.css`** — move all styles out of inline JSX into dedicated CSS using the design tokens.

### 4.2 Signup (`Signup.jsx` + `Signup.css` [NEW])

Mirror `Signin` adoption exactly, plus:
- Add "Confirm Password" field
- Add password strength indicator (subtle bar under password input using `--accent-red`, `--warning`, `--success`)

### 4.3 Dashboard (`Dashboard.jsx` + `Dashboard.css` [NEW])

**Current:** All inline styles, minimal layout, just 3 buttons stacked.

**Adoption:**

| Area | Current | New (Red Noir) |
|---|---|---|
| Background | Flat `#0d1117` | `StarfieldBackground` + grid overlay |
| Navbar | None | `GlassNav` with logo, user email, logout |
| Page title | Blue-purple gradient text | Manrope, `from-white to-white/40` gradient, large |
| Subtitle | Plain gray | `text-muted` badge pill: `bg-white/5 border-white/10 rounded-full` |
| Action cards | Flat buttons in a row | Bento-grid `GlassCard` layout (2–3 cards) |
| Card: Start Session | Green gradient button | `GlassCard` with red accent icon, Manrope title, ShinyButton CTA |
| Card: View Results | Blue-purple gradient button | `GlassCard` with blue accent icon, ghost button |
| Card: Manage Sessions | (not shown) | `GlassCard` linking to HiringManager dashboard |
| Logout | Red-tinted button | Move to `GlassNav` as a nav item |

### 4.4 GuidePage (`GuidePage.jsx` + `GuidePage.css`)

**Current:** Already has dark theme with three-panel layout. Most polished page.

**Adoption (lighter touch, preserve layout):**

| Area | Current | New (Red Noir) |
|---|---|---|
| Font | System Segoe UI | `var(--font-body)` for text, `var(--font-display)` for titles |
| Top bar | `bg: #12141a, border-bottom` | Glassmorphic: `bg-black/60 backdrop-blur-xl border-white/10` |
| Panel borders | `#2a2a3e` solid borders | `var(--border-subtle)` with hover → `var(--border-hover)` |
| Buttons | Custom green/blue gradients | `ShinyButton primary` for Submit, `ghost` for panel toggles |
| Timer | Badge with blue tint | Badge with red accent when < 5min, green when plenty |
| `#root` override | Remove the `#root` styles from GuidePage.css entirely |
| Animations | Existing `fadeIn` | Keep but add namespace prefix: `guide-fadeIn` to avoid conflicts |
| Color accents | Mixed blue/green/purple | Standardize: `--accent-red` for primary actions, keep green only for success |

### 4.5 CandidateOnboarding (`CandidateOnboarding.jsx` + `.css`)

**Adoption:**

| Area | Current | New (Red Noir) |
|---|---|---|
| Background | `#0a0e17` dark blue | `StarfieldBackground` with red glow orb |
| Welcome card | Dark card, green border | `GlassCard`, red accent border, Manrope headings |
| Task list | Green checkmarks, dark bg | Red checkmarks (`--accent-red`), `GlassCard` container |
| Input | Green-focused dark input | `bg-white/5 border-white/10`, focus: `border-[#ef233c]` |
| Start btn | Green gradient | `ShinyButton primary` with spinning red border |
| Spinner | Custom `@keyframes spin` | Namespace to `onboarding-spin` to avoid conflicts |
| Tips section | Bordered box with blue tint | `GlassCard` with `var(--border-subtle)`, muted text |

### 4.6 HiringManagerDashboard (`HiringManagerDashboard.jsx` + `.css`)

**Adoption:**

| Area | Current | New (Red Noir) |
|---|---|---|
| Background | `#0d1117` with padding | `StarfieldBackground` base |
| Header | Gradient `#161b22` → `#1c2333` | `GlassNav` with logo + "Create Session" pill button |
| Page title | Blue-purple gradient text | Manrope, `from-white to-white/40` |
| Create btn | Green gradient | `ShinyButton primary` in the nav |
| Session cards | `#161b22` bg, `#30363d` border | `GlassCard` with hover red glow, `backdrop-blur` |
| Status badges | Colored bg+border per status | Keep palette but use `rounded-full` pill shape |
| Modal | `#161b22` bg, slide-up animation | Glassmorphic modal: `bg-black/60 backdrop-blur-xl`, red-accented border |
| Table | — | If data grows, use reference-style ranking table from ResultsDashboard |
| Alert() calls | 5 different `alert()` calls | Replace with toast/snackbar component (red-tinted) |

### 4.7 ResultsDashboard (`ResultsDashboard.jsx` + `.css`)

**Adoption (already closest to the target):**

| Area | Current | New (Red Noir) |
|---|---|---|
| Font | System Segoe UI | `var(--font-display)` for headings, `var(--font-body)` for data |
| Header | Sticky gradient header | `GlassNav` style: `bg-black/60 backdrop-blur-xl rounded-full` |
| Stat cards | `backdrop-filter: blur(12px)` ✅ | Keep, but change accent gradient to red: `from-[#ef233c] to-[#a371f7]` |
| Pillar cards | Blue/purple/green/orange/red | Keep individual pillar colors but use `GlassCard` base |
| Score colors | Green ≥80, orange ≥60, red <60 | Keep this palette (functional, not decorative) |
| Rankings table | Existing dark table | Add subtle row hover glow (red tint) |
| Thank You page | Inline styles | Style as hero section with Manrope heading + `GlassCard` |

---

## 5. Animation System

### 5.1 Shared Animations (define in `index.css`)

```css
/* ── Namespace all shared animations ── */
@keyframes noir-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes noir-border-spin {
  from { --gradient-angle: 0deg; }
  to   { --gradient-angle: 360deg; }
}

@keyframes noir-star-drift {
  from { transform: translateY(0); }
  to   { transform: translateY(-2000px); }
}

@keyframes noir-spin {
  to { transform: rotate(360deg); }
}

@keyframes noir-ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
```

### 5.2 Remove Duplicate Animations

Delete the conflicting `@keyframes fadeIn` and `@keyframes spin` from:
- `GuidePage.css`
- `CandidateOnboarding.css`
- `HiringManagerDashboard.css`
- `ResultsDashboard.css`

Replace all usages with the namespaced `noir-*` versions.

---

## 6. Responsive Strategy

The reference uses `max-w-5xl` (1024px) for navbar and `max-w-7xl` (1280px) for content.

### Breakpoints

| Breakpoint | Width | Adjustments |
|---|---|---|
| Mobile | < 640px | Single column, stacked cards, hamburger nav |
| Tablet | 640–1024px | 2-column grids, collapsible side panels |
| Desktop | > 1024px | Full layout, 3-panel GuidePage, 4-col bento grid |

### Key Responsive Rules

1. **GuidePage** — Add `@media (max-width: 768px)` to stack panels vertically
2. **Dashboard/HiringManager** — Cards use `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`
3. **ResultsDashboard** — Pillar cards wrap with `flex-wrap: wrap; min-width: 160px`
4. **Auth pages** — Form max-width: `400px`, centered
5. **Navbar** — Below `md` (768px): hide links, show hamburger icon

---

## 7. File-Level Change Summary

| Action | File | Description |
|---|---|---|
| **REWRITE** | `index.css` | New global tokens, fonts, reset (Section 2.1) |
| **STRIP** | `App.css` | Remove all Vite leftovers and `#root` rules |
| **CREATE** | `Signin.css` | Dedicated styles for Signin (replace inline) |
| **CREATE** | `Signup.css` | Dedicated styles for Signup (replace inline) |
| **CREATE** | `Dashboard.css` | Dedicated styles for Dashboard (replace inline) |
| **MODIFY** | `GuidePage.css` | Remove `#root`, namespace animations, swap fonts/colors |
| **MODIFY** | `CandidateOnboarding.css` | Adopt tokens, namespace animations |
| **MODIFY** | `HiringManagerDashboard.css` | Adopt tokens, glass cards, namespace animations |
| **MODIFY** | `ResultsDashboard.css` | Adopt tokens, swap fonts, namespace animations |
| **MODIFY** | `PillarDetailModal.css` | Adopt tokens, glass styling |
| **CREATE** | `components/StarfieldBackground.jsx` | CSS-only star background |
| **CREATE** | `components/StarfieldBackground.css` | Stars + orb + grid styles |
| **CREATE** | `components/ShinyButton.jsx` | Spinning conic-gradient pill button |
| **CREATE** | `components/ShinyButton.css` | Button animation & variant styles |
| **CREATE** | `components/GlassNav.jsx` | Glassmorphic floating navbar |
| **CREATE** | `components/GlassNav.css` | Navbar styles + blur band |
| **CREATE** | `components/GlassCard.jsx` | Reusable glass card wrapper |
| **CREATE** | `components/GlassCard.css` | Card hover, glow, border styles |
| **MODIFY** | `Signin.jsx` | Remove inline styles, use new components |
| **MODIFY** | `Signup.jsx` | Remove inline styles, use new components |
| **MODIFY** | `Dashboard.jsx` | Remove inline styles, add bento-grid layout |
| **MODIFY** | `GuidePage.jsx` | Swap buttons to `ShinyButton`, minor class changes |
| **MODIFY** | `CandidateOnboarding.jsx` | Swap to `StarfieldBackground`, glass cards |
| **MODIFY** | `HiringManagerDashboard.jsx` | Add GlassNav, glass cards, remove alerts |
| **MODIFY** | `ResultsDashboard.jsx` | Swap header to GlassNav style, font changes |

---

## 8. Migration Order

Execute in this order to avoid breaking intermediate states:

```
Phase 1 — Foundation (no visual breakage)
  ├── 1a. Rewrite index.css (tokens + fonts + reset)
  ├── 1b. Strip App.css
  └── 1c. Add shared animations to index.css

Phase 2 — Shared Components
  ├── 2a. Create StarfieldBackground
  ├── 2b. Create ShinyButton
  ├── 2c. Create GlassCard
  └── 2d. Create GlassNav

Phase 3 — Auth Pages (isolated, low risk)
  ├── 3a. Restyle Signin (+ create Signin.css)
  └── 3b. Restyle Signup (+ create Signup.css)

Phase 4 — Dashboard Pages
  ├── 4a. Restyle Dashboard (+ create Dashboard.css)
  ├── 4b. Restyle HiringManagerDashboard
  └── 4c. Restyle CandidateOnboarding

Phase 5 — Core Experience
  ├── 5a. Restyle GuidePage (remove #root override, adopt tokens)
  └── 5b. Restyle ResultsDashboard

Phase 6 — Polish & Responsive
  ├── 6a. Add responsive breakpoints to all pages
  ├── 6b. Cross-browser testing (Chrome, Firefox, Edge)
  └── 6c. Performance audit (remove Particles.jsx if unused)
```

---

## 9. Visual Reference Key-to-GUIDE Mapping

| Reference Element | GUIDE Equivalent |
|---|---|
| Hero section with huge gradient text | Dashboard welcome area |
| Shiny CTA "Start Creating →" | "Start GUIDE Session" button |
| Glassmorphic navbar with logo | Authenticated page navigation |
| Bento grid feature cards | Dashboard action cards, HiringManager session cards |
| Star-field background | All full-page backgrounds (auth, dashboard, onboarding) |
| `#ef233c` red accent throughout | Primary CTA, active states, interview timer warnings |
| Testimonial red banner | Could adapt for Results "Congratulations" banner |
| Pricing cards with highlighted "Pro" | Not needed — skip this pattern |
| Footer with huge text stroke | Not needed — GUIDE has no public landing page footer |

---

## 10. What NOT to Change

- **GuidePage three-panel layout structure** — keep the `grid-template-columns: 280px 1fr 350px`
- **Monaco Editor theme** — keep `vs-dark` (already fits)
- **ResultsDashboard data visualization** — keep `ScoreRadarChart`, `ScoreTrendChart` colors
- **Functional colors** — green for pass, red for fail, orange for warning (these are data colors, not brand colors)
- **Backend code** — zero changes
- **Routing structure** — zero changes
- **Component logic** — zero changes (style only)

---

## ✅ Implementation Changelog (2026-03-21)

> All phases executed. Build passes (165 modules, 0 errors). 32 files modified/created.

### Phase 1 — Foundation
| File | Action |
|------|--------|
| `src/index.css` | Rewritten — tokens, fonts (Inter+Manrope), reset, scrollbar, `noir-*` animations |
| `src/App.css` | Stripped — globals centralized in index.css |

### Phase 2 — Shared Components (all NEW)
| Component | Files |
|-----------|-------|
| StarfieldBackground | `.jsx` + `.css` — CSS-only animated stars, replaces Canvas Particles |
| ShinyButton | `.jsx` + `.css` — pill button, 3 variants, conic-gradient border |
| GlassCard | `.jsx` + `.css` — glassmorphic card, hover red glow |
| GlassNav | `.jsx` + `.css` — floating pill navbar, backdrop blur |
| Toast | `.jsx` + `.css` — notification component, replaces `alert()` |

### Phase 3 — Auth Pages
| File | Changes |
|------|---------|
| `Signin.jsx` + `.css` | StarfieldBackground + GlassCard + ShinyButton, gradient heading, pill inputs |
| `Signup.jsx` + `.css` | Same as Signin + password strength bar |

### Phase 4 — Dashboard Pages
| File | Changes |
|------|---------|
| `Dashboard.jsx` + `.css` | GlassNav, bento grid GlassCards, hero section |
| `HiringManagerDashboard.jsx` + `.css` | GlassNav, Toast (replaces inline notifications), glass session cards |
| `CandidateOnboarding.jsx` + `.css` | StarfieldBackground across all states, glass cards, red accents |

### Phase 5 — Core Experience
| File | Changes |
|------|---------|
| `GuidePage.css` | Removed `#root` override, glassmorphic topbar, tokens throughout |
| `ResultsDashboard.css` | Glassmorphic header, token swap, red accent rankings |

### Phase 6 — Component Cleanup
| File | Changes |
|------|---------|
| `ChatPanel.jsx` + `.css` (NEW) | Removed all inline styles → CSS classes |
| `ErrorBoundary.jsx` + `.css` (NEW) | Removed 30+ inline style objects → glassmorphic error card |
| `TokenBudgetIndicator.css` | Token swap for all hardcoded colors |
| `PillarDetailModal.css` | Token swap, glassmorphic modal, red hovers |
| `TestPanel.jsx` | Inline style → `.pyodide-error-hint` class |
| `ScoreBreakdown.jsx` | Inline style → `.score-breakdown-empty-text` class |

### Bug Fixes (pre-existing)
| File | Fix |
|------|-----|
| `ChatPanel.jsx` | Removed duplicate `title` attribute |
| `api.jsx` | Added missing `export default api` |

### Intentionally Unchanged
- **CodeEditor.jsx** — Monaco `vs-dark` theme fits the design
- **TaskSidebar.jsx** — Already uses GuidePage.css classes
- **Chart components** (ScoreRadarChart, ScoreTrendChart, SessionRankingTable) — dynamic inline styles for data visualization (correct pattern)

### Build Output
```
✓ 165 modules · 1.99s · CSS 70.84kB (gzip 11.68kB) · JS 407.75kB (gzip 125.97kB)
```
