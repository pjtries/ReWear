/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rewear: {
          teal: '#588B8B',       // Primary Brand / Trust & Sustainability
          white: '#FFFFFF',      // Canvas / Clean Background
          peach: '#FFD5C2',      // Soft Surface / Cards / Highlights
          tangerine: '#F28F3B',  // Primary CTA / Interactive Accents
          terracotta: '#C8553D', // Alerts / Damage Flags / High-Value Badges
          black: '#000000'       // Primary Typography / High-Contrast 1px Borders
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        editorial: '4px 4px 0px 0px #000000',
        'editorial-sm': '2px 2px 0px 0px #000000',
        'editorial-lg': '6px 6px 0px 0px #000000'
      }
    }
  },
  plugins: []
};
