import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OpenBankingApiService } from '../../core/services/open-banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';
import type {
  BankConnection,
  BankInstitution,
  BankTransaction,
} from '../../core/models/api.models';

@Component({
  selector: 'app-banking-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DatePipe],
  templateUrl: './banking-page.component.html',
  styleUrl: './banking-page.component.scss',
})
export class BankingPageComponent {
  private readonly api = inject(OpenBankingApiService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly institutions = signal<BankInstitution[] | null>(null);
  readonly connections = signal<BankConnection[]>([]);
  readonly transactions = signal<BankTransaction[]>([]);
  readonly loadingInstitutions = signal(false);
  readonly connectingId = signal<string | null>(null);
  readonly syncingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.auth.account()) {
      this.loadConnections();
    }
  }

  loadInstitutions(): void {
    if (this.institutions() !== null) {
      return;
    }
    this.loadingInstitutions.set(true);
    this.api.listInstitutions().subscribe({
      next: (list) => {
        this.institutions.set(list);
        this.loadingInstitutions.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t().errorGeneric);
        this.loadingInstitutions.set(false);
        this.institutions.set([]);
      },
    });
  }

  connect(institutionId: string): void {
    this.error.set(null);
    this.connectingId.set(institutionId);
    this.api.startLink(institutionId).subscribe({
      next: ({ redirectUrl }) => {
        window.location.href = redirectUrl;
      },
      error: () => {
        this.connectingId.set(null);
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  sync(connectionId: string): void {
    this.error.set(null);
    this.syncingId.set(connectionId);
    this.api.syncTransactions(connectionId).subscribe({
      next: () => {
        this.syncingId.set(null);
        this.loadTransactions();
      },
      error: () => {
        this.syncingId.set(null);
        this.error.set(this.i18n.t().errorGeneric);
      },
    });
  }

  private loadConnections(): void {
    this.api.listConnections().subscribe({
      next: (list) => {
        this.connections.set(list);
        this.loadTransactions();
      },
      error: () => this.error.set(this.i18n.t().errorGeneric),
    });
  }

  private loadTransactions(): void {
    this.api.listTransactions().subscribe({
      next: (list) => this.transactions.set(list),
      error: () => this.error.set(this.i18n.t().errorGeneric),
    });
  }
}
