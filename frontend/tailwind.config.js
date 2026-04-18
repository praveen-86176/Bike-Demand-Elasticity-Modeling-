/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#0f1117',
        sidebar:   '#1a1d2e',
        card:      '#1e2139',
        border:    '#2a2d4a',
        primary:   '#4f6ef7',
        secondary: '#7c5cbf',
        success:   '#22c55e',
        warning:   '#f59e0b',
        danger:    '#ef4444',
        textPrimary:   '#e2e8f0',
        textSecondary: '#94a3b8',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { xl: '12px', '2xl': '16px' },
    },
  },
  plugins: [],
};
