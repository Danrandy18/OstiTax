#!/usr/bin/env node

function parse(html) {
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

async function fetchCase(params) {
  const body = new URLSearchParams({
    arbeitsverhaeltnis: '1',
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
    ...params,
  }).toString();
  const res = await fetch('https://bruttonetto.arbeiterkammer.at/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return parse(await res.text());
}

console.log('=== HIGH BRUTTO (55% probe) ===');
for (const gross of [10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 65000, 70000, 75000, 80000, 84500, 85000, 90000, 100000]) {
  const d = await fetchCase({ brutto: `${gross},00` });
  console.log(
    JSON.stringify({
      gross,
      ls: d?.['Lohnsteuer']?.[0],
      sv: d?.['Sozialversicherung']?.[0],
      net: d?.Netto?.[0],
    }),
  );
}

console.log('=== KFZ PARAM PROBE ===');
const kfzParams = [
  { sachbezugKFZ: '1', sachbezug: '0,00' },
  { sachbezugKFZ: '1', sachbezug: '600,00' },
  { sachbezugKFZ: '1', sachbezug: '720,00' },
  { sachbezugKFZ: '1', sachbezugPKW: '40000,00' },
  { sachbezugKFZ: '1', anschaffungswert: '40000,00' },
  { sachbezugKFZ: '1', kfzAnschaffungswert: '40000,00' },
  { sachbezugKFZ: '1', pkwAnschaffungswert: '40000,00', pkwCo2: '100', pkwErstzulassung: '2024' },
];
for (const extra of kfzParams) {
  const d = await fetchCase({ brutto: '3000,00', ...extra });
  console.log(
    JSON.stringify({
      params: extra,
      sv: d?.['Sozialversicherung']?.[0],
      ls: d?.['Lohnsteuer']?.[0],
      net: d?.Netto?.[0],
    }),
  );
}
