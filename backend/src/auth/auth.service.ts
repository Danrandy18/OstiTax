import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AccountsService } from './accounts.service';
import type { Account } from './entities/account.entity';
import { MailService } from './mail.service';

const PASSWORD_SALT_ROUNDS = 12;

/** Intentos fallidos del codigo de prueba permitidos por correo y en total, por ventana. */
const TEST_CODE_MAX_FAILURES_PER_EMAIL = 5;
const TEST_CODE_MAX_FAILURES_GLOBAL = 30;
const TEST_CODE_WINDOW_MS = 15 * 60_000;
const GLOBAL_FAILURE_KEY = '*';

/** 'email': se envia un enlace por correo. 'code': se pide el codigo de prueba (sin SMTP). */
export type PasswordResetMode = 'email' | 'code';

export interface AuthResult {
  accessToken: string;
  account: Account;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client | null = null;
  private readonly testCodeFailures = new Map<string, number[]>();

  constructor(
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit(): void {
    const hasCode = !!this.configService.get<string>(
      'auth.passwordResetTestCode',
    );
    if (!hasCode) {
      return;
    }
    if (this.isTestCodeResetEnabled()) {
      this.logger.warn(
        'PASSWORD_RESET_TEST_CODE activo: quien conozca el codigo puede cambiar la contrasena de cualquier cuenta. Solo para pruebas; configura SMTP y quita la variable.',
      );
    } else {
      this.logger.warn(
        'PASSWORD_RESET_TEST_CODE esta definido pero SMTP esta configurado: el codigo de prueba se ignora.',
      );
    }
  }

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResult> {
    const existing = await this.accountsService.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const account = await this.accountsService.create({
      email,
      passwordHash,
      name,
    });

    return { accessToken: this.issueToken(account), account };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const account = await this.accountsService.findByEmail(email);
    if (!account || !account.passwordHash) {
      if (account && !account.passwordHash) {
        throw new UnauthorizedException(
          'This account uses Google Sign-In. Please continue with Google.',
        );
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    const matches = await bcrypt.compare(password, account.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return { accessToken: this.issueToken(account), account };
  }

  async googleLogin(idToken: string): Promise<AuthResult> {
    const payload = await this.verifyGoogleIdToken(idToken);
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? null;

    if (!email) {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_TOKEN',
        message: 'Google account has no email.',
      });
    }

    let account = await this.accountsService.findByGoogleId(googleId);

    if (!account) {
      const byEmail = await this.accountsService.findByEmail(email);
      if (byEmail) {
        account = await this.accountsService.linkGoogleId(byEmail.id, googleId);
      } else {
        account = await this.accountsService.create({
          email,
          googleId,
          name,
        });
      }
    }

    return { accessToken: this.issueToken(account), account };
  }

  /**
   * Siempre resuelve sin error, exista o no la cuenta, para no filtrar
   * (por timing/respuesta) que emails estan registrados. Si la cuenta es
   * Google-only (sin passwordHash), tampoco hay nada que restablecer y se
   * ignora en silencio.
   */
  async forgotPassword(email: string): Promise<PasswordResetMode> {
    // Modo de prueba: no hay correo que enviar; el cliente pide el codigo. La respuesta solo
    // depende de la configuracion, nunca de si la cuenta existe.
    if (this.isTestCodeResetEnabled()) {
      return 'code';
    }

    const account = await this.accountsService.findByEmail(email);
    if (!account || !account.passwordHash) {
      return 'email';
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresMinutes = this.configService.get<number>(
      'auth.passwordResetExpiresInMinutes',
      60,
    );
    const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

    await this.accountsService.setPasswordResetToken(
      account.id,
      tokenHash,
      expiresAt,
    );

    const appUrl = this.configService.get<string>('billing.appUrl');
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(account.email, resetUrl);
    return 'email';
  }

  /** El codigo de prueba solo vale mientras no haya SMTP: al configurar el correo se apaga solo. */
  isTestCodeResetEnabled(): boolean {
    const code = this.configService.get<string>(
      'auth.passwordResetTestCode',
      '',
    );
    const smtpHost = this.configService.get<string>('auth.smtp.host', '');
    return !!code && !smtpHost;
  }

  async resetPasswordWithTestCode(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    if (!this.isTestCodeResetEnabled()) {
      throw this.invalidResetCode();
    }

    const emailKey = email.trim().toLowerCase();
    this.assertTestCodeNotRateLimited(emailKey);

    const expected = this.configService.get<string>(
      'auth.passwordResetTestCode',
      '',
    );
    if (!this.safeEqual(code.trim(), expected)) {
      this.recordTestCodeFailure(emailKey);
      throw this.invalidResetCode();
    }

    // Misma respuesta si la cuenta no existe o no tiene contrasena (Google): no se filtra nada.
    const account = await this.accountsService.findByEmail(emailKey);
    if (!account || !account.passwordHash) {
      throw this.invalidResetCode();
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await this.accountsService.resetPassword(account.id, passwordHash);
    this.testCodeFailures.delete(emailKey);
    this.logger.warn(
      `Contrasena restablecida con el codigo de prueba: cuenta ${account.id}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const account =
      await this.accountsService.findByPasswordResetTokenHash(tokenHash);

    if (
      !account ||
      !account.passwordResetExpiresAt ||
      account.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'This reset link is invalid or has expired.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await this.accountsService.resetPassword(account.id, passwordHash);
  }

  private invalidResetCode(): BadRequestException {
    return new BadRequestException({
      code: 'INVALID_RESET_CODE',
      message: 'The reset code is invalid.',
    });
  }

  private safeEqual(a: string, b: string): boolean {
    const digest = (value: string) =>
      createHash('sha256').update(value).digest();
    return timingSafeEqual(digest(a), digest(b));
  }

  private recentFailures(key: string): number[] {
    const cutoff = Date.now() - TEST_CODE_WINDOW_MS;
    const recent = (this.testCodeFailures.get(key) ?? []).filter(
      (at) => at > cutoff,
    );
    this.testCodeFailures.set(key, recent);
    return recent;
  }

  private assertTestCodeNotRateLimited(emailKey: string): void {
    if (
      this.recentFailures(emailKey).length >=
        TEST_CODE_MAX_FAILURES_PER_EMAIL ||
      this.recentFailures(GLOBAL_FAILURE_KEY).length >=
        TEST_CODE_MAX_FAILURES_GLOBAL
    ) {
      throw new HttpException(
        {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many attempts. Try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordTestCodeFailure(emailKey: string): void {
    const now = Date.now();
    this.recentFailures(emailKey).push(now);
    this.recentFailures(GLOBAL_FAILURE_KEY).push(now);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private issueToken(account: Account): string {
    return this.jwtService.sign({ sub: account.id, email: account.email });
  }

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(
        this.configService.get<string>('auth.googleClientId'),
      );
    }
    return this.googleClient;
  }

  private async verifyGoogleIdToken(idToken: string) {
    const clientId = this.configService.get<string>('auth.googleClientId');
    if (!clientId) {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_TOKEN',
        message: 'Google sign-in is not configured.',
      });
    }

    try {
      const ticket = await this.getGoogleClient().verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Empty Google token payload');
      }
      return payload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_GOOGLE_TOKEN',
        message: 'Invalid or expired Google token.',
      });
    }
  }
}
