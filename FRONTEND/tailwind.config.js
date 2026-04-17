/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111318',
        primary: {
          DEFAULT: '#b7c4ff',
          container: '#001f70',
        },
        secondary: {
          DEFAULT: '#f4fff5',
          container: '#00ffab',
          fixed: '#4dffb2',
        },
        tertiary: {
          DEFAULT: '#c6c6c6',
        },
        surface: {
          DEFAULT: '#111318',
          lowest: '#0c0e12',
          low: '#1a1c20',
          container: '#1e2024',
          highest: '#333539',
          bright: '#37393e',
        },
        'on-primary': '#002682',
        'on-surface': '#e2e2e8',
        'outline-variant': '#444650',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { boxShadow: '0 0 0 0 rgba(77, 255, 178, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(77, 255, 178, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(77, 255, 178, 0)' },
        }
      }
    },
  },
  plugins: [],
}
