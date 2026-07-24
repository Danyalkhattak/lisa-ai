// Central source of truth for design tokens referenced from JS
// (e.g. Framer Motion animations, SVG fills) so colors never drift
// out of sync with tailwind.config.js.

export const COLORS = {
  background: "#09090B",
  surface: "#111113",
  primary: "#7C3AED",
  secondary: "#6366F1",
  accent: "#06B6D4",
  success: "#22C55E",
  danger: "#EF4444",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  border: "rgba(255,255,255,0.08)",
};

export const FONTS = {
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Shared Framer Motion easing/duration presets so animation feel
// stays consistent across every feature module.
export const MOTION = {
  easeOut: [0.16, 1, 0.3, 1],
  durationFast: 0.2,
  durationBase: 0.35,
  durationSlow: 0.6,
  pageTransition: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export const APP_NAME = "Lisa AI";
export const APP_TAGLINE = "Your voice. Understood.";
