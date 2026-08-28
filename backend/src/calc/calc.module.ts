import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CalcController } from './calc.controller';
import { CalcService } from './calc.service';

@Module({
  imports: [UsersModule],
  controllers: [CalcController],
  providers: [CalcService],
  exports: [CalcService],
})
export class CalcModule {}
