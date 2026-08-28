import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  AustrianState,
  CalculateRequest,
  CalculateResponse,
  CommuteDaysPerMonth,
  CompanyCarInput,
  EmploymentType,
  FamilyBonusType,
  IncomePeriod,
  PaymentBreakdown,
} from '../../core/models/api.models';
import {
  CalculatorApiService,
  isPaymentRequiredError,
} from '../../core/services/calculator-api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SessionService } from '../../core/services/session.service';
import { PaymentModalComponent } from '../payment/payment-modal.component';
import { EurPipe, TranslatePipe } from '../../shared/pipes/app.pipes';
import { exportOfficialCalculationPdf } from '../../core/pdf/text-pdf.util';

type ResultTab = 'recurring' | 'thirteenth' | 'fourteenth' | 'annual';

const BMF_PENDLER_URL = 'https://www.bmf.gv.at/pendlerrechner';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [FormsModule, PaymentModalComponent, EurPipe, TranslatePipe],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  private readonly calculatorApi = inject(CalculatorApiService);
  readonly i18n = inject(I18nService);
  readonly session = inject(SessionService);
  readonly bmfPendlerUrl = BMF_PENDLER_URL;

  readonly form = signal<CalculateRequest>({
    employmentType: 'employee',
    grossAmount: 3000,
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
  });

  readonly result = signal<CalculateResponse | null>(null);
  readonly activeTab = signal<ResultTab>('recurring');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly paymentModalOpen = signal(false);

  readonly stateOptions = computed(() =>
    Object.entries(this.i18n.t().states).map(([value, label]) => ({
      value: value as AustrianState,
      label,
    })),
  );

  readonly grossLabel = computed(() =>
    this.form().incomePeriod === 'yearly'
      ? this.i18n.t().grossAmountYearly
      : this.i18n.t().grossAmountMonthly,
  );

  readonly showChildrenFields = computed(() => {
    const f = this.form();
    return (
      f.soleEarnerDeduction ||
      f.familyBonus !== 'none' ||
      f.childrenUnder18 > 0 ||
      f.childrenOver18WithFamilyAllowance > 0
    );
  });

  readonly canCalculate = computed(() => true);
  readonly commuteBlocked = computed(
    () => this.form().benefitInKindFromCompanyCar,
  );
  readonly showCompanyCarFields = computed(
    () => this.form().benefitInKindFromCompanyCar,
  );

  readonly activeBreakdown = computed<PaymentBreakdown | null>(() => {
    const data = this.result();
    if (!data) {
      return null;
    }
    return data[this.activeTab()];
  });

  readonly showAttemptsBadge = computed(() => {
    const status = this.session.status();
    return status && !status.isPro;
  });

  updateForm<K extends keyof CalculateRequest>(
    key: K,
    value: CalculateRequest[K],
  ): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateNumber(key: keyof CalculateRequest, raw: string | number): void {
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    this.updateForm(key, (Number.isFinite(parsed) ? parsed : 0) as never);
  }

  setEmploymentType(type: EmploymentType): void {
    this.updateForm('employmentType', type);
    this.error.set(null);
  }

  setIncomePeriod(period: IncomePeriod): void {
    this.updateForm('incomePeriod', period);
  }

  setFamilyBonus(value: FamilyBonusType): void {
    this.updateForm('familyBonus', value);
  }

  setCommuteDays(value: CommuteDaysPerMonth): void {
    this.updateForm('commuteDaysPerMonth', value);
  }

  setYesNo(
    key: 'soleEarnerDeduction' | 'benefitInKindFromCompanyCar' | 'publicTransportReasonable',
    value: boolean,
  ): void {
    if (key === 'benefitInKindFromCompanyCar' && value) {
      this.form.update((current) => ({
        ...current,
        benefitInKindFromCompanyCar: true,
        commuteOneWayKm: 0,
        publicTransportReasonable: true,
        commuteDaysPerMonth: 'more_than_10',
      }));
      return;
    }

    if (key === 'benefitInKindFromCompanyCar' && !value) {
      this.form.update((current) => ({
        ...current,
        benefitInKindFromCompanyCar: false,
        companyCar: undefined,
      }));
      return;
    }

    this.updateForm(key, value);
  }

  updateCompanyCar<K extends keyof CompanyCarInput>(
    key: K,
    value: CompanyCarInput[K],
  ): void {
    this.form.update((current) => ({
      ...current,
      companyCar: {
        acquisitionCost: current.companyCar?.acquisitionCost ?? 0,
        co2GramsPerKm: current.companyCar?.co2GramsPerKm ?? 0,
        firstRegistrationYear:
          current.companyCar?.firstRegistrationYear ?? new Date().getFullYear(),
        halfBenefit: current.companyCar?.halfBenefit ?? false,
        ...current.companyCar,
        [key]: value,
      },
    }));
  }

  private buildCalculateRequest(): CalculateRequest {
    const form = this.form();
    const request: CalculateRequest = { ...form };

    if (!form.benefitInKindFromCompanyCar) {
      delete request.companyCar;
      return request;
    }

    const car = form.companyCar;
    if (!car?.acquisitionCost || car.acquisitionCost <= 0) {
      delete request.companyCar;
    }

    return request;
  }

  submit(): void {
    if (this.loading() || !this.session.deviceId()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.calculatorApi.calculate(this.buildCalculateRequest()).subscribe({
      next: (response) => {
        this.result.set(response);
        this.activeTab.set('recurring');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (isPaymentRequiredError(err)) {
          this.paymentModalOpen.set(true);
          return;
        }
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  openPaymentModal(): void {
    this.paymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    this.paymentModalOpen.set(false);
  }

  exportPdf(): void {
    const data = this.result();
    if (!data) {
      return;
    }
    if (!this.session.status()?.isPro) {
      this.paymentModalOpen.set(true);
      return;
    }
    exportOfficialCalculationPdf(this.buildCalculateRequest(), data);
  }
}
