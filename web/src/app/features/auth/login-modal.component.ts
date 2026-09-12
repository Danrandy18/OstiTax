import { Component, HostListener, effect, inject, input, output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/app.pipes';
import { AuthPanelComponent } from './auth-panel.component';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [AuthPanelComponent, TranslatePipe],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent {
  private readonly auth = inject(AuthService);

  readonly open = input(false);
  readonly closed = output<void>();

  constructor() {
    // Cierra el modal automaticamente al loguearse/registrarse mientras esta abierto.
    effect(() => {
      if (this.open() && this.auth.account()) {
        this.close();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
