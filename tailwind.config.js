/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        "drift-a": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(60px, 40px)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-50px, 60px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "data-fall": {
          "0%": { transform: "translateY(-110%)" },
          "100%": { transform: "translateY(110vh)" },
        },
      },
      animation: {
        "drift-a": "drift-a 16s ease-in-out infinite",
        "drift-a-reverse": "drift-a 18s ease-in-out infinite reverse",
        "drift-b": "drift-b 20s ease-in-out infinite",
        "spin-slow": "spin-slow 6s linear infinite",
        "data-fall": "data-fall linear infinite",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
