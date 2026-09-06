import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanzOnlineController } from './finanzonline.controller';
import { FinanzOnlineService } from './finanzonline.service';

@Module({
  imports: [AuthModule],
  controllers: [FinanzOnlineController],
  providers: [FinanzOnlineService],
})
export class FinanzOnlineModule {}
