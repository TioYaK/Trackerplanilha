/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        medieval: ['MedievalSharp', 'cursive'],
        cinzel: ['Cinzel', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Roboto', 'sans-serif'],
      },
      colors: {
        obsidian: {
          950: '#050608',
          900: '#08090d',
          850: '#0d0f15',
          800: '#12151f',
          700: '#1a1e2b',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        gold: {
          50: '#fdfbf7',
          100: '#fbf6ec',
          200: '#f5e9ce',
          300: '#eed6a7',
          400: '#e3be72',
          500: '#d4af37',
          600: '#ba9427',
          700: '#94721e',
          800: '#795c1e',
          900: '#664c1d',
          champagne: '#f3e8c8',
        },
        tibia: {
          bg: '#08090d',       // Obsidian space black
          card: '#0f121a',     // Dark slate surface with depth
          border: '#2a241b',   // Refined gold-tinted dark border
          primary: '#c5a059',  // Champagne Gold
          wood: '#181410',
          highlight: '#e5c058' // Imperial Gold
        }
      },
      boxShadow: {
        'tibia-inset': 'inset 0 0 10px rgba(0,0,0,0.8)',
        'tibia-glow': '0 0 12px rgba(212, 175, 55, 0.3)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.15)',
        'gold-glow-lg': '0 0 45px rgba(212, 175, 55, 0.25)',
        'obsidian-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
}
