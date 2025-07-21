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
        sans: [
          '"Inter"',           
          'Noto Sans JP',     
          'Noto Sans KR',     
          'Noto Sans',        
          ...defaultTheme.fontFamily.sans, 
        ],
      },
      colors: {
        'brand-bg': '#0D0D1F',
        zinc: {
          50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
          400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
          800: '#27272a', 900: '#18181b', 950: '#09090b',
        },
        purple: {
          300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
        },
        'aptcore-purple': '#A78BFA',
      },
      typography: (theme) => ({
        invert: { 
          css: {
            '--tw-prose-body': theme('colors.zinc[300]'),
            '--tw-prose-headings': theme('colors.zinc[100]'),
            '--tw-prose-lead': theme('colors.zinc[400]'),
            '--tw-prose-links': theme('colors.purple[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-counters': theme('colors.zinc[400]'),
            '--tw-prose-bullets': theme('colors.purple[500]'),
            '--tw-prose-hr': theme('colors.zinc[800]'),
            '--tw-prose-quotes': theme('colors.zinc[200]'),
            '--tw-prose-quote-borders': theme('colors.purple[500]'),
            '--tw-prose-captions': theme('colors.zinc[400]'),
            '--tw-prose-code': theme('colors.zinc[200]'),
            '--tw-prose-pre-code': theme('colors.zinc[300]'),
            '--tw-prose-pre-bg': theme('colors.zinc[900]'),
            '--tw-prose-th-borders': theme('colors.zinc[700]'),
            '--tw-prose-td-borders': theme('colors.zinc[800]'),
            
            p: {
              fontSize: '0.9rem',
              lineHeight: '1.85',
              letterSpacing: '0.02em',
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            'li': {
              fontSize: '0.9rem',
              lineHeight: '1.85',
              marginTop: '0.6em',
              marginBottom: '0.6em',
            },

            strong: {
              fontWeight: '100',
              color: 'var(--tw-prose-bold)',
              textShadow: `0 0 8px ${theme('colors.purple[400]/0.3')}`,
            },

            a: {
                color: 'var(--tw-prose-links)',
                textDecoration: 'none',
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                    color: theme('colors.white'),
                    textDecoration: 'underline',
                    textDecorationColor: theme('colors.purple[400]/0.5'),
                    textUnderlineOffset: '4px',
                },
            },
          },
        },
      }),
    },
  },
  plugins: [
    typography,
  ],
}
