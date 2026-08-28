import { Global, Module } from '@nestjs/common';
import { DeviceUserGuard } from './guards/device-user.guard';
import { CalculationAccessGuard } from './guards/calculation-access.guard';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [DeviceUserGuard, CalculationAccessGuard],
  exports: [DeviceUserGuard, CalculationAccessGuard, UsersModule],
})
export class CommonModule {}
