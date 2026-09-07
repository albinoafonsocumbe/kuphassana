/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          950: '#08080d',
          900: '#111118',
          800: '#1a1a2e',
          700: '#252538',
          gold: '#c8a45a',
          'gold-light': '#e2c07e',
        },
      },
    },
  },
  plugins: [],
}
