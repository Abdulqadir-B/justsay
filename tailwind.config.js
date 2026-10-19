/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#09090b",
          card: "#121215",
          elevated: "#18181b",
          border: "#27272a",
          "border-subtle": "#1f1f23",
          hover: "#1f1f23",
        },
        accent: {
          // Subtle, context-focused monochrome with subtle utility colors
          primary: "#fafafa",
          "primary-hover": "#ffffff",
          muted: "#71717a",
          // Aliases to gracefully transition away from legacy purple/indigo
          purple: "#fafafa",
          indigo: "#e4e4e7",
          blue: "#a1a1aa",
        },
        sentiment: {
          positive: "#10b981",
          neutral: "#a1a1aa",
          negative: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "pulse-record": "pulse-record 1.5s ease-in-out infinite",
        "slide-in": "slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "waveform": "waveform 0.6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "pulse-record": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.02)" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "waveform": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
}
