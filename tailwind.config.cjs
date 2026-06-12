/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mplus: ["'M PLUS Rounded 1c'", 'Verdana', 'sans-serif'],
        ptsans: ["'PT Sans'", 'sans-serif'],
        serif: ['Georgia', "'Noto Serif TC'", 'ui-serif', 'serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #22d3ee, #a78bfa)'
      }
    }
  },
  plugins: []
}
