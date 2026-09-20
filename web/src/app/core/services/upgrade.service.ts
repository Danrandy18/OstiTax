import { Injectable, signal } from '@angular/core';

/**
 * Estado compartido de las pantallas de mejora a Pro. Las abren tanto el boton del
 * encabezado como la calculadora (al agotar los intentos gratis), y se pintan en el shell.
 */
@Injectable({ providedIn: 'root' })
export class UpgradeService {
  readonly compareOpen = signal(false);
  readonly paymentOpen = signal(false);

  openCompare(): void {
    this.compareOpen.set(true);
  }

  closeCompare(): void {
    this.compareOpen.set(false);
  }

  openPayment(): void {
    this.paymentOpen.set(true);
  }

  closePayment(): void {
    this.paymentOpen.set(false);
  }

  /** Desde la comparativa se pasa directo a elegir plan y pagar. */
  choosePlan(): void {
    this.compareOpen.set(false);
    this.paymentOpen.set(true);
  }
}
