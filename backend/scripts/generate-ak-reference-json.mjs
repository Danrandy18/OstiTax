import { readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';

function parse(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const tbody = html.match(/hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbody) throw new Error(`No table: ${filePath}`);
  const data = {};
  for (const tr of tbody[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
    const label = tr.match(/rechnerLinks">([\s\S]*?)<\/td>/)?.[1]?.replace(/\s+/g, ' ').trim();
    const vals = [...tr.matchAll(/rechnerRechts[^"]*">\s*([\d.]+),(\d{2})/g)].map(
      (m) => parseFloat(`${m[1].replace(/\./g, '')}.${m[2]}`),
    );
    if (label && vals.length >= 4) data[label] = vals;
  }
  return data;
}

function row(data, idx) {
  return {
    gross: data.Brutto[idx],
    socialInsurance: data['Sozialversicherung'][idx],
    incomeTax: data['Lohnsteuer'][idx],
    net: data['Netto'][idx],
  };
}

const wienDir = new URL('../docs/ak-wien', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const baseline = [];

for (const file of readdirSync(wienDir).filter((f) => f.endsWith('.html')).sort((a, b) => +a - +b)) {
  const gross = parseInt(file, 10);
  const d = parse(path.join(wienDir, file));
  baseline.push({
    id: `ak-employee-wien-${gross}-basic`,
    source: 'https://bruttonetto.arbeiterkammer.at',
    stand: '2026-01',
    input: {
      employmentType: 'employee',
      grossAmount: gross,
      incomePeriod: 'monthly',
      state: 'wien',
      soleEarnerDeduction: false,
      familyBonus: 'none',
      commuteOneWayKm: 0,
      publicTransportReasonable: true,
      commuteDaysPerMonth: 'more_than_10',
    },
    expected: {
      recurring: row(d, 0),
      thirteenth: row(d, 1),
      fourteenth: row(d, 2),
      annual: row(d, 3),
    },
  });
}

const dedDir = new URL('../docs/ak-deductions', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const deductionCases = [
  {
    file: '3000-av-kinder',
    id: 'ak-employee-wien-3000-alleinverdiener-1child',
    input: {
      grossAmount: 3000,
      soleEarnerDeduction: true,
      childrenUnder18: 1,
    },
  },
  {
    file: '3000-familienbonus-full-1child',
    id: 'ak-employee-wien-3000-familienbonus-full-1child',
    input: {
      grossAmount: 3000,
      familyBonus: 'full',
      childrenUnder18: 1,
    },
  },
  {
    file: '3000-fb-shared',
    id: 'ak-employee-wien-3000-familienbonus-shared-1child',
    input: {
      grossAmount: 3000,
      familyBonus: 'shared',
      childrenUnder18: 1,
    },
  },
  {
    file: '3000-pendler-25km-no-public',
    id: 'ak-employee-wien-3000-pendler-25km-no-public',
    input: {
      grossAmount: 3000,
      commuteOneWayKm: 25,
      publicTransportReasonable: false,
      commuteDaysPerMonth: 'more_than_10',
    },
  },
  {
    file: '3000-pendler-25km-public',
    id: 'ak-employee-wien-3000-pendler-25km-public',
    input: {
      grossAmount: 3000,
      commuteOneWayKm: 25,
      publicTransportReasonable: true,
      commuteDaysPerMonth: 'more_than_10',
    },
  },
  {
    file: '3000-combined',
    id: 'ak-employee-wien-3000-combined-deductions',
    input: {
      grossAmount: 3000,
      soleEarnerDeduction: true,
      familyBonus: 'full',
      childrenUnder18: 2,
      commuteOneWayKm: 30,
      publicTransportReasonable: false,
      commuteDaysPerMonth: 'more_than_10',
    },
  },
].map(({ file, id, input }) => {
  const d = parse(path.join(dedDir, `${file}.html`));
  return {
    id,
    source: 'https://bruttonetto.arbeiterkammer.at',
    stand: '2026-01',
    input: {
      employmentType: 'employee',
      incomePeriod: 'monthly',
      state: 'wien',
      soleEarnerDeduction: false,
      familyBonus: 'none',
      childrenUnder18: 0,
      childrenOver18WithFamilyAllowance: 0,
      benefitInKindMonthly: 0,
      benefitInKindFromCompanyCar: false,
      taxFreeAllowanceMonthly: 0,
      commuteOneWayKm: 0,
      publicTransportReasonable: true,
      commuteDaysPerMonth: 'more_than_10',
      ...input,
    },
    expected: {
      recurring: row(d, 0),
      thirteenth: row(d, 1),
      fourteenth: row(d, 2),
      annual: row(d, 3),
    },
  };
});

writeFileSync(
  new URL('../src/calc/reference/ak-reference-cases.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
  `${JSON.stringify(baseline, null, 2)}\n`,
);
writeFileSync(
  new URL('../src/calc/reference/ak-deduction-reference-cases.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
  `${JSON.stringify(deductionCases, null, 2)}\n`,
);
console.log(`Updated ${baseline.length} baseline + ${deductionCases.length} deduction cases`);
