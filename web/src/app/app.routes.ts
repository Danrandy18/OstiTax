import { Routes } from '@angular/router';
import { AccountPageComponent } from './features/account/account-page.component';
import { BankingCallbackComponent } from './features/banking/banking-callback.component';
import { BankingPageComponent } from './features/banking/banking-page.component';
import { CalculatorComponent } from './features/calculator/calculator.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
import { ReceiptsPageComponent } from './features/receipts/receipts-page.component';
import { LegalPageComponent } from './features/legal/legal-page.component';
import { AppShellComponent } from './layout/app-shell.component';
import {
  PaymentCancelComponent,
  PaymentSuccessComponent,
} from './features/payment/payment-status.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: CalculatorComponent },
      // Rutas por idioma: contenido identico, prerenderizado en build time para SEO
      // (ver app.routes.server.ts). El idioma se fija via route data en AppShellComponent.
      { path: 'en', component: CalculatorComponent, data: { lang: 'en' } },
      { path: 'es', component: CalculatorComponent, data: { lang: 'es' } },
      { path: 'tr', component: CalculatorComponent, data: { lang: 'tr' } },
      { path: 'uk', component: CalculatorComponent, data: { lang: 'uk' } },
      { path: 'bcs', component: CalculatorComponent, data: { lang: 'bcs' } },
      // Paginas legales: publicas y prerenderizadas (Google Play exige URLs de privacidad y borrado).
      { path: 'privacy', component: LegalPageComponent, data: { doc: 'privacy' } },
      { path: 'impressum', component: LegalPageComponent, data: { doc: 'impressum' } },
      { path: 'delete-account', component: LegalPageComponent, data: { doc: 'deleteAccount' } },
      { path: 'profile', component: AccountPageComponent },
      { path: 'receipts', component: ReceiptsPageComponent },
      { path: 'banking', component: BankingPageComponent },
      { path: 'banking/callback', component: BankingCallbackComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'payment/success', component: PaymentSuccessComponent },
      { path: 'payment/cancel', component: PaymentCancelComponent },
    ],
  },
];
