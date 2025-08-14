import { promises as fs } from 'fs';
import { glob } from 'glob';

const SITE_URL = 'https://aptcore.one';

async function generateSitemap() {
  console.log('Генерация sitemap для основного сайта...');

  const pageFiles = await glob('pages/**/+Page.jsx');
  const locales = ['en', 'es', 'ja', 'ko', 'ru', 'vi'];
  
  const pageGroups = new Map();

  for (const file of pageFiles) {
    if (file.includes('_error')) {
      continue;
    }

    let canonicalPath = file
      .replace('pages', '')
      .replace('/+Page.jsx', '')
      .replace('/(locale)', '')
      .replace(/\/index$/, '') 
      .replace(/\/$/, ''); 

    if (canonicalPath === '') {
      canonicalPath = '/';
    }

    if (file.includes('(locale)')) {
      if (!pageGroups.has(canonicalPath)) {
        pageGroups.set(canonicalPath, { allLocales: true });
      }
    } else {
      if (!pageGroups.has(canonicalPath)) {
        pageGroups.set(canonicalPath, { allLocales: false });
      }
    }
  }
  
  const urlBlocks = [];

  for (const [path, data] of pageGroups.entries()) {
    const usedLocales = data.allLocales ? locales : ['en'];
    
    const xhtmlLinks = usedLocales.map(locale => {
      let localizedPath;
      if (locale === 'en') {
        localizedPath = path;
      } else {
        localizedPath = path === '/' ? `/${locale}` : `/${locale}${path}`;
      }
      const fullUrl = new URL(localizedPath, SITE_URL).href;
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${fullUrl}"/>`;
    }).join('\n');

    const canonicalUrl = new URL(path, SITE_URL).href;
    const urlBlock = [
      '  <url>',
      `    <loc>${canonicalUrl}</loc>`,
      `    <changefreq>daily</changefreq>`,
      `    <priority>0.7</priority>`,
      xhtmlLinks,
      '  </url>'
    ].join('\n');
    
    urlBlocks.push(urlBlock);
  }

  const sitemapXml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    urlBlocks.join('\n'),
    `</urlset>`
  ].join('\n');

  await fs.writeFile('public/sitemap-main.xml', sitemapXml);

  console.log('✅ Файл public/sitemap-main.xml успешно создан!');
}

generateSitemap();