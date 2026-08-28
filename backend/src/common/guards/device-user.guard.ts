import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class DeviceUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: unknown;
    }>();
    const rawDeviceId = request.headers['x-device-id'];

    if (!rawDeviceId || Array.isArray(rawDeviceId)) {
      throw new BadRequestException('X-Device-Id header is required');
    }

    request.user = await this.usersService.findOrCreateByDeviceId(rawDeviceId);
    return true;
  }
}
