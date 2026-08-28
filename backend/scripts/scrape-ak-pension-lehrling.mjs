#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';

const OUT = './docs/ak-extra-fields';
mkdirSync(OUT, { recursive: true });

const cases = [
  { id: 'p2000', brutto: '2000,00', av: '3' },
  { id: 'p3000', brutto: '3000,00', av: '3' },
  { id: 'p1500', brutto: '1500,00', av: '3' },
  { id: 'l1200', brutto: '1200,00', av: '2' },
  { id: 'l3000', brutto: '3000,00', av: '2' },
];

function parseHtml(html) {
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

for (const c of cases) {
  const data = new URLSearchParams({
    arbeitsverhaeltnis: c.av,
    brutto: c.brutto,
    bundesland: '0',
    alleinverdienerabsetzbetrag: '0',
    familienBonus: '0',
    kinder17: '0',
    kinder18: '0',
    wegstrecke: '0,00',
    verkehrsmittel: '1',
    pendeltage: '3',
    sachbezug: '0,00',
    sachbezugKFZ: '0',
    freibetrag: '0,00',
    submitAction: 'submit',
  });
  const res = await fetch('https://bruttonetto.arbeiterkammer.at/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: data,
  });
  const html = await res.text();
  writeFileSync(path.join(OUT, `${c.id}.html`), html);
  const d = parseHtml(html);
  console.log(
    c.id,
    'SV',
    d?.Sozialversicherung?.[0],
    'LS',
    d?.Lohnsteuer?.[0],
    'Net',
    d?.Netto?.[0],
    '|13 LS',
    d?.Lohnsteuer?.[1],
    '|14 LS',
    d?.Lohnsteuer?.[2],
  );
}
