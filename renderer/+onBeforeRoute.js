import { redirect } from 'vike/abort';
import { locales, defaultLocale } from '../src/i18n.js';

export default function onBeforeRoute(pageContext) {
  const { urlPathname, urlOriginal } = pageContext;

  if (urlOriginal.startsWith('/api/') || urlPathname.includes('.')) {
    return;
  }

  const urlParts = urlPathname.split('/').filter(Boolean);
  const potentialLocale = urlParts[0];

  if (locales.includes(potentialLocale)) {
    if (potentialLocale === defaultLocale) {
      const urlWithoutLocale = '/' + urlParts.slice(1).join('/');
      throw redirect(urlWithoutLocale || '/', 301);
    }
    
    const newUrlPathname = '/' + urlParts.slice(1).join('/');
    return {
      pageContext: {
        locale: potentialLocale,
        urlPathname: newUrlPathname || '/',
      },
    };
  }

  return {
    pageContext: {
      locale: defaultLocale,
    }
  };
}
