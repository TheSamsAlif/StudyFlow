module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep gorgeous dark palette
        bg: {
          DEFAULT: "#0B0F1A",
          card: "rgba(20, 25, 40, 0.6)",
          solid: "#141928",
          muted: "#1B2236",
        },
        ink: {
          DEFAULT: "#F1EBE0",
          muted: "#9CA3B5",
          dim: "#6B7280",
        },
        primary: {
          DEFAULT: "#E07A5F",
          hover: "#EB8B70",
          fg: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#81B29A",
          hover: "#94C0AB",
          fg: "#0B0F1A",
        },
        accent: {
          DEFAULT: "#F2CC8F",
          fg: "#1B2236",
        },
        outline: "rgba(255,255,255,0.08)",
        glow: "rgba(224, 122, 95, 0.4)",
      },
      fontFamily: {
        heading: ["'Hind Siliguri'", "system-ui", "sans-serif"],
        body: ["'Noto Sans Bengali'", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      borderRadius: { "4xl": "2rem" },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
