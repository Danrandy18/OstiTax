import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Landing/calculadora: contenido publico, se prerenderiza en build time (una version por idioma) para SEO.
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'en', renderMode: RenderMode.Prerender },
  { path: 'es', renderMode: RenderMode.Prerender },
  { path: 'tr', renderMode: RenderMode.Prerender },
  { path: 'uk', renderMode: RenderMode.Prerender },
  { path: 'bcs', renderMode: RenderMode.Prerender },
  // Resto de la app: depende de sesion/auth (localStorage) y no necesita indexarse.
  // Se sirve como SPA client-side, igual que antes de introducir SSR.
  { path: '**', renderMode: RenderMode.Client },
];
