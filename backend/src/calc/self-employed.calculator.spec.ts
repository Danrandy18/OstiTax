import { AustrianTaxEngine } from './tax-engine/austrian-tax.engine';
import { eurosToCents } from './tax-engine/money.util';
import {
  annualTariffTax,
  calculateSelfEmployed,
  SelfEmployedKind,
  type SelfEmployedInput,
} from './tax-engine/self-employed.calculator';
import {
  AustrianState,
  CommuteDaysPerMonth,
  EmploymentType,
  FamilyBonusType,
  IncomePeriod,
} from './tax-engine/types';

/**
 * Casos calculados a mano con los valores oficiales 2026: SVS (PV 18,5 %, KV 6,8 %,
 * Selbständigenvorsorge 1,53 %, UV 12,96 €/mes, base 551,10–8.085 €/mes), tarifa BMF 2026
 * (13.539 / 21.992 / 36.458 / 70.365 / 104.859 / 1.000.000) y Grundfreibetrag del 15 % sobre
 * los primeros 33.000 €. Cada paso esta en el comentario del caso para poder revisarlo.
 */

const base: SelfEmployedInput = {
  annualProfit: 0,
  kind: SelfEmployedKind.TRADE,
  firstYears: false,
  soleEarnerDeduction: false,
  familyBonus: FamilyBonusType.NONE,
  childrenUnder18: 0,
  childrenOver18WithFamilyAllowance: 0,
};

const eur = (v: number) => eurosToCents(v);

describe('Autonomos (Selbstständige) 2026', () => {
  it('tarifa anual de la Einkommensteuer', () => {
    expect(annualTariffTax(eur(13539))).toBe(0);
    expect(annualTariffTax(eur(21992))).toBe(eur(1690.6));
    // 1.690,60 + 30 % × (24.745,61 − 21.992)
    expect(annualTariffTax(eur(24745.61))).toBe(eur(2516.68));
  });

  it('40.000 € de beneficio, Gewerbe: cotizaciones, Gewinnfreibetrag e impuesto', () => {
    const r = calculateSelfEmployed({ ...base, annualProfit: eur(40000) });
    // SVS: 7.400 + 2.720 + 612 + 155,52 = 10.887,52
    expect(r.pension).toBe(eur(7400));
    expect(r.health).toBe(eur(2720));
    expect(r.provision).toBe(eur(612));
    expect(r.accident).toBe(eur(155.52));
    expect(r.socialInsurance).toBe(eur(10887.52));
    // 15 % de 29.112,48 = 4.366,87 → base imponible 24.745,61
    expect(r.profitAfterSocialInsurance).toBe(eur(29112.48));
    expect(r.gewinnfreibetrag).toBe(eur(4366.87));
    expect(r.taxableIncome).toBe(eur(24745.61));
    expect(r.incomeTax).toBe(eur(2516.68));
    expect(r.net).toBe(eur(26595.8));
    expect(r.quarterlyTaxPrepayment).toBe(eur(629.17));
    expect(r.quarterlySocialInsurance).toBe(eur(2721.88));
  });

  it('beneficio bajo, Gewerbe: cotiza sobre la base minima', () => {
    const r = calculateSelfEmployed({ ...base, annualProfit: eur(5000) });
    // Base minima 6.613,20: 1.223,44 + 449,70 + 101,18 + 155,52
    expect(r.contributionBase).toBe(eur(6613.2));
    expect(r.minimumBaseApplied).toBe(true);
    expect(r.socialInsurance).toBe(eur(1929.84));
    expect(r.incomeTax).toBe(0);
    expect(r.net).toBe(eur(3070.16));
  });

  it('Neue Selbständige por debajo de la Versicherungsgrenze: sin seguro obligatorio', () => {
    const r = calculateSelfEmployed({
      ...base,
      kind: SelfEmployedKind.NEW_SELF_EMPLOYED,
      annualProfit: eur(5000),
    });
    expect(r.insured).toBe(false);
    expect(r.socialInsurance).toBe(0);
    expect(r.gewinnfreibetrag).toBe(eur(750));
    expect(r.net).toBe(eur(5000));
  });

  it('Neue Selbständige por encima del limite cotizan igual que un Gewerbe', () => {
    const neu = calculateSelfEmployed({
      ...base,
      kind: SelfEmployedKind.NEW_SELF_EMPLOYED,
      annualProfit: eur(40000),
    });
    const trade = calculateSelfEmployed({ ...base, annualProfit: eur(40000) });
    expect(neu).toEqual(trade);
  });

  it('beneficio alto: base maxima y Gewinnfreibetrag tope de 4.950 €', () => {
    const r = calculateSelfEmployed({ ...base, annualProfit: eur(150000) });
    // Base 97.020: 17.948,70 + 6.597,36 + 1.484,41 + 155,52 = 26.185,99
    expect(r.maximumBaseApplied).toBe(true);
    expect(r.socialInsurance).toBe(eur(26185.99));
    expect(r.gewinnfreibetrag).toBe(eur(4950));
    // 118.864,01: 1.690,60 + 4.339,80 + 13.562,80 + 16.557,12 + 7.002,51
    expect(r.taxableIncome).toBe(eur(118864.01));
    expect(r.incomeTax).toBe(eur(43152.83));
    expect(r.net).toBe(eur(80661.18));
  });

  it('Familienbonus Plus y deduccion por unico perceptor reducen la cuota sin bajar de 0', () => {
    const withBonus = calculateSelfEmployed({
      ...base,
      annualProfit: eur(40000),
      familyBonus: FamilyBonusType.FULL,
      childrenUnder18: 1,
    });
    expect(withBonus.familyBonus).toBe(eur(2000.16));
    expect(withBonus.incomeTax).toBe(eur(516.52));

    const shared = calculateSelfEmployed({
      ...base,
      annualProfit: eur(40000),
      familyBonus: FamilyBonusType.SHARED,
      childrenUnder18: 1,
      childrenOver18WithFamilyAllowance: 1,
    });
    // (2.000,16 + 700,08) / 2
    expect(shared.familyBonus).toBe(eur(1350.12));

    const withSoleEarner = calculateSelfEmployed({
      ...base,
      annualProfit: eur(40000),
      familyBonus: FamilyBonusType.FULL,
      childrenUnder18: 1,
      soleEarnerDeduction: true,
    });
    expect(withSoleEarner.soleEarnerCredit).toBe(eur(612));
    expect(withSoleEarner.incomeTax).toBe(0);
  });

  it('primeros años: pago provisional sobre la base minima y diferencia estimada', () => {
    const r = calculateSelfEmployed({
      ...base,
      annualProfit: eur(40000),
      firstYears: true,
    });
    expect(r.provisionalSocialInsurance).toBe(eur(1929.84));
    expect(r.estimatedBackPayment).toBe(eur(8957.68));
    expect(r.quarterlySocialInsurance).toBe(eur(482.46));
    // El coste real del año no cambia: solo cuando se paga.
    expect(r.socialInsurance).toBe(eur(10887.52));
  });
});

describe('AustrianTaxEngine con autonomos', () => {
  const engine = new AustrianTaxEngine();
  const input = {
    employmentType: EmploymentType.SELF_EMPLOYED,
    grossAmount: eur(40000),
    incomePeriod: IncomePeriod.YEARLY,
    state: AustrianState.WIEN,
    soleEarnerDeduction: false,
    familyBonus: FamilyBonusType.NONE,
    childrenUnder18: 0,
    childrenOver18WithFamilyAllowance: 0,
    benefitInKindMonthly: 0,
    benefitInKindFromCompanyCar: false,
    taxFreeAllowanceMonthly: 0,
    commuteOneWayKm: 0,
    publicTransportReasonable: true,
    commuteDaysPerMonth: CommuteDaysPerMonth.FROM_4_TO_7,
  };

  it('sin 13./14. Bezug; la fila mensual es la media del año', () => {
    const r = engine.calculate(input);
    expect(r.annual.net).toBe(eur(26595.8));
    expect(r.recurring.net).toBe(eur(2216.32));
    expect(r.thirteenth.gross).toBe(0);
    expect(r.fourteenth.net).toBe(0);
    expect(r.selfEmployed?.gewinnfreibetrag).toBe(eur(4366.87));
  });

  it('beneficio mensual × 12 (no × 14)', () => {
    const r = engine.calculate({
      ...input,
      grossAmount: eur(3000),
      incomePeriod: IncomePeriod.MONTHLY,
    });
    expect(r.selfEmployed?.annualProfit).toBe(eur(36000));
  });

  it('el desplazamiento al trabajo no cambia nada (no hay Pendlerpauschale)', () => {
    const r = engine.calculate({
      ...input,
      commuteOneWayKm: 50,
      commuteDaysPerMonth: CommuteDaysPerMonth.MORE_THAN_10,
    });
    expect(r.annual.net).toBe(eur(26595.8));
  });
});
