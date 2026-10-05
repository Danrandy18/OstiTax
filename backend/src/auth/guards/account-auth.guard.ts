import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsService } from '../accounts.service';
import type { Account } from '../entities/account.entity';

@Injectable()
export class AccountAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly accountsService: AccountsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      account?: Account;
    }>();

    const token = extractBearerToken(request.headers['authorization']);
    if (!token) {
      throw new UnauthorizedException('Authorization header is required');
    }

    let payload: { sub: string; iat?: number };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const account = await this.accountsService.findById(payload.sub);
    if (!account) {
      throw new UnauthorizedException('Account not found');
    }
    if (issuedBeforePasswordChange(payload, account)) {
      throw new UnauthorizedException('Session ended after a password change');
    }

    request.account = account;
    return true;
  }
}

export function extractBearerToken(
  header: string | string[] | undefined,
): string | null {
  if (!header || Array.isArray(header)) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

/**
 * Un token emitido antes del ultimo cambio de contrasena ya no vale: cambiarla cierra la
 * sesion en los demas dispositivos. `iat` va en segundos.
 */
export function issuedBeforePasswordChange(
  payload: { iat?: number },
  account: Pick<Account, 'passwordChangedAt'>,
): boolean {
  if (!account.passwordChangedAt || payload.iat === undefined) {
    return false;
  }
  return payload.iat < Math.floor(account.passwordChangedAt.getTime() / 1000);
}
