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
          DEFAULT: "#0a0a0f",
          card: "#13131a",
          elevated: "#1a1a24",
          border: "#2a2a3a",
        },
        accent: {
          purple: "#8b5cf6",
          indigo: "#6366f1",
          blue: "#3b82f6",
        },
        sentiment: {
          positive: "#22c55e",
          neutral: "#6b7280",
          negative: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-record": "pulse-record 1s ease-in-out infinite",
        "slide-in": "slide-in 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "waveform": "waveform 0.6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2)",
          },
        },
        "pulse-record": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)",
            transform: "scale(1.05)",
          },
        },
        "slide-in": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "waveform": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
}
