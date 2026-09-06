import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeviceUserGuard } from './guards/device-user.guard';
import { CalculationAccessGuard } from './guards/calculation-access.guard';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule, AuthModule],
  providers: [DeviceUserGuard, CalculationAccessGuard],
  exports: [DeviceUserGuard, CalculationAccessGuard, UsersModule],
})
export class CommonModule {}
