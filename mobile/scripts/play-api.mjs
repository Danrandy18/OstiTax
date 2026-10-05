// Cliente minimo de la Google Play Android Developer API con la cuenta de servicio
// (android/play-service-account.json, ignorada por git). Sin dependencias: el JWT se firma con
// node:crypto.

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PACKAGE = 'at.ostitax.app';
export const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}`;
export const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE}`;

export async function accessToken(keyFile = join(ROOT, 'android', 'play-service-account.json')) {
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

export function client(token) {
  return async function call(method, url, { json, data, contentType } = {}) {
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
      const path = url.replace(API, '').replace(UPLOAD, '');
      throw new Error(`${method} ${path} -> ${res.status}: ${body.error?.message ?? text}`);
    }
    return body;
  };
}

/** Abre un "edit", ejecuta `work` y lo confirma; si algo falla, lo descarta. */
export async function withEdit(work, { commit = true } = {}) {
  const call = client(await accessToken());
  const edit = await call('POST', `${API}/edits`, { json: {} });
  try {
    const result = await work(call, edit.id);
    if (commit) {
      await call('POST', `${API}/edits/${edit.id}:commit`);
    } else {
      await call('DELETE', `${API}/edits/${edit.id}`);
    }
    return result;
  } catch (error) {
    await call('DELETE', `${API}/edits/${edit.id}`).catch(() => {});
    throw error;
  }
}
