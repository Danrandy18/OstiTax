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

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const account = await this.accountsService.findById(payload.sub);
    if (!account) {
      throw new UnauthorizedException('Account not found');
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
