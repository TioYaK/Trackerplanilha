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
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        tibia: {
          bg: '#111111',       // Very dark grey, almost black (like a cave)
          card: '#1e1c1a',     // Dark brownish grey (stone/wood mix)
          border: '#3b3122',   // Dark gold/wood border
          primary: '#b08d57',  // Tibia Gold/Brass color
          wood: '#2d1e12',
          highlight: '#d4af37' // Bright Gold
        }
      },
      boxShadow: {
        'tibia-inset': 'inset 0 0 10px rgba(0,0,0,0.8)',
        'tibia-glow': '0 0 8px rgba(212, 175, 55, 0.4)',
      }
    },
  },
  plugins: [],
}
