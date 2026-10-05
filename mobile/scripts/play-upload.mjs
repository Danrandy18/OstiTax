#!/usr/bin/env node
// Sube el AAB a Google Play con la API oficial (Google Play Android Developer API), sin
// dependencias: firma el JWT de la cuenta de servicio con node:crypto.
//
// Uso (desde mobile/):
//   node scripts/play-upload.mjs                       -> pruebas internas
//   node scripts/play-upload.mjs --track production    -> produccion
//   node scripts/play-upload.mjs --check               -> solo comprueba el acceso
//
// Clave: android/play-service-account.json (ignorada por git; ver README "Publicar en Google Play").

import { createSign } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const PACKAGE = 'at.ostitax.app';
const track = opt('track', 'internal');
const keyFile = opt('key', join(root, 'android', 'play-service-account.json'));
const aab = opt('aab', join(root, 'build', 'app', 'outputs', 'bundle', 'release', 'app-release.aab'));
// Mientras la ficha de la app no se haya publicado nunca, Google solo acepta versiones en borrador.
const status = opt('status', 'completed');
const notesFile = opt('notes', join(root, 'store', 'release-notes.json'));
const checkOnly = args.includes('--check');

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE}`;

async function accessToken() {
  const key = JSON.parse(readFileSync(keyFile, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Token: ${res.status} ${JSON.stringify(body)}`);
  return body.access_token;
}

async function call(token, method, url, { json, data, contentType } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(data ? { 'Content-Type': contentType } : {}),
    },
    body: json ? JSON.stringify(json) : data,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${method} ${url.replace(API, '').replace(UPLOAD, '')} -> ${res.status}: ${body.error?.message ?? text}`);
  }
  return body;
}

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

const token = await accessToken();
const edit = await call(token, 'POST', `${API}/edits`, { json: {} });
console.log(`Edit ${edit.id} abierto para ${PACKAGE}`);

try {
  if (checkOnly) {
    const tracks = await call(token, 'GET', `${API}/edits/${edit.id}/tracks`);
    for (const t of tracks.tracks ?? []) {
      const releases = (t.releases ?? []).map((r) => `${r.name ?? '-'} [${(r.versionCodes ?? []).join(',')}] ${r.status}`);
      console.log(`  ${t.track}: ${releases.join(' | ') || '(vacia)'}`);
    }
    console.log('Acceso correcto.');
  } else {
    const size = (statSync(aab).size / 1024 / 1024).toFixed(1);
    console.log(`Subiendo ${aab} (${size} MB)...`);
    const bundle = await call(token, 'POST', `${UPLOAD}/edits/${edit.id}/bundles?uploadType=media`, {
      data: readFileSync(aab),
      contentType: 'application/octet-stream',
    });
    console.log(`Bundle subido: versionCode ${bundle.versionCode}`);

    const pubspec = readFileSync(join(root, 'pubspec.yaml'), 'utf8');
    const name = /^version:\s*([^\s+]+)/m.exec(pubspec)?.[1] ?? String(bundle.versionCode);
    await call(token, 'PUT', `${API}/edits/${edit.id}/tracks/${track}`, {
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
  }
  if (checkOnly) {
    await call(token, 'DELETE', `${API}/edits/${edit.id}`);
  } else {
    const done = await call(token, 'POST', `${API}/edits/${edit.id}:commit`);
    console.log(`Publicado (edit ${done.id}).`);
  }
} catch (error) {
  await call(token, 'DELETE', `${API}/edits/${edit.id}`).catch(() => {});
  console.error(error.message);
  process.exit(1);
}
