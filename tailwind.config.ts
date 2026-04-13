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
          50:  '#2a2650',
          100: '#332f60',
          200: '#3f3b78',
          300: '#5450a0',
          400: '#7068c0',
          500: '#8c82d4',
          600: '#a89ee4',
          700: '#c4baf0',
          800: '#dcd8f8',
          900: '#f0eeff',
        },
      },
    },
  },
  plugins: [],
};

export default config;
