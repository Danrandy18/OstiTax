import { Routes } from '@angular/router';
import { AccountPageComponent } from './features/account/account-page.component';
import { CalculatorComponent } from './features/calculator/calculator.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
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
      { path: 'profile', component: AccountPageComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'payment/success', component: PaymentSuccessComponent },
      { path: 'payment/cancel', component: PaymentCancelComponent },
    ],
  },
];
