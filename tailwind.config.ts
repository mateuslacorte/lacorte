import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4faeb',
          100: '#e8f5d4',
          200: '#d4ebab',
          300: '#c3e07f',
          400: '#B2D959',
          500: '#7EC151',
          600: '#5fa33c',
          700: '#4a8130',
          800: '#3d6629',
          900: '#345524',
        },
        accent: {
          50: '#fffceb',
          100: '#fff9c7',
          200: '#fff58a',
          300: '#fff05c',
          400: '#FFF449',
          500: '#FED24F',
          600: '#e5b12a',
          700: '#bf8c1a',
          800: '#996e16',
          900: '#7c5a15',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        gradient: 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
