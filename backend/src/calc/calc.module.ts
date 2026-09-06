import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CalcController } from './calc.controller';
import { CalcService } from './calc.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [CalcController],
  providers: [CalcService],
  exports: [CalcService],
})
export class CalcModule {}
