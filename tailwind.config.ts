import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色：琥珀橙
        primary: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        // 深色背景系统
        ink: {
          950: '#0D1117',  // 最深背景
          900: '#161B22',  // 卡片背景
          800: '#21262D',  // 悬浮层
          700: '#30363D',  // 边框
          500: '#6E7681',  // 次要文字
          300: '#8B949E',  // 更弱文字
        },
        // 浅色背景系统
        paper: {
          50:  '#FAFAF8',
          100: '#F5F4EF',
          200: '#ECEAE3',
          300: '#D8D5CC',
          500: '#9B9890',
          700: '#5C5A54',
          900: '#1C1B18',
        },
        rating: {
          again: '#F87171',
          hard:  '#FB923C',
          good:  '#60A5FA',
          easy:  '#34D399',
        }
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      boxShadow: {
        // 精致的多层阴影
        'sm':   '0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)',
        'card': '0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06)',
        'card-dark': '0 0 0 1px rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.4)',
        'modal': '0 24px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)',
        'glow':  '0 0 24px rgba(245,158,11,0.25)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"PingFang SC"', '"HarmonyOS Sans", system-ui, sans-serif'],
        display: ['"SF Pro Display"', '-apple-system', '"PingFang SC"', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.24s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        'confetti': 'confetti 1.2s ease-out forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn:  { from: { transform: 'scale(0.94)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        confetti: { '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      }
    },
  },
  plugins: [],
} satisfies Config
