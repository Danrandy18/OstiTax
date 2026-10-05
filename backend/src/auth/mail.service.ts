import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Account } from './entities/account.entity';
import {
  renderPasswordChanged,
  renderPasswordReset,
  renderPaymentReceipt,
  renderProWelcome,
  renderSubscriptionCanceled,
  type PaymentReceiptData,
  type RenderedMail,
} from './mail/mail-templates';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Lo minimo de la cuenta que necesita un correo. */
export type MailRecipient = Pick<Account, 'email' | 'name' | 'locale'>;

/**
 * Envio de correos con Resend (https://resend.com). Basta con RESEND_API_KEY y un remitente de
 * un dominio verificado en Resend (MAIL_FROM). Sin clave (desarrollo) no se envia nada: el
 * correo se registra en el log para poder seguir el flujo.
 *
 * Los correos de aviso (bienvenida, factura, cancelacion) nunca deben romper el webhook que los
 * dispara: `sendSafely` registra el error y sigue.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!this.configService.get<string>('auth.mail.resendApiKey');
  }

  private get appUrl(): string {
    return this.configService.get<string>('billing.appUrl') ?? '';
  }

  /** Debe llegar o fallar: el usuario espera el correo para continuar. */
  async sendPasswordReset(
    to: MailRecipient,
    resetUrl: string,
    expiresInMinutes: number,
  ): Promise<void> {
    await this.send(
      to.email,
      renderPasswordReset({
        recipient: to,
        appUrl: this.appUrl,
        resetUrl,
        expiresInMinutes,
      }),
    );
  }

  sendPasswordChanged(to: MailRecipient, changedAt: Date): Promise<void> {
    return this.sendSafely(
      to.email,
      renderPasswordChanged({ recipient: to, appUrl: this.appUrl, changedAt }),
    );
  }

  sendProWelcome(to: MailRecipient, renewsOn: Date | null): Promise<void> {
    return this.sendSafely(
      to.email,
      renderProWelcome({
        recipient: to,
        appUrl: this.appUrl,
        renewsOn,
        playStoreUrl: this.configService.get<string>('auth.mail.playStoreUrl'),
      }),
    );
  }

  sendSubscriptionCanceled(
    to: MailRecipient,
    accessUntil: Date | null,
  ): Promise<void> {
    return this.sendSafely(
      to.email,
      renderSubscriptionCanceled({
        recipient: to,
        appUrl: this.appUrl,
        accessUntil,
      }),
    );
  }

  sendPaymentReceipt(
    to: MailRecipient,
    payment: PaymentReceiptData,
  ): Promise<void> {
    return this.sendSafely(
      to.email,
      renderPaymentReceipt({ recipient: to, appUrl: this.appUrl, payment }),
    );
  }

  private async sendSafely(to: string, mail: RenderedMail): Promise<void> {
    try {
      await this.send(to, mail);
    } catch (error) {
      this.logger.error(
        `No se pudo enviar "${mail.subject}": ${(error as Error).message}`,
      );
    }
  }

  private async send(to: string, mail: RenderedMail): Promise<void> {
    const apiKey = this.configService.get<string>('auth.mail.resendApiKey');
    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY no configurada: no se envia "${mail.subject}".\n${mail.text}`,
      );
      return;
    }

    const replyTo = this.configService.get<string>('auth.mail.replyTo');
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.configService.get<string>('auth.mail.from'),
        to: [to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend ${response.status}: ${detail.slice(0, 300)}`);
    }
  }
}
