/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        space: { 950: '#04050d', 900: '#080a18', 800: '#0d1024', 700: '#151935', 600: '#1f2447', 500: '#2d3361' },
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: { glow: '0 0 28px -4px rgba(255,179,71,.55)', violet: '0 0 30px -6px rgba(139,92,246,.6)' },
    },
  },
  plugins: [],
};
