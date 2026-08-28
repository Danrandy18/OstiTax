import type { Cents } from './money.util';

export enum EmploymentType {
  EMPLOYEE = 'employee',
  APPRENTICE = 'apprentice',
  PENSIONER = 'pensioner',
}

export enum IncomePeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum AustrianState {
  WIEN = 'wien',
  NIEDER_OESTERREICH = 'niederoesterreich',
  OBER_OESTERREICH = 'oberoesterreich',
  BURGENLAND = 'burgenland',
  SALZBURG = 'salzburg',
  STEIERMARK = 'steiermark',
  KAERNTEN = 'kaernten',
  TIROL = 'tirol',
  VORARLBERG = 'vorarlberg',
}

export enum FamilyBonusType {
  NONE = 'none',
  FULL = 'full',
  SHARED = 'shared',
}

export enum CommuteDaysPerMonth {
  LESS_THAN_4 = 'less_than_4',
  FROM_4_TO_7 = 'from_4_to_7',
  FROM_8_TO_10 = 'from_8_to_10',
  MORE_THAN_10 = 'more_than_10',
}

import type { CompanyCarBenefitInput } from './company-car-benefit.calculator';

export interface CalculationInput {
  employmentType: EmploymentType;
  grossAmount: Cents;
  incomePeriod: IncomePeriod;
  state: AustrianState;
  soleEarnerDeduction: boolean;
  familyBonus: FamilyBonusType;
  childrenUnder18: number;
  childrenOver18WithFamilyAllowance: number;
  benefitInKindMonthly: Cents;
  benefitInKindFromCompanyCar: boolean;
  /** Calcula Sachbezug KFZ y lo suma a benefitInKindMonthly (laufend). */
  companyCar?: CompanyCarBenefitInput;
  taxFreeAllowanceMonthly: Cents;
  commuteOneWayKm: number;
  publicTransportReasonable: boolean;
  commuteDaysPerMonth: CommuteDaysPerMonth;
}

export interface PaymentBreakdown {
  gross: Cents;
  socialInsurance: Cents;
  incomeTax: Cents;
  net: Cents;
}

export interface CalculationResult {
  tableYear: number;
  recurring: PaymentBreakdown;
  thirteenth: PaymentBreakdown;
  fourteenth: PaymentBreakdown;
  annual: PaymentBreakdown;
}
