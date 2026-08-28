import { readFileSync } from 'fs';
import { AustrianTaxEngine } from '../dist/calc/tax-engine/austrian-tax.engine.js';
import { centsToEuros, eurosToCents } from '../dist/calc/tax-engine/money.util.js';

function parseAk(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const tbody = html.match(/hidden-xs[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbody) throw new Error(`No table in ${filePath}`);

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

function compare(gross, akFile) {
  const engine = new AustrianTaxEngine();
  const result = engine.calculate({
    employmentType: 'employee',
    grossAmount: eurosToCents(gross),
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
    commuteDaysPerMonth: 'from_4_to_7',
  });

  const ak = parseAk(akFile);
  const sections = [
    ['Bezug laufend', 'recurring', 0],
    ['13. Bezug', 'thirteenth', 1],
    ['14. Bezug', 'fourteenth', 2],
    ['Jahresbezug', 'annual', 3],
  ];

  console.log(`\n=== ${gross} EUR/mes — AK en vivo vs nuestro motor ===`);
  let ok = true;

  for (const [label, key, idx] of sections) {
    const ours = result[key];
    const fields = [
      ['Sozialversicherung', ours.socialInsurance],
      ['Lohnsteuer', ours.incomeTax],
      ['Netto', ours.net],
    ];

    for (const [fieldName, cents] of fields) {
      const akVal = ak[fieldName]?.[idx];
      const ourVal = centsToEuros(cents);
      const diff = Math.abs(akVal - ourVal);
      const match = diff <= 0.01 ? 'OK' : 'DIFF';
      if (match === 'DIFF') ok = false;
      console.log(
        `  ${label} ${fieldName}: AK ${akVal?.toFixed(2)} | Nos ${ourVal.toFixed(2)} | ${match}`,
      );
    }
  }

  return ok;
}

const allOk = [
  compare(3000, new URL('../docs/ak-live-3000.html', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
  compare(1800, new URL('../docs/ak-live-1800.html', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
].every(Boolean);

console.log(`\nResultado global: ${allOk ? 'COINCIDE con AK (±0,01 €)' : 'HAY DIFERENCIAS'}`);
process.exit(allOk ? 0 : 1);
