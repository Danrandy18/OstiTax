import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  async createSession(
    @Body() dto: CreateSessionDto,
  ): Promise<UserStatusDto> {
    const deviceId = dto.deviceId ?? randomUUID();
    const user = await this.usersService.findOrCreateByDeviceId(deviceId);
    return UserStatusDto.fromEntity(user, this.usersService.isPro(user));
  }

  @Get('me')
  @UseGuards(DeviceUserGuard)
  getMe(@CurrentUser() user: User): UserStatusDto {
    return UserStatusDto.fromEntity(user, this.usersService.isPro(user));
  }
}
