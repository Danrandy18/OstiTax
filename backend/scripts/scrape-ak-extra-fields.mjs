#!/usr/bin/env node
/** Scrape AK cases: Sachbezug, Freibetrag, KFZ, Lehrling, Pensionist */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const OUT = new URL('../docs/ak-extra-fields', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1',
);
mkdirSync(OUT, { recursive: true });

const base = {
  brutto: '3000,00',
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
};

const cases = [
  {
    id: '3000-sachbezug-200',
    data: { ...base, arbeitsverhaeltnis: '1', sachbezug: '200,00' },
  },
  {
    id: '3000-freibetrag-100',
    data: { ...base, arbeitsverhaeltnis: '1', freibetrag: '100,00' },
  },
  {
    id: '3000-sachbezug-200-freibetrag-100',
    data: {
      ...base,
      arbeitsverhaeltnis: '1',
      sachbezug: '200,00',
      freibetrag: '100,00',
    },
  },
  {
    id: '3000-kfz-only',
    data: { ...base, arbeitsverhaeltnis: '1', sachbezugKFZ: '1' },
  },
  {
    id: '3000-sachbezug-200-kfz',
    data: {
      ...base,
      arbeitsverhaeltnis: '1',
      sachbezug: '200,00',
      sachbezugKFZ: '1',
    },
  },
  {
    id: '1800-lehrling',
    data: { ...base, arbeitsverhaeltnis: '2', brutto: '1800,00' },
  },
  {
    id: '2500-pensionist',
    data: { ...base, arbeitsverhaeltnis: '3', brutto: '2500,00' },
  },
];

for (const testCase of cases) {
  const body = new URLSearchParams(testCase.data).toString();
  const res = await fetch('https://bruttonetto.arbeiterkammer.at/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const html = await res.text();
  writeFileSync(path.join(OUT, `${testCase.id}.html`), html);
  console.log(`saved ${testCase.id} (${html.length} bytes)`);
}
