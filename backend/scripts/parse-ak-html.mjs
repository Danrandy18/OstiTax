import fs from 'fs';
import path from 'path';

const dir = new URL('../docs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function parse(file) {
  const html = fs.readFileSync(path.join(dir, file), 'utf8');
  const tbody = html.match(
    /esraBnRechnerResultTable hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
  );
  if (!tbody) return null;

  const data = {};
  for (const tr of tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const labelMatch = tr.match(/rechnerLinks">([\s\S]*?)<\/td>/);
    const label = labelMatch?.[1]?.replace(/\s+/g, ' ').trim();
    const vals = [...tr.matchAll(/rechnerRechts">\s*([\d.]+),(\d{2})/g)].map(
      (m) => parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`),
    );
    if (label && vals.length > 0) data[label] = vals;
  }
  return data;
}

for (const file of fs
  .readdirSync(dir)
  .filter((f) => f.startsWith('ak-') && f.endsWith('.html'))
  .sort()) {
  const data = parse(file);
  if (!data?.Brutto) continue;
  const brutto = data.Brutto[0];
  const sv = data['Sozialversicherung']?.[0];
  const ls = data['Lohnsteuer']?.[0];
  if (sv === undefined || ls === undefined) continue;
  console.log(
    `${file.replace('.html', '')}\tbrutto=${brutto}\tsv=${sv}\trate=${((sv / brutto) * 100).toFixed(2)}%\tbmg=${(brutto - sv).toFixed(2)}\tls=${ls}`,
  );
}
