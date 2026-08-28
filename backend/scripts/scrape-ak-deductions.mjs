#!/usr/bin/env node
/** Scrape casos de prueba desde bruttonetto.arbeiterkammer.at */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const OUT = new URL('../docs/ak-deductions', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1',
);
mkdirSync(OUT, { recursive: true });

const cases = [
  {
    id: '3000-alleinverdiener',
    data: {
      arbeitsverhaeltnis: '1',
      brutto: '3000,00',
      bundesland: '0',
      alleinverdienerabsetzbetrag: '1',
      familienBonus: '0',
      kinder17: '0',
      kinder18: '0',
      wegstrecke: '0,00',
      verkehrsmittel: '1',
      pendeltage: '3',
      submitAction: 'submit',
    },
  },
  {
    id: '3000-familienbonus-full-1child',
    data: {
      arbeitsverhaeltnis: '1',
      brutto: '3000,00',
      bundesland: '0',
      alleinverdienerabsetzbetrag: '0',
      familienBonus: '1',
      kinder17: '1',
      kinder18: '0',
      wegstrecke: '0,00',
      verkehrsmittel: '1',
      pendeltage: '3',
      submitAction: 'submit',
    },
  },
  {
    id: '3000-pendler-25km-no-public',
    data: {
      arbeitsverhaeltnis: '1',
      brutto: '3000,00',
      bundesland: '0',
      alleinverdienerabsetzbetrag: '0',
      familienBonus: '0',
      kinder17: '0',
      kinder18: '0',
      wegstrecke: '25,00',
      verkehrsmittel: '0',
      pendeltage: '3',
      submitAction: 'submit',
    },
  },
  {
    id: '3000-pendler-25km-public',
    data: {
      arbeitsverhaeltnis: '1',
      brutto: '3000,00',
      bundesland: '0',
      alleinverdienerabsetzbetrag: '0',
      familienBonus: '0',
      kinder17: '0',
      kinder18: '0',
      wegstrecke: '25,00',
      verkehrsmittel: '1',
      pendeltage: '3',
      submitAction: 'submit',
    },
  },
  {
    id: '3000-combined',
    data: {
      arbeitsverhaeltnis: '1',
      brutto: '3000,00',
      bundesland: '0',
      alleinverdienerabsetzbetrag: '1',
      familienBonus: '1',
      kinder17: '2',
      kinder18: '0',
      wegstrecke: '30,00',
      verkehrsmittel: '0',
      pendeltage: '3',
      submitAction: 'submit',
    },
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
  console.log(`saved ${testCase.id}`);
}
