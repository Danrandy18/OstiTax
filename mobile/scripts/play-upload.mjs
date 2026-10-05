#!/usr/bin/env node
// Sube el AAB a Google Play con la API oficial. Uso (desde mobile/):
//   node scripts/play-upload.mjs                       -> pruebas internas
//   node scripts/play-upload.mjs --track alpha         -> prueba cerrada
//   node scripts/play-upload.mjs --track production    -> produccion
//   node scripts/play-upload.mjs --check               -> solo comprueba el acceso y lista las pistas
//
// Clave: android/play-service-account.json (ignorada por git; ver README "Publicar en Google Play").

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { API, ROOT, UPLOAD, withEdit } from './play-api.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const track = opt('track', 'internal');
const aab = opt('aab', join(ROOT, 'build', 'app', 'outputs', 'bundle', 'release', 'app-release.aab'));
// Mientras la ficha de la app no se haya publicado nunca, Google puede exigir versiones en borrador.
const status = opt('status', 'completed');
const notesFile = opt('notes', join(ROOT, 'store', 'release-notes.json'));
const checkOnly = args.includes('--check');

function releaseNotes() {
  try {
    return Object.entries(JSON.parse(readFileSync(notesFile, 'utf8'))).map(([language, text]) => ({
      language,
      text,
    }));
  } catch {
    return [];
  }
}

try {
  if (checkOnly) {
    await withEdit(
      async (call, editId) => {
        const tracks = await call('GET', `${API}/edits/${editId}/tracks`);
        for (const t of tracks.tracks ?? []) {
          const releases = (t.releases ?? []).map(
            (r) => `${r.name ?? '-'} [${(r.versionCodes ?? []).join(',')}] ${r.status}`,
          );
          console.log(`  ${t.track}: ${releases.join(' | ') || '(vacia)'}`);
        }
      },
      { commit: false },
    );
    console.log('Acceso correcto.');
  } else {
    await withEdit(async (call, editId) => {
      const size = (statSync(aab).size / 1024 / 1024).toFixed(1);
      console.log(`Subiendo ${aab} (${size} MB)...`);
      const bundle = await call('POST', `${UPLOAD}/edits/${editId}/bundles?uploadType=media`, {
        data: readFileSync(aab),
        contentType: 'application/octet-stream',
      });
      console.log(`Bundle subido: versionCode ${bundle.versionCode}`);

      const pubspec = readFileSync(join(ROOT, 'pubspec.yaml'), 'utf8');
      const name = /^version:\s*([^\s+]+)/m.exec(pubspec)?.[1] ?? String(bundle.versionCode);
      await call('PUT', `${API}/edits/${editId}/tracks/${track}`, {
        json: {
          track,
          releases: [
            {
              name: `${name} (${bundle.versionCode})`,
              versionCodes: [String(bundle.versionCode)],
              status,
              releaseNotes: releaseNotes(),
            },
          ],
        },
      });
      console.log(`Asignado a la pista "${track}" (estado: ${status})`);
    });
    console.log('Publicado.');
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
