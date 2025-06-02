// api/index.js
import { renderPage } from 'vike/server';

export default async function handler(req, res) {
  const { url } = req;

  if (!url) {
    console.error('[API HANDLER] Request URL is undefined.');
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad Request: URL is missing.');
    return;
  }

  console.log(`[API HANDLER] Processing request for URL: ${url}`);

  try {
    const pageContext = await renderPage({ urlOriginal: url });
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      console.warn(`[API HANDLER] Vike returned no httpResponse for: ${url}`);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Page not found by Vike.');
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
    res.end('Internal Server Error');
  }
}
