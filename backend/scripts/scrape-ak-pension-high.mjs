#!/usr/bin/env node

const base = {
  arbeitsverhaeltnis: '3',
  bundesland: '0',
  alleinverdienerabsetzbetrag: '0',
  familienBonus: '0',
  kinder17: '0',
  kinder18: '0',
  wegstrecke: '0,00',
  verkehrsmittel: '1',
  pendeltage: '3',
  submitAction: 'submit',
};

function parse(html) {
  const tbody = html.match(
    /esraBnRechnerResultTable hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/,
  );
  if (!tbody) {
    return null;
  }

  const data = {};
  for (const tr of tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const labelMatch = tr.match(/rechnerLinks">([\s\S]*?)<\/td>/);
    const label = labelMatch?.[1]?.replace(/\s+/g, ' ').trim();
    const vals = [...tr.matchAll(/rechnerRechts">\s*([\d.]+),(\d{2})/g)].map(
      (m) => parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`),
    );
    if (label && vals.length > 0) {
      data[label] = vals;
    }
  }
  return data;
}

async function fetchGross(gross) {
  const body = new URLSearchParams({
    ...base,
    brutto: `${gross},00`,
  }).toString();
  const res = await fetch('https://bruttonetto.arbeiterkammer.at/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return parse(await res.text());
}

for (const gross of [1200, 1500, 1800, 2000, 2500, 3000, 3500]) {
  const data = await fetchGross(gross);
  if (!data) {
    console.log(JSON.stringify({ gross, error: 'parse failed' }));
    continue;
  }

  console.log(
    JSON.stringify({
      gross,
      recurring: {
        gross: data.Brutto?.[0],
        socialInsurance: data['Sozialversicherung']?.[0],
        incomeTax: data['Lohnsteuer']?.[0],
        net: data.Netto?.[0],
      },
      thirteenth: {
        incomeTax: data['Lohnsteuer']?.[1],
      },
    }),
  );
}
