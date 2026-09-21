import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReceiptsController } from './receipts.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [ReceiptsController],
})
export class ReceiptsModule {}
