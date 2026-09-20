import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DeviceUserGuard } from '../common/guards/device-user.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UserStatusDto } from './dto/user-status.dto';
import type { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('session')
  async createSession(@Body() dto: CreateSessionDto): Promise<UserStatusDto> {
    const deviceId = dto.deviceId ?? randomUUID();
    const user = await this.usersService.findOrCreateByDeviceId(deviceId);
    return this.toStatus(user);
  }

  @Get('me')
  @UseGuards(DeviceUserGuard)
  getMe(@CurrentUser() user: User): UserStatusDto {
    return this.toStatus(user);
  }

  /**
   * Solo para QA manual mientras el producto está en pruebas.
   * Deshabilitado fuera de development: nunca debe permitir resetear
   * intentos gratis en producción (ver reglas de negocio en CLAUDE.md).
   */
  @Post('dev/reset-attempts')
  @UseGuards(DeviceUserGuard)
  async resetAttemptsForTesting(
    @CurrentUser() user: User,
  ): Promise<UserStatusDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    const updated = await this.usersService.resetFreeAttemptsForTesting(
      user.id,
    );
    return this.toStatus(updated);
  }

  private toStatus(user: User): UserStatusDto {
    return UserStatusDto.fromEntity(
      user,
      this.usersService.isPro(user),
      this.usersService.freeAttemptsResetAt(user),
    );
  }
}
