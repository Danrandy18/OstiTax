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
    alleinverdienerabsetzbetrag: '0',
    familienBonus: '0',
    kinder17: '0',
    kinder18: '0',
    wegstrecke: '0,00',
    verkehrsmittel: '1',
    pendeltage: '3',
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

console.log('=== PENSION WIEN ===');
for (const gross of [3000, 3100, 3200, 3300, 3400, 3500, 3600, 4000, 6240, 6500]) {
  const d = await fetchCase({
    arbeitsverhaeltnis: '3',
    bundesland: '0',
    brutto: `${gross},00`,
  });
  console.log(
    JSON.stringify({
      gross,
      rec: {
        sv: d['Sozialversicherung']?.[0],
        ls: d['Lohnsteuer']?.[0],
        net: d.Netto?.[0],
      },
      t13: { sv: d['Sozialversicherung']?.[1], ls: d['Lohnsteuer']?.[1] },
      t14: { sv: d['Sozialversicherung']?.[2], ls: d['Lohnsteuer']?.[2] },
    }),
  );
}

console.log('=== EMPLOYEE WIEN HIGH (13/14 SV) ===');
for (const gross of [7000, 7500, 8000, 9000, 10000]) {
  const d = await fetchCase({
    arbeitsverhaeltnis: '1',
    bundesland: '0',
    brutto: `${gross},00`,
  });
  console.log(
    JSON.stringify({
      gross,
      rec: { sv: d['Sozialversicherung']?.[0], ls: d['Lohnsteuer']?.[0] },
      t13: { sv: d['Sozialversicherung']?.[1], ls: d['Lohnsteuer']?.[1] },
      t14: { sv: d['Sozialversicherung']?.[2], ls: d['Lohnsteuer']?.[2] },
    }),
  );
}
