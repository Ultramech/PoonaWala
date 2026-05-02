/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4A017',
          600: '#b8860b',
          700: '#92661a',
          800: '#713f12',
          900: '#422006',
          950: '#1a0c00',
        },
        surface: {
          0:   '#0A0A0A',
          1:   '#111111',
          2:   '#1A1A1A',
          3:   '#242424',
          4:   '#2E2E2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':   'slideDown 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s ease-in-out infinite',
        'count-up':     'countUp 1s cubic-bezier(0.16,1,0.3,1)',
        'band-draw':    'bandDraw 0.8s cubic-bezier(0.16,1,0.3,1) both',
        'glow':         'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:  { from: { opacity: '0', transform: 'translateY(-16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGold:  { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(212,160,23,0)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glow:       { from: { textShadow: '0 0 4px rgba(212,160,23,0.5)' }, to: { textShadow: '0 0 16px rgba(212,160,23,0.9), 0 0 32px rgba(212,160,23,0.4)' } },
        bandDraw:   { from: { transform: 'scaleX(0)', transformOrigin: 'left' }, to: { transform: 'scaleX(1)', transformOrigin: 'left' } },
      },
      backgroundImage: {
        'gold-gradient':   'linear-gradient(135deg, #D4A017 0%, #F5C842 50%, #D4A017 100%)',
        'dark-gradient':   'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'shimmer-gradient':'linear-gradient(90deg, transparent 0%, rgba(212,160,23,0.15) 50%, transparent 100%)',
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'gold-sm':  '0 0 0 1px rgba(212,160,23,0.3)',
        'gold':     '0 0 0 1px rgba(212,160,23,0.5), 0 4px 24px rgba(212,160,23,0.15)',
        'gold-lg':  '0 0 0 1px rgba(212,160,23,0.6), 0 8px 40px rgba(212,160,23,0.25)',
        'card':     '0 1px 3px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
        'card-hover':'0 2px 8px rgba(0,0,0,0.6), 0 16px 40px rgba(0,0,0,0.4)',
        'glow-red': '0 0 0 1px rgba(239,68,68,0.4), 0 4px 24px rgba(239,68,68,0.15)',
        'glow-green':'0 0 0 1px rgba(34,197,94,0.4), 0 4px 24px rgba(34,197,94,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
