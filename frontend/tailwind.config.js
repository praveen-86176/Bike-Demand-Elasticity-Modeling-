/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0c10',
        card: '#161b22',
        border: 'rgba(255, 255, 255, 0.08)',
        primary: '#58a6ff',
        secondary: '#bc8cff',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 15% 50%, rgba(88, 166, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(188, 140, 255, 0.05) 0%, transparent 50%)',
      }
    },
  },
  plugins: [],
}
