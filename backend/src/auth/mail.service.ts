import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const smtpHost = this.configService.get<string>('auth.smtp.host');

    if (!smtpHost) {
      // Sin SMTP configurado (desarrollo): loguear el link en vez de fallar.
      this.logger.warn(
        `SMTP no configurado. Link de recuperacion para ${email}: ${resetUrl}`,
      );
      return;
    }

    const from = this.configService.get<string>('auth.smtp.from');
    const transporter = this.getTransporter();

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Restablece tu contraseña — ÖstiTax',
      text: `Recibimos una solicitud para restablecer tu contraseña. Abre este enlace (valido por un tiempo limitado) para elegir una nueva:\n\n${resetUrl}\n\nSi no la solicitaste, ignora este correo.`,
      html: `
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}">Haz clic aquí para elegir una nueva contraseña</a> (el enlace expira pronto).</p>
        <p>Si no la solicitaste, ignora este correo.</p>
      `,
    });
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('auth.smtp.host'),
      port: this.configService.get<number>('auth.smtp.port'),
      secure: this.configService.get<boolean>('auth.smtp.secure'),
      auth: {
        user: this.configService.get<string>('auth.smtp.user'),
        pass: this.configService.get<string>('auth.smtp.pass'),
      },
    });

    return this.transporter;
  }
}
