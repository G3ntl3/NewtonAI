/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
    '../../packages/ui/src/**/*.{js,jsx}',
    '../../packages/simulations/src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        newton: {
          bg:           '#03045E', // deepest navy — page background
          navy:         '#033E8A', // card / sidebar background
          'blue-mid':   '#0078B7', // primary CTA, active states
          'blue-bright':'#0096C8', // hover highlights
          cyan:         '#00B4D7', // accent, progress bars
          'cyan-light': '#48CAE4', // icons, secondary accents
          'cyan-lighter':'#91E0EF', // muted text, borders
          'cyan-pale':  '#AEE8F4', // body text
          'cyan-ghost': '#CAF1F8', // headings, near-white
          orange:       '#FF7A1A', // streak flame, warm accents
          green:        '#00D98B', // success / done states
        },
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

