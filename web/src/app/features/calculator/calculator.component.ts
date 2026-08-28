import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  AustrianState,
  CalculateRequest,
  CalculateResponse,
  CommuteDaysPerMonth,
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
    this.updateForm(key, value);
  }

  submit(): void {
    if (this.loading() || !this.session.deviceId()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.calculatorApi.calculate(this.form()).subscribe({
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
}
