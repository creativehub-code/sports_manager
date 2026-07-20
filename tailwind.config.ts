import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sports theme: Deep Navy + Gold
        navy: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d1ff',
          300: '#91acff',
          400: '#597eff',
          500: '#2e52ff',
          600: '#1432f5',
          700: '#0e23e1',
          800: '#111db6',
          900: '#141d8f',
          950: '#0f172a',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        background: '#051424',
        foreground: '#d4e4fa',
        card: {
          DEFAULT: '#0c1a2c',
          foreground: '#d4e4fa',
        },
        popover: {
          DEFAULT: '#0c1a2c',
          foreground: '#d4e4fa',
        },
        primary: {
          DEFAULT: '#bec6e0',
          foreground: '#283044',
          container: '#0f172a',
          'on-container': '#798098',
        },
        secondary: {
          DEFAULT: '#ffb95f',
          foreground: '#472a00',
          container: '#ee9800',
          'on-container': '#5b3800',
        },
        tertiary: {
          DEFAULT: '#7bd0ff',
          foreground: '#00354a',
          container: '#001a27',
          'on-container': '#008abb',
        },
        error: {
          DEFAULT: '#ffb4ab',
          foreground: '#690005',
          container: '#93000a',
          'on-container': '#ffdad6',
        },
        surface: {
          DEFAULT: '#051424',
          dim: '#051424',
          bright: '#2c3a4c',
          variant: '#273647',
          'container-lowest': '#010f1f',
          'container-low': '#0d1c2d',
          'container': '#122131',
          'container-high': '#1c2b3c',
          'container-highest': '#273647',
          tint: '#bec6e0',
        },
        'on-surface': {
          DEFAULT: '#d4e4fa',
          variant: '#c6c6cd',
        },
        'inverse-surface': '#d4e4fa',
        'inverse-on-surface': '#233143',
        outline: {
          DEFAULT: '#909097',
          variant: '#45464d',
        },
        muted: {
          DEFAULT: '#0d1c2d',
          foreground: '#c6c6cd',
        },
        accent: {
          DEFAULT: '#1c2b3c',
          foreground: '#d4e4fa',
        },
        border: '#1c2b3c',
        input: '#0d1c2d',
        ring: '#bec6e0',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Aura rounded tokens
        'aura-sm': '0.5rem',
        'aura-default': '1rem',
        'aura-md': '1.5rem',
        'aura-lg': '2rem',
        'aura-xl': '3rem',
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
