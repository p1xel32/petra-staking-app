import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: 'https://aptcore.one',
  base: '/blog',
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-ES',
          ja: 'ja-JP',
          ko: 'ko-KR',
          ru: 'ru-RU',
          vi: 'vi-VN',
        },
      },
    }),
    react(),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'ja', 'ko', 'ru', 'vi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    define: {
      '__dirname': JSON.stringify(__dirname),
    },
    build: {
      rollupOptions: {
        external: ['fsevents'],
      },
    },
    // ✅ Вот финальное исправление
    resolve: {
      alias: {
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/layouts': path.resolve(__dirname, 'src/layouts'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/styles': path.resolve(__dirname, 'src/styles'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/content': path.resolve(__dirname, 'src/content'),
        '@/consts': path.resolve(__dirname, 'src/consts.ts'),
        '@/i18n': path.resolve(__dirname, 'src/i18n'), 
      },
    },
  },
});