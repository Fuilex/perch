import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: {
          'dark-from': '#0A0A0B',
          'dark-to': '#141416',
          'light-from': '#FAFAFA',
          'light-to': '#F0F0F2',
        },
        glass: {
          fill: 'var(--glass-fill)',
          'fill-hover': 'var(--glass-fill-hover)',
          'fill-active': 'var(--glass-fill-active)',
          border: 'var(--glass-border)',
          'border-subtle': 'var(--glass-border-subtle)',
          highlight: 'var(--glass-highlight)',
          separator: 'var(--glass-separator)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          quaternary: 'var(--text-quaternary)',
        },
      },
      fontFamily: {
        display: [
          '-apple-system',
          '"SF Pro Display"',
          '"Inter var"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        text: [
          '-apple-system',
          '"SF Pro Text"',
          '"Inter var"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        hero: ['2rem', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' }],
        title: ['1.375rem', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.02em' }],
        heading: ['1.0625rem', { lineHeight: '1.3', fontWeight: '500' }],
        body: ['0.9375rem', { lineHeight: '1.45', fontWeight: '400' }],
        secondary: ['0.8125rem', { lineHeight: '1.45', fontWeight: '400' }],
        caption: ['0.6875rem', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0.06em' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      backdropBlur: {
        'glass-light': '24px',
        'glass-medium': '36px',
        'glass-heavy': '48px',
      },
      boxShadow: {
        'glass-sm': 'var(--shadow-sm)',
        'glass-md': 'var(--shadow-md)',
        'glass-lg': 'var(--shadow-lg)',
      },
      zIndex: {
        card: '10',
        dropdown: '100',
        sheet: '200',
        modal: '300',
        toast: '400',
        'command-palette': '500',
        tooltip: '600',
      },
      animation: {
        'blob-drift-1': 'blobDrift1 52s ease-in-out infinite',
        'blob-drift-2': 'blobDrift2 58s ease-in-out infinite',
        'blob-drift-3': 'blobDrift3 44s ease-in-out infinite',
        'blob-drift-4': 'blobDrift4 62s ease-in-out infinite',
        'scan-breathe': 'scanBreathe 2.4s ease-in-out infinite',
      },
      keyframes: {
        blobDrift1: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(8%, -6%) scale(1.05)' },
          '50%': { transform: 'translate(-4%, 10%) scale(0.95)' },
          '75%': { transform: 'translate(-8%, -4%) scale(1.02)' },
        },
        blobDrift2: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(-10%, 5%) scale(0.97)' },
          '50%': { transform: 'translate(6%, -8%) scale(1.04)' },
          '75%': { transform: 'translate(4%, 8%) scale(0.98)' },
        },
        blobDrift3: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(5%, 10%) scale(1.03)' },
          '66%': { transform: 'translate(-7%, -5%) scale(0.96)' },
        },
        blobDrift4: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '20%': { transform: 'translate(-6%, -8%) scale(1.02)' },
          '40%': { transform: 'translate(8%, 4%) scale(0.97)' },
          '60%': { transform: 'translate(-3%, 9%) scale(1.05)' },
          '80%': { transform: 'translate(5%, -6%) scale(0.99)' },
        },
        scanBreathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
