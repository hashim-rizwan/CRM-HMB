/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        scanline: {
          '0%, 100%': { top: '0%', opacity: '0.9' },
          '50%': { top: '100%', opacity: '0.6' },
        },
      },
      animation: {
        scanline: 'scanline 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

