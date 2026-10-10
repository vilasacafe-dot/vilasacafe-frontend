/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Admin UI (unchanged): Inter + Plus Jakarta Sans
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        // Customer UI: Manrope body + DM Serif Display editorial headings
        body: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        // ── Admin palette (kept intact so the admin UI is unchanged) ──
        brand: {
          50: '#fbf6f0',
          100: '#f4e7d8',
          200: '#e8ccae',
          300: '#daac7d',
          400: '#cc8a54',
          500: '#b9713b',
          600: '#a15b31',
          700: '#82472c',
          800: '#6a3b29',
          900: '#573224',
        },
        ink: {
          50: '#f6f6f5',
          100: '#e7e6e4',
          200: '#cfccc8',
          300: '#aca7a0',
          400: '#847e75',
          500: '#69635b',
          600: '#524d47',
          700: '#433f3a',
          800: '#292723',
          900: '#1c1a17',
        },

        // ── Customer palette (premium cafe identity) ──
        // Deep espresso — headings, nav, primary buttons, important text
        espresso: {
          50: '#F6F3F1',
          100: '#E8E0DC',
          200: '#CDBFB8',
          300: '#AC988F',
          400: '#7C645B',
          500: '#574640',
          600: '#423330',
          700: '#30231F', // DEFAULT brand espresso
          800: '#241A17',
          900: '#1A120F',
          DEFAULT: '#30231F',
        },
        // Terracotta — prices, selected actions, active nav, highlights
        terracotta: {
          50: '#FBF1ED',
          100: '#F5DBD1',
          200: '#EBB7A4',
          300: '#DE8E73',
          400: '#CC6E4F',
          500: '#B95538', // DEFAULT
          600: '#A24930',
          700: '#843A27',
          800: '#672E20',
          900: '#4F241A',
          DEFAULT: '#B95538',
        },
        // Muted sage — restrained secondary accent / supporting states
        sage: {
          50: '#F2F3EF',
          100: '#E1E4D9',
          200: '#C5CBB5',
          300: '#A6AE90',
          400: '#8D9674',
          500: '#7B8468', // DEFAULT
          600: '#636B53',
          700: '#4C5240',
          800: '#3A3F31',
          900: '#2C3025',
          DEFAULT: '#7B8468',
        },
        // Warm neutrals
        ivory: '#FAF7F2', // main page background
        cream: '#F1EBE3', // soft surface
        sand: '#E9E1D8', // fine borders
        stone: '#766D66', // secondary text
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,15,14,0.04), 0 1px 3px rgba(16,15,14,0.06)',
        soft: '0 4px 16px rgba(16,15,14,0.06)',
        // Customer surfaces — warm, soft elevation
        cafe: '0 1px 2px rgba(48,35,31,0.04), 0 6px 20px -8px rgba(48,35,31,0.14)',
        lift: '0 10px 30px -12px rgba(48,35,31,0.28)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-bar': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up-bar': 'slide-up-bar 0.3s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.3s ease-out',
        'check-pop': 'check-pop 0.45s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
