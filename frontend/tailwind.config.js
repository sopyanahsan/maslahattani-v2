/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#2563EB',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Brand alias
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Semantic
        success: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        info: '#6366F1',
        // Sidebar
        'sidebar-dark': '#0F172A',

        // =========================================
        // Posify Design System v2 — Dark Theme Tokens
        // Referensi: stitch ui/posify_ui/DESIGN.md
        // =========================================
        posify: {
          // Primary Accent (Teal)
          primary: {
            DEFAULT: '#5fd9d2',
            container: '#03a29c',
            fixed: '#7ef6ee',
            'fixed-dim': '#5fd9d2',
          },
          'on-primary': '#003735',
          'on-primary-container': '#00302e',
          'inverse-primary': '#006a66',

          // Secondary & Tertiary
          secondary: '#c8c6c5',
          'on-secondary': '#313030',
          'secondary-container': '#4a4949',
          tertiary: '#c8c6c5',
          'tertiary-container': '#929090',

          // Surface Hierarchy (layered dark approach)
          surface: {
            DEFAULT: '#121414',
            dim: '#121414',
            bright: '#38393a',
            lowest: '#0d0e0f',
            low: '#1a1c1c',
            container: '#1e2020',
            high: '#292a2a',
            highest: '#333535',
          },
          'on-surface': '#e3e2e2',
          'on-surface-variant': '#bcc9c7',
          background: '#121414',
          'on-background': '#e3e2e2',

          // Outline & Border
          outline: {
            DEFAULT: '#869392',
            variant: '#3d4948',
          },

          // Error / Danger
          error: {
            DEFAULT: '#ffb4ab',
            container: '#93000a',
          },
          'on-error': '#690005',
          'on-error-container': '#ffdad6',

          // Inverse
          'inverse-surface': '#e3e2e2',
          'inverse-on-surface': '#2f3131',
        },
      },

      fontFamily: {
        sans: ['Josefin Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Source Sans 3', 'Source Sans Pro', 'system-ui', 'sans-serif'],
        // Posify Design System font
        hanken: ['Hanken Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        // Posify Typography Scale
        'posify-display': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'posify-headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'posify-headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'posify-title': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'posify-body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'posify-body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'posify-label': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'posify-caption': ['11px', { lineHeight: '14px', fontWeight: '400' }],
      },

      spacing: {
        // Posify 4px Grid System
        'posify-xs': '4px',
        'posify-sm': '8px',
        'posify-md': '16px',
        'posify-lg': '24px',
        'posify-xl': '32px',
        'posify-gutter': '16px',
        'posify-margin-mobile': '16px',
        'posify-margin-desktop': '32px',
        // Sidebar widths
        'posify-sidebar': '280px',
        'posify-sidebar-mini': '72px',
      },

      borderRadius: {
        // Posify Shape Language
        'posify-sm': '4px',     // Checkboxes, small tags
        'posify-md': '8px',     // Buttons, inputs, cards (default)
        'posify-lg': '16px',    // Modals, large banners
        'posify-xl': '24px',    // Feature cards, hero sections
      },

      boxShadow: {
        // Posify Elevation (subtle in dark mode)
        'posify-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'posify-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'posify-lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'posify-glow': '0 0 15px rgba(95, 217, 210, 0.3)',
        'posify-glow-error': '0 0 15px rgba(255, 180, 171, 0.3)',
      },

      animation: {
        'posify-pulse': 'posify-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'posify-glow': 'posify-glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        'posify-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'posify-glow': {
          '0%': { boxShadow: '0 0 5px rgba(95, 217, 210, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(95, 217, 210, 0.5)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
