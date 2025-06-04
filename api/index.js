// api/index.js
import { renderPage } from 'vike/server';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

export default async function handler(req, res) {
  const url = req.url;

  if (!url) {
    console.error('[API HANDLER] Request URL is undefined.');
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad Request: URL is missing.');
    return;
  }

  console.log(`[API HANDLER] Processing request for URL: ${url}`);
  console.log(`[API HANDLER] Calculated project root: ${root}`);

  const pageContextInit = {
    urlOriginal: url,
    _root: root // Передаем рассчитанный корень в Vike
  };

  try {
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      console.warn(`[API HANDLER] Vike returned no httpResponse for: ${url}`);
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
    console.error(`[API HANDLER] Critical error rendering page for: ${url}`, error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error. Check Vercel runtime logs.');
  }
}