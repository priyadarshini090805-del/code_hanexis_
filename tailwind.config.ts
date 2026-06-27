import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        hx: {
          bg: '#FFFDF9',
          brand: '#6D1E2A',
          'brand-light': '#8B2F3D',
          accent: '#D2A679',
          'accent-light': '#E8C9A4',
          text: '#242424',
          'text-secondary': '#6B6560',
          surface: '#FFFFFF',
          'surface-secondary': '#F8F5F2',
          border: '#E7DED5',
          'border-light': '#F0EBE5',
          success: '#2F6B45',
          warning: '#C48B2A',
          error: '#A63C3C',
        },
      },
      borderRadius: {
        '2xl': 'calc(var(--radius) + 4px)',
        xl: 'var(--radius)',
        lg: 'calc(var(--radius) - 2px)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(109,30,42,.03), 0 8px 28px -12px rgba(109,30,42,.06)',
        lift: '0 1px 3px rgba(109,30,42,.04), 0 20px 44px -18px rgba(109,30,42,.12)',
        'brand-glow': '0 0 0 3px rgba(109,30,42,.08)',
        'accent-glow': '0 0 0 3px rgba(210,166,121,.12)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fadeIn .5s ease both',
        'fade-in-up': 'fadeInUp .55s cubic-bezier(.16,1,.3,1) both',
        'scale-in': 'scaleIn .4s cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
}
export default config
