# Lisa AI — Browser Voice Assistant

A premium, natural-language voice assistant that lives in your browser.

## Sections

| # | Section | Status |
|---|---|---|
| 1 | Project Foundation & Architecture | ✅ Complete |
| 2 | Landing Page (hero, features, how-it-works, showcase, stats, testimonials, pricing, FAQ, CTA, footer, animated background) | ✅ Complete |
| 3 | Dashboard Shell | ⏳ Pending |
| 4 | Voice Assistant Core (mic orb, listening/thinking/speaking/idle states, Web Speech API) | ⏳ Pending |
| 5 | Convex Backend (schema, auth sync, conversations/messages functions) | ⏳ Pending |
| 6 | Gemini AI Chat Integration | ⏳ Pending |
| 7 | Weather Feature (Open-Meteo) | ⏳ Pending |
| 8 | Email Feature (EmailJS) | ⏳ Pending |
| 9 | Conversation History (search, pin, rename, delete) | ⏳ Pending |
| 10 | Settings & Profile | ⏳ Pending |
| 11 | Error handling, empty states, accessibility pass | ⏳ Pending |
| 12 | Deployment (Vercel + Convex Cloud) | ⏳ Pending |

---

## Section 1 — Project Foundation & Architecture

| File | Location | Purpose |
|---|---|---|
| `package.json` | root | Strict tech-stack dependencies (React, Vite, Tailwind, Framer Motion, Clerk, Convex, Zod, React Hook Form) |
| `vite.config.js` | root | Build config + `@alias` path aliases matching the feature-based folder structure |
| `tailwind.config.js` | root | Design tokens: colors, fonts, glass/glow shadows, orb/float/gradient keyframes, plus new shimmer / marquee / spin-slow / ping-soft / grid-drift / border-shine animations added in Section 2 |
| `postcss.config.js` | root | Required by Tailwind |
| `index.html` | root | HTML shell, loads Space Grotesk / Inter / JetBrains Mono |
| `.env.example` | root | Template for every secret (Clerk, Convex, Gemini, EmailJS) — **never commit real keys** |
| `.gitignore` | root | Keeps `node_modules`, `dist`, `.env*`, `.convex` out of git |
| `jsconfig.json` | root | Editor intellisense for the `@component`-style import aliases |
| `src/index.css` | src | Tailwind layers + glassmorphism utilities (`.glass-panel`, `.btn-primary`, `.btn-secondary`, `.pill`, `.section-pad`, `.container-max`, `.text-gradient-tri`, `.gradient-border`, `.conic-glow`, `.bg-dotted-grid`, `.mask-fade-x`), focus-visible styles, reduced-motion support |
| `src/constants/theme.js` | src/constants | JS-side color/font/motion tokens (kept in sync with Tailwind config) |
| `src/constants/routes.js` | src/constants | Single source of truth for every route path |
| `src/lib/utils.js` | src/lib | `cn()` helper for safe Tailwind class merging |
| `src/providers/ClerkAuthProvider.jsx` | src/providers | Clerk provider themed to match the app |
| `src/providers/ConvexClientProvider.jsx` | src/providers | Convex client wired to Clerk auth |
| `src/providers/AppProviders.jsx` | src/providers | Single composition point for the provider tree |
| `src/routes/ProtectedRoute.jsx` | src/routes | Auth guard for `/dashboard/*` |
| `src/pages/*.jsx` | src/pages | Functional stubs for Sign In, Sign Up, Dashboard, 404 — real builds land in Sections 3+ |
| `src/components/feedback/PageLoadingSkeleton.jsx` | src/components | Loading state for lazy-loaded routes |
| `src/App.jsx` | src | Route table with lazy loading + animated page transitions |
| `src/main.jsx` | src | React entry point |

---

## Section 2 — Landing Page

A complete, production-ready marketing landing page built on top of Section 1's design tokens. Every section animates in on scroll, the layout is fully responsive, and `prefers-reduced-motion` is respected throughout.

### File map

| File | Purpose |
|---|---|
| `src/components/landing/AnimatedBackground.jsx` | Fixed ambient layer: 3 drifting mesh-blobs + dotted grid + top/bottom vignettes |
| `src/components/landing/VoiceOrb.jsx` | Multi-layer animated orb — conic glow halo, counter-rotating dashed rings, ping rings, gradient sphere, mic glyph, orbiting accent dot |
| `src/components/landing/HeroSection.jsx` | Eyebrow → headline → sub → dual CTAs → orb with floating capability chips → trust strip → scroll cue |
| `src/components/landing/TrustedBySection.jsx` | Seamless marquee of partner wordmarks with masked edges |
| `src/components/landing/FeaturesSection.jsx` | 4×2 grid of TiltCards with accent radial behind each icon |
| `src/components/landing/HowItWorksSection.jsx` | 3-step timeline with self-drawing gradient connector line |
| `src/components/landing/ShowcaseSection.jsx` | Mock browser window previewing a weather conversation + inline result card + equalizer bars |
| `src/components/landing/StatsSection.jsx` | Four count-up stat cards (animate from 0 when scrolled into view) |
| `src/components/landing/TestimonialsSection.jsx` | 3-column grid of glass quote cards with star ratings + tinted gradient avatars |
| `src/components/landing/PricingSection.jsx` | 3-tier pricing with the middle "Pro" tier highlighted via gradient border, glow, scale-up, and "Most popular" pill |
| `src/components/landing/FAQSection.jsx` | Single-open accordion with smooth height animation |
| `src/components/landing/CTASection.jsx` | Final gradient CTA panel with rotating conic glow |
| `src/components/layout/LandingNavbar.jsx` | Sticky glass nav — transparent at top, frosted when scrolled; animated underline links; magnetic CTAs; full-screen mobile drawer |
| `src/components/layout/LandingFooter.jsx` | 4-column sitemap + brand block + social icons + giant watermark |
| `src/components/ui/MagneticButton.jsx` | Reusable button that follows the cursor on hover; primary / secondary / ghost variants; renders as `<a>` or `<button>` |
| `src/components/ui/SectionHeading.jsx` | Consistent eyebrow / title (with gradient highlight) / subtitle block, animates in on view |
| `src/components/ui/TiltCard.jsx` | Glass card that tilts toward the cursor in 3D + reveals a specular highlight on hover |
| `src/hooks/useCountUp.js` | Animates a number from 0 → target with easeOutCubic when the element enters view |
| `src/hooks/useTilt.js` | Lightweight pointer-based 3D tilt math used by TiltCard |
| `src/pages/LandingPage.jsx` | Composes all sections in narrative order |

### Design improvements made on top of Section 1's tokens

- **New keyframes**: `shimmer`, `marquee`, `spin-slow`, `spin-reverse`, `ping-soft`, `grid-drift`, `border-shine`, `float-slow`
- **New utilities**: `.text-gradient-tri` (animated tri-color gradient text), `.gradient-border` (animated conic border wrapper), `.conic-glow`, `.bg-dotted-grid`, `.bg-dotted-grid-fine`, `.mask-fade-x`, `.mask-fade-b`, `.perspective-1000`, `.preserve-3d`
- **New component classes**: `.btn-primary`, `.btn-secondary`, `.pill`, `.section-pad`, `.container-max`
- **New shadow**: `glow-soft` for soft ambient glow on primary CTAs
- **New backdrop**: `glass-lg` for stronger frosted-glass on nav and CTA
- **Color tokens**: added `text.subtle` (#71717A) for tertiary text, used heavily in eyebrow/footer labels
- **Background image**: `gradient-tri` (purple → indigo → cyan) for gradient text + pricing highlight border

### Animation principles applied

1. **Stagger on entry** — every section uses `whileInView` with small per-item delays so content cascades rather than pops.
2. **Calm continuous motion** — orb pulses, blobs drift, marquee scrolls. None of it ever stops the eye from reading the content.
3. **Tactile hover** — magnetic buttons + 3D tilt cards give every interactive surface a subtle "yes, I'm alive" feel.
4. **Reduced-motion respect** — `@media (prefers-reduced-motion: reduce)` flattens every animation to ~0ms.
5. **No layout thrash** — all continuous animations are GPU-friendly (transform / opacity only).

---

## Setup

> Section 2 is purely presentational and works without any backend. To run
> the full app (Sections 3+), Clerk + Convex keys are required.

```bash
npm install
cp .env.example .env.local   # fill in Clerk/Convex/Gemini/EmailJS keys
npm run dev
```

To preview only the landing page without env vars, temporarily comment
out the `ClerkAuthProvider` and `ConvexClientProvider` wrappers in
`src/providers/AppProviders.jsx` — the landing page itself uses neither.

## Tech stack

- React 18 + Vite 5
- Tailwind CSS 3 (custom dark theme, glassmorphism, animated gradients)
- Framer Motion (page transitions, scroll-reveal, magnetic buttons, count-ups)
- lucide-react (icons)
- Clerk (auth) + Convex (DB) — wired in Section 1, used from Section 5 onward
