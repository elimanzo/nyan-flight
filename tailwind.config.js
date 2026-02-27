import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
        body: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        cosmic: {
          50: '#fdf2ff',
          100: '#f8d8ff',
          200: '#f5adff',
          300: '#f07cff',
          400: '#eb53ff',
          500: '#d92dff',
          600: '#b21ed9',
          700: '#8a17aa',
          800: '#631279',
          900: '#3e0a4b',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(236, 72, 153, 0.45)',
      },
      backgroundImage: {
        'star-field':
          'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15), transparent 40%), radial-gradient(circle at 80% 30%, rgba(251, 191, 36, 0.15), transparent 45%), radial-gradient(circle at 50% 80%, rgba(14, 165, 233, 0.2), transparent 55%)',
        'cosmic-grid':
          'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
