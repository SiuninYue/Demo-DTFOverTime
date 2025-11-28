/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6366f1',
          dark: '#4338ca',
        },
      },
    },
  },
  plugins: [],
}
