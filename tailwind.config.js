/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(var(--brand-primary) / <alpha-value>)',
          'primary-light': 'rgb(var(--brand-primary-light) / <alpha-value>)',
          'primary-dark': 'rgb(var(--brand-primary-dark) / <alpha-value>)',
          'primary-soft': 'rgb(var(--brand-primary-soft) / <alpha-value>)',
          secondary: 'rgb(var(--brand-secondary) / <alpha-value>)',
          'secondary-light': 'rgb(var(--brand-secondary-light) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
          'accent-light': 'rgb(var(--brand-accent-light) / <alpha-value>)',
          bgstart: 'rgb(var(--bg-gradient-start) / <alpha-value>)',
          bgend: 'rgb(var(--bg-gradient-end) / <alpha-value>)',
          text: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        }
      },
      keyframes: {
        float: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(30px, -50px) scale(1.1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      animation: {
        float: 'float 10s infinite ease-in-out alternate',
        slideInRight: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
