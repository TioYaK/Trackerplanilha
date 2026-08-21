/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tibia: {
          bg: '#0f172a',     // Dark slate
          card: '#1e293b',   // Slightly lighter slate
          border: '#334155', // Border color
          primary: '#3b82f6',// Blue for highlights
        }
      }
    },
  },
  plugins: [],
}
