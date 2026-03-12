/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '1.5': '1.5px',
        '3': '3px',
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}
