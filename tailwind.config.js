/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        surface: "#111113",
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#06B6D4",
          foreground: "#FFFFFF",
        },
        success: "#22C55E",
        danger: "#EF4444",
        text: {
          DEFAULT: "#FFFFFF",
          muted: "#A1A1AA",
          subtle: "#71717A",
        },
        border: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)",
        "gradient-accent": "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
        "gradient-tri":
          "linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #06B6D4 100%)",
        "gradient-radial-glow":
          "radial-gradient(circle at center, rgba(124,58,237,0.25) 0%, rgba(9,9,11,0) 70%)",
        "grid-dots":
          "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "mesh-aurora":
          "radial-gradient(at 20% 30%, rgba(124,58,237,0.35) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(6,182,212,0.25) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(99,102,241,0.30) 0px, transparent 50%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
        glow: "0 0 40px rgba(124, 58, 237, 0.35)",
        "glow-accent": "0 0 40px rgba(6, 182, 212, 0.35)",
        "glow-soft": "0 0 80px rgba(124, 58, 237, 0.20)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        glass: "16px",
        "glass-lg": "24px",
      },
      keyframes: {
        "pulse-orb": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "33%": { transform: "translateY(-14px) translateX(8px)" },
          "66%": { transform: "translateY(8px) translateX(-6px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "75%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "grid-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 60px" },
        },
        "border-shine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-orb": "pulse-orb 2.2s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        shimmer: "shimmer 3s linear infinite",
        marquee: "marquee 40s linear infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "spin-reverse": "spin-reverse 24s linear infinite",
        "ping-soft": "ping-soft 2.4s cubic-bezier(0, 0, 0.2, 1) infinite",
        "grid-drift": "grid-drift 20s linear infinite",
        "border-shine": "border-shine 4s linear infinite",
      },
    },
  },
  plugins: [],
};
