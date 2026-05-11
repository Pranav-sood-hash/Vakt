/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--primary-color-rgb, 45 79 214) / <alpha-value>)",
        secondary: "#7A86FF",
        warning: "#C9832A",
        bgLight: "#FAFAFA",
        bgDark: "#111111",
        sidebarLight: "#FFFFFF",
        sidebarDark: "#1A1A1A",
        cardDark: "#1E1E1E",
        textDark: "#EFEFEF",
        borderDark: "#2A2A2A"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
