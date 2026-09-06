import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { AccountsService } from './accounts.service';
import type { Account } from './entities/account.entity';

const PASSWORD_SALT_ROUNDS = 12;

export interface AuthResult {
  accessToken: string;
  account: Account;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client | null = null;

  constructor(
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
