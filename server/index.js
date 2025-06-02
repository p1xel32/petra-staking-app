// File: server/index.js
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { createProxyMiddleware } from 'http-proxy-middleware';

import { renderPage } from 'vike/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // Directory of server/index.js
const projectRoot = join(__dirname, '..'); // Assumes server/index.js is in PROJECT_ROOT/server

const isProduction = process.env.NODE_ENV === 'production';
const vikeDevServerPort = 3000; // Vike's development server typically runs on port 3000
const appPort = process.env.PORT || (isProduction ? 3000 : 3001); // Your Express server port

async function startServer() {
  const app = express();

  if (isProduction) {
    console.log('[SERVER] Running in production mode.');
    // Serve static assets from dist/client
    app.use(express.static(join(projectRoot, 'dist', 'client')));

    // SSR handler for production
    // All other requests are handled by Vike's SSR
    app.get('*', async (req, res, next) => {
      console.log(`[SERVER-PROD] SSR Request for URL: ${req.originalUrl}`);
      const pageContextInit = { urlOriginal: req.originalUrl };
      const pageContext = await renderPage(pageContextInit);
      const { httpResponse } = pageContext;

      if (!httpResponse) {
        console.error(`[SERVER-PROD] Vike did NOT return an httpResponse for ${req.originalUrl}.`);
        return next(); // Should lead to a 404 if not handled otherwise
      } else {
        const { body, statusCode, headers, earlyHints } = httpResponse;
        console.log(`[SERVER-PROD] Vike returned httpResponse for ${req.originalUrl}. Status: ${statusCode}`);
        if (res.writeEarlyHints && earlyHints) {
          earlyHints.forEach(hint => res.writeEarlyHints(hint));
        }
        headers.forEach(([name, value]) => res.setHeader(name, value));
        res.status(statusCode).send(body);
      }
    });
  } else { // Development mode
    console.log('[SERVER] Running in development mode.');
    console.log(`[SERVER-DEV] Your Express server will proxy requests to Vike dev server at http://localhost:${vikeDevServerPort}`);
    app.use(
      '/', // Proxy all requests
      createProxyMiddleware({
        target: `http://localhost:${vikeDevServerPort}`,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying for HMR
        onError: (err, req, res) => {
          console.error('[PROXY ERROR]', err.message);
          if (res && !res.headersSent && res.writeHead) { // Check if res.writeHead exists
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Proxy error: Could not connect to Vike dev server. Is "vike dev" running?');
          } else if (res && !res.headersSent) {
             // Fallback if writeHead is not available (e.g. if res is not an http.ServerResponse)
            res.status(502).send('Proxy error: Could not connect to Vike dev server. Is "vike dev" running?');
          }
        }
      })
    );

  }

  app.listen(appPort, () => {
    console.log(`[SERVER] Express server started on http://localhost:${appPort}`);
    if (!isProduction) {
      console.log(`[SERVER-DEV] Make sure 'vike dev' is also running (usually on port ${vikeDevServerPort}).`);
      console.log(`[SERVER-DEV] Access your application via this Express server at http://localhost:${appPort}`);
    }
    console.log(`[SERVER] Project root is configured as: ${projectRoot}`);
  });
}

startServer();