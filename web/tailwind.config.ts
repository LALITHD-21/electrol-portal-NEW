import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "'Cascadia Code'", "monospace"],
      },
      borderWidth: {
        3: "3px",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        flashUp: {
          "0%": { color: "#059669", textShadow: "0 0 12px rgba(16,185,129,0.45)" },
          "100%": { color: "inherit", textShadow: "none" },
        },
        flashDown: {
          "0%": { color: "#e11d48", textShadow: "0 0 12px rgba(244,63,94,0.4)" },
          "100%": { color: "inherit", textShadow: "none" },
        },
        ringPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.35)" },
          "100%": { boxShadow: "0 0 0 10px rgba(99,102,241,0)" },
        },
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s infinite",
        "flash-up": "flashUp 1.2s ease-out",
        "flash-down": "flashDown 1.2s ease-out",
        "ring-pulse": "ringPulse 1.2s ease-out",
        progress: "progress 1.2s ease-in-out infinite",
        "gradient-shift": "gradientShift 12s ease infinite",
      },
      zIndex: {
        content: "0",
        sticky: "20",
        bottomNav: "30",
        sheet: "40",
        modal: "50",
        toast: "60",
      },
      minHeight: {
        dvh: "100dvh",
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top, 0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-left": "env(safe-area-inset-left, 0px)",
        "safe-right": "env(safe-area-inset-right, 0px)",
        "bottom-nav": "calc(64px + env(safe-area-inset-bottom, 0px))",
      },
      boxShadow: {
        "2xs": "0 1px 1px 0 rgba(15, 23, 42, 0.04)",
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "soft-sm": "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.04)",
        "card-hover": "0 12px 28px -10px rgba(79, 70, 229, 0.14), 0 4px 10px -4px rgba(15, 23, 42, 0.06)",
        elevated: "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.05)",
        glow: "0 0 0 4px rgba(99, 102, 241, 0.12)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
