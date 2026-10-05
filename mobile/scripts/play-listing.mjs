#!/usr/bin/env node
// Actualiza la ficha de Google Play desde store/listing.json: datos de contacto, textos en cada
// idioma e imagenes (icono y grafico destacado). Uso (desde mobile/):
//   node scripts/play-listing.mjs            -> comprueba limites y publica la ficha
//   node scripts/play-listing.mjs --dry-run  -> solo comprueba limites

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API, ROOT, UPLOAD, withEdit } from './play-api.mjs';

const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 };
const config = JSON.parse(readFileSync(join(ROOT, 'store', 'listing.json'), 'utf8'));

let ok = true;
for (const [language, listing] of Object.entries(config.listings)) {
  for (const [field, max] of Object.entries(LIMITS)) {
    const length = [...(listing[field] ?? '')].length;
    if (!length || length > max) {
      console.error(`${language}.${field}: ${length}/${max} caracteres`);
      ok = false;
    }
  }
}
if (!ok) process.exit(1);
console.log('Limites de caracteres correctos.');
if (process.argv.includes('--dry-run')) process.exit(0);

await withEdit(async (call, editId) => {
  await call('PUT', `${API}/edits/${editId}/details`, { json: config.details });
  console.log('Datos de contacto actualizados.');

  for (const [language, listing] of Object.entries(config.listings)) {
    await call('PUT', `${API}/edits/${editId}/listings/${language}`, {
      json: { language, ...listing },
    });
    console.log(`Ficha ${language} actualizada.`);
  }

  for (const [language, images] of Object.entries(config.images ?? {})) {
    for (const [imageType, file] of Object.entries(images)) {
      const base = `${UPLOAD}/edits/${editId}/listings/${language}/${imageType}`;
      // Icono y grafico destacado admiten una sola imagen: se reemplaza la anterior.
      await call('DELETE', `${API}/edits/${editId}/listings/${language}/${imageType}`);
      await call('POST', `${base}?uploadType=media`, {
        data: readFileSync(join(ROOT, 'store', file)),
        contentType: 'image/png',
      });
      console.log(`Imagen ${imageType} (${language}) subida.`);
    }
  }
});
console.log('Ficha publicada en Play Console.');
