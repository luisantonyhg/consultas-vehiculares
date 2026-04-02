/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e30613',
          'red-dark': '#b8050f',
          green: '#2ecc71',
          'green-light': '#d4efdf',
          blue: '#3498db',
          'blue-light': '#ebf5fb',
          yellow: '#f1c40f',
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
          muted: '#999999',
        },
      },
      fontFamily: {
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
