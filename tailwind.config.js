// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',                     
    './pages/**/*.{js,ts,jsx,tsx}',     
    './renderer/**/*.{js,ts,jsx,tsx}',  
    './src/**/*.{js,jsx,ts,tsx}',       
  ],

  theme: {
    extend: {
      backgroundImage: {
        noise: "url('/src/assets/noise.png')",
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },

  plugins: [
    require('tailwindcss-animate'),
  ],
};