import { Component, ElementRef, computed, effect, inject, isDevMode, signal, viewChild } from '@angular/core';
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
  SelfEmployedKind,
} from '../../core/models/api.models';
import {
  CalculatorApiService,
  isPaymentRequiredError,
} from '../../core/services/calculator-api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import type { Lang } from '../../core/i18n/translations';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { UpgradeService } from '../../core/services/upgrade.service';
import { EurPipe, TranslatePipe } from '../../shared/pipes/app.pipes';
import { CountUpDirective } from '../../shared/animations/count-up.directive';
import { exportOfficialCalculationPdf, PDF_SUPPORTED_LANGS } from '../../core/pdf/text-pdf.util';

const PDF_LANG_LABELS: Record<Lang, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  tr: 'Türkçe',
  bcs: 'BCS',
  uk: 'Українська',
};

type ResultTab = 'recurring' | 'thirteenth' | 'fourteenth' | 'annual';

const BMF_PENDLER_URL = 'https://www.bmf.gv.at/pendlerrechner';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [FormsModule, TranslatePipe, EurPipe, CountUpDirective],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  private readonly calculatorApi = inject(CalculatorApiService);
  readonly i18n = inject(I18nService);
  readonly session = inject(SessionService);
  readonly auth = inject(AuthService);
  private readonly upgrade = inject(UpgradeService);
  readonly bmfPendlerUrl = BMF_PENDLER_URL;

  /** El Pro pertenece a la cuenta; el flag por dispositivo queda como fallback histórico. */
  readonly isPro = computed(
    () => this.auth.account()?.isPro || this.session.status()?.isPro || false,
  );
  /** Solo herramientas de QA visibles en `ng serve` / build no productivo. */
  readonly devMode = isDevMode();
  readonly resettingAttempts = signal(false);

  /** PDF en otro idioma: función Pro. Limitado a de/en/es (ver text-pdf.util.ts). */
  readonly pdfLangOptions = PDF_SUPPORTED_LANGS.map((code) => ({
    code,
    label: PDF_LANG_LABELS[code],
  }));
  readonly pdfLang = signal<Lang>(
    PDF_SUPPORTED_LANGS.includes(this.i18n.currentLang()) ? this.i18n.currentLang() : 'de',
  );

  private readonly breakdownEl = viewChild<ElementRef<HTMLElement>>('breakdownEl');

  constructor() {
    effect(() => {
      this.activeTab();
      const el = this.breakdownEl()?.nativeElement;
      if (!el) {
        return;
      }
      el.classList.remove('tab-anim');
      void el.offsetWidth;
      el.classList.add('tab-anim');
    });
  }

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
    selfEmployedKind: 'trade',
    selfEmployedFirstYears: false,
  });

  readonly result = signal<CalculateResponse | null>(null);
  readonly activeTab = signal<ResultTab>('recurring');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly stateOptions = computed(() =>
    Object.entries(this.i18n.t().states).map(([value, label]) => ({
      value: value as AustrianState,
      label,
    })),
  );

  /** Autonomos: beneficio anual, sin Estado federado, coche de empresa ni desplazamientos. */
  readonly isSelfEmployed = computed(() => this.form().employmentType === 'self_employed');

  readonly grossLabel = computed(() => {
    const t = this.i18n.t();
    const yearly = this.form().incomePeriod === 'yearly';
    if (this.isSelfEmployed()) {
      return yearly ? t.profitAmountYearly : t.profitAmountMonthly;
    }
    return yearly ? t.grossAmountYearly : t.grossAmountMonthly;
  });

  /** Autonomos: sin 13./14. Bezug; solo media mensual y año. */
  readonly resultTabs = computed<ResultTab[]>(() =>
    this.result()?.selfEmployed
      ? ['recurring', 'annual']
      : ['recurring', 'thirteenth', 'fourteenth', 'annual'],
  );

  readonly seBackPaymentText = computed(() => {
    const se = this.result()?.selfEmployed;
    if (!se || se.estimatedBackPayment === null || se.provisionalSocialInsurance === null) {
      return null;
    }
    const eur = (v: number) =>
      new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(v);
    return this.i18n
      .t()
      .seBackPayment.replace('{provisional}', eur(se.provisionalSocialInsurance))
      .replace('{final}', eur(se.socialInsurance))
      .replace('{backPayment}', eur(se.estimatedBackPayment));
  });

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
    return !!status && !this.isPro();
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
    const wasSelfEmployed = this.isSelfEmployed();
    this.form.update((current) => ({
      ...current,
      employmentType: type,
      // Un autonomo piensa en beneficio anual; al volver a nomina, en sueldo mensual.
      ...(type === 'self_employed' && !wasSelfEmployed
        ? { incomePeriod: 'yearly' as IncomePeriod, grossAmount: 40000 }
        : {}),
      ...(type !== 'self_employed' && wasSelfEmployed
        ? { incomePeriod: 'monthly' as IncomePeriod, grossAmount: 3000 }
        : {}),
    }));
    this.error.set(null);
  }

  setSelfEmployedKind(kind: SelfEmployedKind): void {
    this.updateForm('selfEmployedKind', kind);
  }

  setFirstYears(value: boolean): void {
    this.updateForm('selfEmployedFirstYears', value);
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

    if (form.employmentType === 'self_employed') {
      // Los campos de nomina no aplican a un autonomo.
      delete request.companyCar;
      return {
        ...request,
        benefitInKindMonthly: 0,
        benefitInKindFromCompanyCar: false,
        taxFreeAllowanceMonthly: 0,
        commuteOneWayKm: 0,
      };
    }
    delete request.selfEmployedKind;
    delete request.selfEmployedFirstYears;

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
          this.upgrade.openPayment();
          return;
        }
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  openPaymentModal(): void {
    this.upgrade.openPayment();
  }

  setPdfLang(lang: Lang): void {
    this.pdfLang.set(lang);
  }

  exportPdf(): void {
    const data = this.result();
    if (!data) {
      return;
    }
    // Gratis: PDF basico (con aviso para pasarse a Pro). Pro: informe completo.
    const tier = this.isPro() ? 'pro' : 'basic';
    exportOfficialCalculationPdf(this.buildCalculateRequest(), data, this.pdfLang(), tier);
  }

  /** Solo QA: descarga el PDF sin exigir Pro. No debe usarse en producción. */
  exportPdfForTesting(): void {
    const data = this.result();
    if (!data) {
      return;
    }
    exportOfficialCalculationPdf(this.buildCalculateRequest(), data, this.pdfLang());
  }

  /** Solo QA: el backend rechaza esto fuera de development. */
  resetAttemptsForTesting(): void {
    if (this.resettingAttempts()) {
      return;
    }
    this.resettingAttempts.set(true);
    this.session.resetAttemptsForTesting().subscribe({
      next: () => this.resettingAttempts.set(false),
      error: () => this.resettingAttempts.set(false),
    });
  }
}
