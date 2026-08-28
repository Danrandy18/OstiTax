import { calculateCompanyCarBenefitMonthly } from './tax-engine/company-car-benefit.calculator';
import { centsToEuros } from './tax-engine/money.util';

describe('calculateCompanyCarBenefitMonthly', () => {
  it('returns 0 for electric vehicles', () => {
    expect(
      centsToEuros(
        calculateCompanyCarBenefitMonthly({
          acquisitionCost: 40000,
          co2GramsPerKm: 0,
          firstRegistrationYear: 2026,
        }),
      ),
    ).toBe(0);
  });

  it('caps low CO2 benefit at 720 €/month', () => {
    expect(
      centsToEuros(
        calculateCompanyCarBenefitMonthly({
          acquisitionCost: 100000,
          co2GramsPerKm: 100,
          firstRegistrationYear: 2026,
        }),
      ),
    ).toBe(720);
  });

  it('uses 2% rate above CO2 threshold', () => {
    expect(
      centsToEuros(
        calculateCompanyCarBenefitMonthly({
          acquisitionCost: 30000,
          co2GramsPerKm: 150,
          firstRegistrationYear: 2024,
        }),
      ),
    ).toBe(600);
  });
});
