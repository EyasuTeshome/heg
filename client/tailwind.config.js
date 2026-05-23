/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F1729',
          800: '#162033',
          700: '#1E2D47',
          600: '#243558',
        },
        brand: {
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        }
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        inter: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        'mobile': '480px',
      }
    },
  },
  plugins: [],
}
