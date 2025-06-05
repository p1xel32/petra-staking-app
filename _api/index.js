import { renderPage } from 'vike/server';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

export default async function handler(req, res) {
  const invokedUrl = req.url;
  let originalUrl = req.originalUrl; 
  if (!originalUrl && req.headers && req.headers['x-vercel-forwarded-path']) {
    originalUrl = req.headers['x-vercel-forwarded-path'];
  } else if (!originalUrl && req.headers && req.headers['x-forwarded-path']) {
    originalUrl = req.headers['x-forwarded-path'];
  } else if (!originalUrl && req.headers && req.headers['x-rewrite-url']) {
    originalUrl = req.headers['x-rewrite-url'];
  }
  const urlToRender = originalUrl || invokedUrl || '/';

  const pageContextInit = { urlOriginal: urlToRender, _root: root };

  try {
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;
    if (!httpResponse) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Page not found by Vike handler (no httpResponse).');
      return;
    }
    const { body, statusCode, headers } = httpResponse;
    if (headers) {
      headers.forEach(([key, value]) => res.setHeader(key, value));
    }
    res.statusCode = statusCode;
    res.end(body);
  } catch (error) {
    console.error(`[API HANDLER] Critical error for ${urlToRender}:`, error.stack || error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error.');
  }
}