import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountsService } from '../accounts.service';
import type { Account } from '../entities/account.entity';
import { extractBearerToken } from './account-auth.guard';

/**
 * Igual que AccountAuthGuard pero nunca lanza: si no hay token, o es
 * invalido/expirado, simplemente deja request.account sin definir y sigue.
 * Solo se usa donde el flujo invitado (sin login) debe seguir funcionando
 * intacto (ver CalculationAccessGuard).
 */
@Injectable()
export class OptionalAccountAuthGuard implements CanActivate {
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
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
      );
      const account = await this.accountsService.findById(payload.sub);
      if (account) {
        request.account = account;
      }
    } catch {
      // Token invalido/expirado: se ignora, el flujo invitado sigue.
    }

    return true;
  }
}
