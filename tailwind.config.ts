import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        tertiary: { DEFAULT: 'hsl(var(--tertiary))', foreground: 'hsl(var(--tertiary-foreground))' },
        subtle: { DEFAULT: 'hsl(var(--subtle))', foreground: 'hsl(var(--subtle-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: {
        heading: ['var(--font-aeonik)', 'system-ui', 'sans-serif'],
        default: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        grid: { '0%': { transform: 'translateY(-50%)' }, '100%': { transform: 'translateY(0)' } },
        shimmer: {
          '0%, 90%, 100%': { 'background-position': 'calc(-100% - var(--shimmer-width)) 0' },
          '30%, 60%': { 'background-position': 'calc(100% + var(--shimmer-width)) 0' },
        },
        'image-glow': {
          '0%': { opacity: '0', 'animation-timing-function': 'cubic-bezier(.74, .25, .76, 1)' },
          '10%': { opacity: '0.5', 'animation-timing-function': 'cubic-bezier(.12, .01, .08, .99)' },
          '100%': { opacity: '0.7' },
        },
        'border-beam': { '100%': { 'offset-distance': '100%' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(calc(-100% - var(--gap)))' } },
        flip: { to: { transform: 'rotate(360deg)' } },
        rotate: { to: { transform: 'rotate(90deg)' } },
        'caret-blink': { '0%,70%,100%': { opacity: '1' }, '20%,50%': { opacity: '0' } },
        pulseGlow: { '0%,100%': { opacity: '0.35' }, '50%': { opacity: '0.85' } },
      },
      animation: {
        grid: 'grid 15s linear infinite',
        shimmer: 'shimmer 5s infinite',
        'image-glow': 'image-glow 4s ease-out 0.6s forwards',
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        marquee: 'marquee var(--duration) linear infinite',
        flip: 'flip 6s infinite steps(2, end)',
        rotate: 'rotate 3s linear infinite both',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
