import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E1E2E',
        },
        bg: {
          DEFAULT: '#F4F4F6',
          dark: '#0A0A0F',
        },
        rating: {
          again: '#EF4444',
          hard:  '#F97316',
          good:  '#3B82F6',
          easy:  '#22C55E',
        }
      },
      borderRadius: {
        'xl':  '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06), 0  0 1px rgba(0,0,0,0.04)',
        'card-dark': '0 0 0 1px rgba(255,255,255,0.06)',
        'modal': '0 24px 48px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"PingFang SC"', '"HarmonyOS Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.28s cubic-bezier(0.4,0,0.2,1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.4,0,0.2,1)',
        'confetti':   'confetti 1.2s ease-out forwards',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:  { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        confetti: { '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
      }
    },
  },
  plugins: [],
} satisfies Config
