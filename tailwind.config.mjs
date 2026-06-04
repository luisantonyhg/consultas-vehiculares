/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e31837',
          yellow: '#ffd000',
          navy: {
            dark: '#0b1c36',
            medium: '#1a3a6b',
            light: '#1e3a8a',
          },
        },
        surface: {
          bg: '#f5f6f8',
          card: '#ffffff',
          border: '#e0e0e0',
          'border-light': '#f0f0f0',
        },
        text: {
          primary: '#1c1c1c',
          secondary: '#6b6b6b',
          muted: '#8892a3',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        dancing: ['"Dancing Script"', 'cursive'],
        archivo: ['"Archivo Black"', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs': ['11px', { lineHeight: '15px' }],
        'sm': ['12px', { lineHeight: '16px' }],
        'base': ['13px', { lineHeight: '18px' }],
        'md': ['14px', { lineHeight: '20px' }],
        'lg': ['16px', { lineHeight: '22px' }],
      },
      borderRadius: {
        card: '10px',
        btn: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
      spacing: {
        sidebar: '240px',
        panel: '300px',
        header: '56px',
      },
    },
  },
  plugins: [],
};
