/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        stage: {
          if: "#DBEAFE",
          ifDark: "#1E3A8A",
          id: "#E9D5FF",
          idDark: "#5B21B6",
          ex: "#FED7AA",
          exDark: "#9A3412",
          mem: "#BBF7D0",
          memDark: "#166534",
          wb: "#E5E7EB",
          wbDark: "#374151",
          stall: "#FECACA",
          stallDark: "#991B1B",
          flush: "#FCA5A5",
          flushDark: "#7F1D1D",
          forward: "#FDE68A",
          forwardDark: "#92400E",
        },
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
