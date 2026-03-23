import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'care-dark':         '#1A4332',
        'care':              '#2D6A4F',
        'care-light':        '#D8F3DC',
        'care-pale':         '#F0FAF3',
        'care-accent':       '#B7410E',
        'care-accent-light': '#FDEBD0',
        'slate-deep':        '#1E293B',
        'slate-mid':         '#475569',
        'border-soft':       '#CBD5E1',
        'border-light':      '#E2E8F0',
        'surface':           '#F8FAFC',
        // Severity colours (incident management)
        'severity-critical': '#7F1D1D',
        'severity-high':     '#92400E',
        'severity-medium':   '#1E40AF',
        'severity-low':      '#166534',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:    ['var(--font-dm-sans)', '-apple-system', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
