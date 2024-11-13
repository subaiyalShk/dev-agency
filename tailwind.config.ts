import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        brand: {
          black: '#070707',
          white: '#FFFFFF',
          red: '#B7193D',
          blue: '#0769FB',
          pink: '#EA008D',
        }
      }
    },
  },

  plugins: []
} satisfies Config;
