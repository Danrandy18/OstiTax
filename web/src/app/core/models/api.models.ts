export type EmploymentType = 'employee' | 'apprentice' | 'pensioner';
export type IncomePeriod = 'monthly' | 'yearly';
export type AustrianState =
  | 'wien'
  | 'niederoesterreich'
  | 'oberoesterreich'
  | 'burgenland'
  | 'salzburg'
  | 'steiermark'
  | 'kaernten'
  | 'tirol'
  | 'vorarlberg';
export type FamilyBonusType = 'none' | 'full' | 'shared';
export type CommuteDaysPerMonth =
  | 'less_than_4'
  | 'from_4_to_7'
  | 'from_8_to_10'
  | 'more_than_10';
export type UserPlan = 'free' | 'pro';

export interface CompanyCarInput {
  acquisitionCost: number;
  co2GramsPerKm: number;
  firstRegistrationYear: number;
  halfBenefit?: boolean;
}

export interface CalculateRequest {
  employmentType: EmploymentType;
  grossAmount: number;
  incomePeriod: IncomePeriod;
  state: AustrianState;
  soleEarnerDeduction: boolean;
  familyBonus: FamilyBonusType;
  childrenUnder18: number;
  childrenOver18WithFamilyAllowance: number;
  benefitInKindMonthly: number;
  benefitInKindFromCompanyCar: boolean;
  companyCar?: CompanyCarInput;
  taxFreeAllowanceMonthly: number;
  commuteOneWayKm: number;
  publicTransportReasonable: boolean;
  commuteDaysPerMonth: CommuteDaysPerMonth;
}

export interface PaymentBreakdown {
  gross: number;
  socialInsurance: number;
  incomeTax: number;
  net: number;
}

export interface UsageInfo {
  plan: UserPlan;
  isPro: boolean;
  freeAttemptsRemaining: number;
}

export interface CalculateResponse {
  tableYear: number;
  recurring: PaymentBreakdown;
  thirteenth: PaymentBreakdown;
  fourteenth: PaymentBreakdown;
  annual: PaymentBreakdown;
  usage?: UsageInfo;
}

export interface UserStatus {
  deviceId: string;
  plan: UserPlan;
  freeAttemptsRemaining: number;
  isPro: boolean;
  subscriptionProvider: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
}

export interface StripeCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface PaypalSubscriptionResponse {
  approvalUrl: string;
  subscriptionId: string;
}

export interface PaymentRequiredError {
  statusCode: 402;
  code: 'PAYMENT_REQUIRED';
  message: string;
  freeAttemptsRemaining: number;
  plan: UserPlan;
}
