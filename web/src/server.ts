import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
/**
 * Render (como la mayoria de PaaS) sirve la app detras de un proxy inverso:
 * el Host real llega en X-Forwarded-Host, no en el header Host de la
 * conexion TCP interna. Sin esto, la proteccion SSRF de Angular SSR rechaza
 * el request y cae a client-side rendering (ver angular.dev/best-practices/
 * security#configuring-trusted-proxy-headers).
 */
app.set('trust proxy', true);
const angularApp = new AngularNodeAppEngine();

/**
 * El frontend llama a rutas relativas "/api/..." (ver environment.prod.ts). En
 * produccion, backend y web son servicios separados (dominios distintos), asi
 * que reenviamos esas peticiones al backend real via API_ORIGIN, igual que
 * hace proxy.conf.json en desarrollo.
 */
const apiOrigin = process.env['API_ORIGIN'];
if (apiOrigin) {
  // pathFilter (en vez de app.use('/api', ...)) evita que Express recorte el
  // prefijo /api antes de reenviar: el backend lo espera (ver main.ts, setGlobalPrefix('api')).
  app.use(
    createProxyMiddleware({ target: apiOrigin, changeOrigin: true, pathFilter: '/api' }),
  );
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
