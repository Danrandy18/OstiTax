import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OpenBankingApiService } from '../../core/services/open-banking-api.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

type CallbackState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-banking-callback',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="status-page card">
      @switch (state()) {
        @case ('loading') {
          <p>{{ 'bankingCallbackLoading' | translate }}</p>
        }
        @case ('success') {
          <h1>{{ 'bankingCallbackSuccess' | translate }}</h1>
        }
        @case ('error') {
          <h1>{{ 'bankingCallbackError' | translate }}</h1>
        }
      }
      <a routerLink="/banking" class="btn-primary">{{ 'bankingBackToBanking' | translate }}</a>
    </section>
  `,
  styleUrl: '../payment/payment-status.component.scss',
})
export class BankingCallbackComponent implements OnInit {
  private readonly api = inject(OpenBankingApiService);
  private readonly route = inject(ActivatedRoute);

  readonly state = signal<CallbackState>('loading');

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (!ref) {
      this.state.set('error');
      return;
    }

    this.api.completeLink(ref).subscribe({
      next: ({ status }) => {
        this.state.set(status === 'linked' ? 'success' : 'error');
      },
      error: () => this.state.set('error'),
    });
  }
}
