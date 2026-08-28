import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import type { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class CalculationAccessGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

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
          plan: user.plan,
        },
        402,
      );
    }

    request.user = await this.usersService.decrementFreeAttempt(user.id);
    return true;
  }
}
