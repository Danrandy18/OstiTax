import { Routes } from '@angular/router';
import { CalculatorComponent } from './features/calculator/calculator.component';
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
      { path: 'payment/success', component: PaymentSuccessComponent },
      { path: 'payment/cancel', component: PaymentCancelComponent },
    ],
  },
];
