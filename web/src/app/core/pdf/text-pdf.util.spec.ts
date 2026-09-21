import type { CalculateRequest, CalculateResponse } from '../models/api.models';
import { buildTips, PDF_EXTRA } from './pdf-extra';
import { buildAppliedLines, buildOfficialCalculationPdf } from './text-pdf.util';

const request: CalculateRequest = {
  employmentType: 'employee',
  grossAmount: 3000,
  incomePeriod: 'monthly',
  state: 'wien',
  soleEarnerDeduction: true,
  familyBonus: 'full',
  childrenUnder18: 2,
  childrenOver18WithFamilyAllowance: 0,
  benefitInKindMonthly: 0,
  benefitInKindFromCompanyCar: false,
  taxFreeAllowanceMonthly: 0,
  commuteOneWayKm: 30,
  publicTransportReasonable: false,
  commuteDaysPerMonth: 'from_8_to_10',
};

const pb = (gross: number, si: number, tax: number, net: number) => ({
  gross,
  socialInsurance: si,
  incomeTax: tax,
  net,
});
const response: CalculateResponse = {
  tableYear: 2026,
  recurring: pb(3000, 549.6, 281.57, 2168.83),
  thirteenth: pb(3000, 0, 120, 2880),
  fourteenth: pb(3000, 0, 120, 2880),
  annual: pb(42000, 6595.2, 3378.84, 32025.96),
};

async function text(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(blob);
  });
}

describe('PDF por niveles', () => {
  it('el PDF basico tiene una sola pagina y el aviso de Pro sin enlace ni precio', async () => {
    const raw = await text(buildOfficialCalculationPdf(request, response, 'de', 'basic'));
    expect(raw).toContain('/Count 1');
    expect(raw).not.toMatch(/https?:/);
    expect(raw).not.toContain('€/Monat');
  });

  it('el PDF Pro tiene varias paginas', async () => {
    const raw = await text(buildOfficialCalculationPdf(request, response, 'de', 'pro'));
    const count = Number(/\/Count (\d+)/.exec(raw)?.[1]);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('las tres lenguas del PDF tienen las mismas claves y ninguna promete "listo para presentar"', () => {
    const keys = Object.keys(PDF_EXTRA.de).sort();
    expect(Object.keys(PDF_EXTRA.en).sort()).toEqual(keys);
    expect(Object.keys(PDF_EXTRA.es).sort()).toEqual(keys);
    expect(PDF_EXTRA.de.explain.length).toBe(PDF_EXTRA.es.explain.length);
    expect(PDF_EXTRA.de.guide.length).toBe(PDF_EXTRA.en.guide.length);
  });

  it('lista lo aplicado y los consejos segun los datos', () => {
    const applied = buildAppliedLines(request, PDF_EXTRA.es);
    expect(applied.length).toBeGreaterThanOrEqual(3);
    expect(applied.join(' ')).not.toContain('{');
    expect(buildTips(request, PDF_EXTRA.es).length).toBeGreaterThan(0);
  });
});
