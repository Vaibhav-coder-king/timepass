/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Strict semantic dark mode color palette for clinical elderly accessibility
        'dark-surface': '#0F172A',         // Slate 900: deep, non-glare surface
        'dark-primary': '#F8FAFC',         // Slate 50: ultra-high contrast text (> 14:1 ratio)
        'dark-high-contrast': '#60A5FA',    // Blue 400: clinical vibrant high-contrast border (> 4.5:1 ratio)
      },
    },
  },
  plugins: [],
};
