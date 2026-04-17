/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0c11',
        primary: {
          DEFAULT: '#6c63ff',
          light: '#8b85ff',
          dark: '#4a42cc',
        },
        accent: {
          green: '#00e5a0',
          blue: '#00b4f0',
          amber: '#f5a623',
          red: '#ff4757',
        },
        surface: {
          DEFAULT: '#111420',
          low: '#161925',
          card: '#1c2030',
          border: '#252a3d',
          hover: '#1e2538',
        },
        'on-surface': '#e2e8f0',
        'on-surface-muted': '#7c8db5',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.4s ease',
        'pulse-dot': 'pulseDot 2s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glassy': 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,229,160,0.06))',
      }
    },
  },
  plugins: [],
}
