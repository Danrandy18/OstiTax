#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const OUT = new URL('../docs/ak-wien', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const base = {
  arbeitsverhaeltnis: '1',
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

for (const gross of [1800, 2500, 3000, 3500, 4000, 5000, 6000]) {
  const body = new URLSearchParams({
    ...base,
    brutto: `${gross},00`,
  }).toString();
  const res = await fetch('https://bruttonetto.arbeiterkammer.at/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  writeFileSync(path.join(OUT, `${gross}.html`), await res.text());
  console.log('saved', gross);
}
