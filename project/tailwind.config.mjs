/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef4f8',
          100: '#d9e4ef',
          200: '#b3c9df',
          300: '#7d9fc5',
          400: '#4a739f',
          500: '#2d5a82',
          600: '#1d466b',
          700: '#155fa0',
          800: '#0e2a47',
          900: '#0a1f36',
        },
        orange: {
          50: '#fef5ed',
          100: '#fde8d3',
          200: '#fbcfa6',
          300: '#f8b069',
          400: '#f59342',
          500: '#e97824',
          600: '#d5641a',
          700: '#b14e16',
          800: '#8f3f18',
          900: '#753618',
        },
        paleBlue: {
          50: '#eef4f8',
          100: '#e0ebf3',
        },
        ink: '#202a33',
      },
    },
  },
  plugins: [],
};
