import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eeecf8',
          100: '#dad8f0',
          200: '#b9b5e3',
          300: '#9590d3',
          400: '#766bc1',
          500: '#5d52b0',
          600: '#4d449e',
          700: '#3e368c',
          800: '#302978',
          900: '#231f5e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
