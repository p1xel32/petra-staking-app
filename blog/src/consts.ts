// src/consts.ts

export const SITE_TITLE = 'aptcore.one Blog';
export const SITE_DESCRIPTION = 'News, guides, and insights on Aptos staking and the aptcore.one platform.';
export const SITE_URL = 'https://aptcore.one';

export const PATHS = {
  home: '/',
  blog: '/blog',
  help: '/blog/help',
  faq: '/blog/faq',
  about: '/blog/about',
  contact: '/blog/contact',
  legal: {
    disclaimer: '/blog/legal/disclaimer',
    terms: '/blog/legal/terms',
  },
  tools: {
    apyCalculator: 'https://aptcore.one/tools/aptos-staking-apy-calculator',
    lockupVisualizer: 'https://aptcore.one/tools/aptos-staking-lockup-visualizer',
  },
};

export const BLOG_CANONICAL_ROOT = `${SITE_URL}${PATHS.blog}`;

export const SOCIALS = {
  twitter: 'https://x.com/aptcoreone',
  youtube: 'https://www.youtube.com/@aptcoreone',
  github: 'https://github.com/p1xel32/petra-staking-app',
  stakingRewards: 'https://www.stakingrewards.com/provider/aptcore-one',
};