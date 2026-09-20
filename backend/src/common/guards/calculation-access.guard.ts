import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { AccountsService } from '../../auth/accounts.service';
import type { Account } from '../../auth/entities/account.entity';
import type { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class CalculationAccessGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user: User; account?: Account }>();
    const user = request.user;

    if (request.account && this.accountsService.isPro(request.account)) {
      // Cuenta Pro logueada: sin limite, sin tocar el contador de dispositivo.
      return true;
    }

    if (this.usersService.isPro(user)) {
      return true;
    }

    if (user.freeAttemptsRemaining <= 0) {
      throw new HttpException(
        {
          statusCode: 402,
          code: 'PAYMENT_REQUIRED',
          message: 'Free attempts exhausted. Upgrade to Pro to continue.',
          freeAttemptsRemaining: 0,
          freeAttemptsResetAt: this.usersService.freeAttemptsResetAt(user),
          plan: user.plan,
        },
        402,
      );
    }

    request.user = await this.usersService.decrementFreeAttempt(user.id);
    return true;
  }
}
