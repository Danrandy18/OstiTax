import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nService } from '../core/i18n/i18n.service';
import { SessionService } from '../core/services/session.service';
import type { Lang } from '../core/i18n/translations';
import { TranslatePipe } from '../shared/pipes/app.pipes';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, FormsModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly session = inject(SessionService);

  ngOnInit(): void {
    void this.session.ensureSession();
  }

  onLanguageChange(value: Lang): void {
    this.i18n.setLanguage(value);
  }
}
