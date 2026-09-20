import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OptionalAccountAuthGuard } from '../auth/guards/optional-account-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CalculationAccessGuard } from '../common/guards/calculation-access.guard';
import { DeviceUserGuard } from '../common/guards/device-user.guard';
import type { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CalcService } from './calc.service';
import { CalculateRequestDto } from './dto/calculate-request.dto';
import { CalculateResponseDto } from './dto/calculate-response.dto';

@Controller('calculate')
export class CalcController {
  constructor(
    private readonly calcService: CalcService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(DeviceUserGuard, OptionalAccountAuthGuard, CalculationAccessGuard)
  calculate(
    @Body() dto: CalculateRequestDto,
    @CurrentUser() user: User,
  ): CalculateResponseDto {
    const result = this.calcService.calculate(dto);
    return {
      ...result,
      usage: {
        plan: user.plan,
        isPro: this.usersService.isPro(user),
        freeAttemptsRemaining: user.freeAttemptsRemaining,
        freeAttemptsResetAt: this.usersService.freeAttemptsResetAt(user),
      },
    };
  }
}
