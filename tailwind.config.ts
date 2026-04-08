import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },

      colors: {
        // Refined gold palette (less saturated / more luxurious than amber)
        gold: {
          100: '#f5e8b8',
          200: '#ecd480',
          300: '#e0bc6a',
          400: '#d4a843',  // ← primary interaction colour
          500: '#be8f2e',
          600: '#a07830',
          700: '#7a5920',
        },
        // Semantic surface palette
        ink: {
          DEFAULT: '#09090f',
          50:  '#0e0e18',
          100: '#131320',
          200: '#18182a',
          300: '#1c1c2e',
          400: '#262638',
          500: '#303048',
        },
      },

      boxShadow: {
        'gold-sm': '0 0 12px -3px rgba(212,168,67,0.3)',
        'gold':    '0 0 24px -6px rgba(212,168,67,0.35)',
        'gold-lg': '0 0 48px -8px rgba(212,168,67,0.3)',
        'card':    '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px -4px rgba(0,0,0,0.5)',
        'modal':   '0 4px 6px -1px rgba(0,0,0,0.5), 0 24px 48px -12px rgba(0,0,0,0.6)',
      },

      animation: {
        'fade-in':   'fadeIn  0.45s ease-out both',
        'slide-up':  'slideUp 0.4s  cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':'slideDown 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':  'scaleIn 0.3s  cubic-bezier(0.16,1,0.3,1) both',
        'pulse-gold':'pulseGold 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGold: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(212,168,67,0.45)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(212,168,67,0)' },
        },
      },

      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #f0d080 0%, #d4a843 55%, #a07830 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [forms],
}

export default config
