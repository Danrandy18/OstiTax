import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DatePipe],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);

  askDelete(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  confirmDelete(): void {
    this.deleting.set(true);
    this.error.set(null);
    this.auth.deleteAccount().subscribe({
      next: () => {
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.deleting.set(false);
        this.error.set(this.i18n.t().authErrorGeneric);
      },
    });
  }
}
