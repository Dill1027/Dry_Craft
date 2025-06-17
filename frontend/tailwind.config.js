/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#667eea',
          DEFAULT: '#5a67d8',
          dark: '#4c51bf',
          '50': '#f5f7ff',
          '100': '#ecf0ff',
          '200': '#d9e1ff',
          '300': '#b8c7ff',
          '400': '#8da5ff', 
          '500': '#5a67d8', // Your existing primary color
          '600': '#4c51bf', // Your existing primary-dark
          '700': '#3c4295',
          '800': '#2d3270',
          '900': '#24295a',
        },
        secondary: {
          light: '#764ba2',
          DEFAULT: '#6b46c1',
          dark: '#553c9a',
          '50': '#f5f0ff',
          '100': '#ece3ff',
          '200': '#d8c6ff',
          '300': '#b799ff',
          '400': '#9c6dfc',
          '500': '#6b46c1', // Your existing secondary color
          '600': '#553c9a', // Your existing secondary-dark
          '700': '#452f7a',
          '800': '#342460',
          '900': '#291c4d',
        },
      },
      scale: {
        '98': '.98',
        '102': '1.02',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        celebration: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        celebration: 'celebration 0.5s ease-out forwards',
      },
    },
  },
  plugins: [
    // Safely try to load the @tailwindcss/forms plugin
    require('@tailwindcss/forms')
  ],
}
