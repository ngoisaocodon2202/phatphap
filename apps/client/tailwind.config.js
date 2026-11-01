/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        temple: {
          gold:   "#fbbf24",
          indigo: "#6366f1",
          smoke:  "rgba(255,255,255,0.08)",
        },
      },
    },
  },
  plugins: [],
};
