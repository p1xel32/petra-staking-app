import { promises as fs } from 'fs';
import { glob } from 'glob';
import sitemap from 'sitemap';
const { SitemapStream, streamToPromise } = sitemap;

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
  
  const links = [];
  for (const [path, data] of pageGroups.entries()) {
    const usedLocales = data.allLocales ? locales : ['en'];

    const xhtmlLinks = usedLocales.map(locale => {
      let localizedPath;
      if (locale === 'en') {
        localizedPath = path;
      } else {
        localizedPath = path === '/' ? `/${locale}` : `/${locale}${path}`;
      }
      return { lang: locale, url: `${SITE_URL}${localizedPath}` };
    });

    links.push({
      url: path,
      changefreq: 'daily',
      priority: 0.7,
      links: xhtmlLinks,
    });
  }

  const stream = new SitemapStream({ hostname: SITE_URL });
  
  const sitemapXml = await streamToPromise(stream.pipe(links)).then((data) =>
    data.toString()
  );

  await fs.writeFile('public/sitemap-main.xml', sitemapXml);

  console.log('✅ Файл public/sitemap-main.xml успешно создан!');
}

generateSitemap();