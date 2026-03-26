/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
      },
      colors: {
        aminach: {
          primary: '#1e3a5f',
          secondary: '#2d5a87',
          accent: '#3b82f6',
          light: '#f0f7ff',
          success: '#059669',
          warning: '#d97706',
          danger: '#dc2626',
        },
      },
    },
  },
  plugins: [],
}
