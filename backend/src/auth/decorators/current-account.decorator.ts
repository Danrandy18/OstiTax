import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Account } from '../entities/account.entity';

export const CurrentAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Account => {
    const request = ctx.switchToHttp().getRequest<{ account: Account }>();
    return request.account;
  },
);
