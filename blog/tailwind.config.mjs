// blog/tailwind.config.mjs
import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}',
  ],
  darkMode: 'selector', 
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'aptcore': {
          'purple': '#A78BFA', 
          'cyan': '#22D3EE',   
          'green': '#4ADE80',  
          'blue': '#60A5FA',   
        },
        'brand-bg-dark': '#09090B',     
        'brand-text-light': '#E5E7EB',    
        'brand-text-secondary': '#A1A1AA', 
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.brand-text-light'),
            '--tw-prose-headings': theme('colors.white'),
            '--tw-prose-lead': theme('colors.zinc[400]'),
            '--tw-prose-links': theme('colors.aptcore.purple'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-counters': theme('colors.brand-text-secondary'),
            '--tw-prose-bullets': theme('colors.aptcore.purple'),
            '--tw-prose-hr': theme('colors.zinc[700]'),
            '--tw-prose-quotes': theme('colors.aptcore.purple'),
            '--tw-prose-quote-borders': theme('colors.zinc[700]'),
            '--tw-prose-captions': theme('colors.brand-text-secondary'),
            '--tw-prose-code': theme('colors.white'),
            '--tw-prose-pre-code': theme('colors.zinc[300]'),
            '--tw-prose-pre-bg': theme('colors.zinc[800]'),
            '--tw-prose-th-borders': theme('colors.zinc[600]'),
            '--tw-prose-td-borders': theme('colors.zinc[700]'),
            '--tw-prose-invert-body': theme('colors.brand-text-light'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-links': theme('colors.aptcore.purple'),
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
}
