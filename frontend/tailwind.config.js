/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        minecraft: {
          brown: "#8B4513",
          darkBrown: "#5C3317",
          green: "#00AA00",
          darkGreen: "#007700",
          grass: "#7CBD6B",
          dirt: "#8B6F47",
          stone: "#7F7F7F",
        },
      },
      fontFamily: {
        minecraft: ['"Press Start 2P"', "cursive"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
