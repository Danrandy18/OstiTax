import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const dir = new URL('../docs/ak-deductions', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1',
);
const extraDir = new URL('../docs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function parse(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const tbody = html.match(/hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbody) return null;
  const data = {};
  for (const tr of tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const label = tr.match(/rechnerLinks">([\s\S]*?)<\/td>/)?.[1]?.replace(/\s+/g, ' ').trim();
    const vals = [...tr.matchAll(/rechnerRechts">\s*([\d.]+),(\d{2})/g)].map(
      (m) => parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`),
    );
    if (label && vals.length) data[label] = vals;
  }
  return data;
}

const files = [
  ...readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f)),
  path.join(extraDir, 'ak-live-3000.html'),
];

for (const filePath of files.sort()) {
  const file = path.basename(filePath);
  const d = parse(filePath);
  if (!d) continue;
  console.log(`\n${file.replace('.html', '')}`);
  console.log(
    `  laufend: SV ${d['Sozialversicherung'][0]} | LS ${d['Lohnsteuer'][0]} | Net ${d['Netto'][0]}`,
  );
  console.log(
    `  13th:    SV ${d['Sozialversicherung'][1]} | LS ${d['Lohnsteuer'][1]} | Net ${d['Netto'][1]}`,
  );
  console.log(
    `  14th:    SV ${d['Sozialversicherung'][2]} | LS ${d['Lohnsteuer'][2]} | Net ${d['Netto'][2]}`,
  );
}
