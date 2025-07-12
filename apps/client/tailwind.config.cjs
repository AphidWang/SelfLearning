/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translate(-50%, -90%)'
          },
          'to': {
            opacity: '1',
            transform: 'translate(-50%, -100%)'
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards'
      }
    }
  },
  plugins: [],
}
