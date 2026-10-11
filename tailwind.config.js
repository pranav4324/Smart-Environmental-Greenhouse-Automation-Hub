/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        neon: {
          green: '#00ff88',
          teal:  '#00d4aa',
          blue:  '#0099ff',
        },
        dark: {
          void:    '#020c07',
          deep:    '#040f0a',
          surface: '#071a0f',
          card:    '#0a1c12',
        },
        accent: {
          teal:    '#0d9488',
          emerald: '#10b981',
          amber:   '#f59e0b',
          rose:    '#f43f5e',
          sky:     '#0284c7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'deep-glow': `
          radial-gradient(ellipse 60% 40% at 15% 20%, rgba(0,255,136,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 40% 60% at 85% 80%, rgba(0,153,255,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,212,170,0.04) 0%, transparent 70%),
          linear-gradient(180deg, #020c07 0%, #020c07 100%)
        `,
        'grid-pattern': `
          linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-48': '48px 48px',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'float-slow': 'float-orb-1 20s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0,255,136,0.3), 0 0 40px rgba(0,255,136,0.1)',
        'neon-sm':    '0 0 8px rgba(0,255,136,0.4)',
        'glass':      '0 4px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(0,255,136,0.06) inset',
      },
      borderColor: {
        'glow-green': 'rgba(0,255,136,0.2)',
        'glow-subtle': 'rgba(0,255,136,0.08)',
      },
    },
  },
  plugins: [],
}
