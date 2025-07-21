// scripts/generate-sitemap.mjs
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { SitemapStream, streamToPromise } from 'sitemap';

const SITE_URL = 'https://aptcore.one';

async function generateSitemap() {
  console.log('Генерация sitemap для основного сайта...');

  const pageFiles = await glob('pages/**/+Page.jsx');

  const locales = ['en', 'es', 'ja', 'ko', 'ru', 'vi'];
  const links = [];

  pageFiles.forEach((file) => {
    let path = file
      .replace('pages', '')
      .replace('/+Page.jsx', '')
      .replace('index', ''); 

    if (path.includes('(locale)')) {
      locales.forEach(locale => {
        
        const localizedPath = locale === 'en'
          ? path.replace('/(locale)', '')
          : path.replace('(locale)', locale);
        links.push({ url: `${localizedPath || '/'}`, changefreq: 'daily', priority: 0.7 });
      });
    } else {
      links.push({ url: path, changefreq: 'daily', priority: 0.7 });
    }
  });

  const stream = new SitemapStream({ hostname: SITE_URL });
  links.forEach(link => stream.write(link));
  stream.end();

  const sitemapXml = await streamToPromise(stream).then((data) => data.toString());
  await fs.writeFile('public/sitemap-main.xml', sitemapXml);

  console.log('✅ Файл public/sitemap-main.xml успешно создан!');
}

generateSitemap();