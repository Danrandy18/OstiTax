#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const dir = new URL('../docs/ak-extra-fields', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1',
);

function parse(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const tbody = html.match(/hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbody) return null;
  const data = {};
  for (const tr of tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const label = tr
      .match(/rechnerLinks">([\s\S]*?)<\/td>/)?.[1]
      ?.replace(/\s+/g, ' ')
      .trim();
    const vals = [...tr.matchAll(/rechnerRechts">\s*([\d.]+),(\d{2})/g)].map(
      (m) => parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`),
    );
    if (label && vals.length) data[label] = vals;
  }
  return data;
}

for (const f of readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
  const d = parse(path.join(dir, f));
  if (!d || !d.Sozialversicherung) {
    console.log(f, 'NO DATA');
    continue;
  }
  console.log(f.replace('.html', ''));
  console.log(
    `  SV ${d.Sozialversicherung[0]} | LS ${d.Lohnsteuer[0]} | Net ${d.Netto[0]}`,
  );
  console.log(
    `  13 SV ${d.Sozialversicherung[1]} | LS ${d.Lohnsteuer[1]} | Net ${d.Netto[1]}`,
  );
  console.log(
    `  14 SV ${d.Sozialversicherung[2]} | LS ${d.Lohnsteuer[2]} | Net ${d.Netto[2]}`,
  );
}
