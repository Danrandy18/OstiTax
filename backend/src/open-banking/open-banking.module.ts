import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BankAccount } from './entities/bank-account.entity';
import { BankConnection } from './entities/bank-connection.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { GoCardlessService } from './gocardless/gocardless.service';
import { OpenBankingCallbackController } from './open-banking-callback.controller';
import { OpenBankingController } from './open-banking.controller';
import { OpenBankingService } from './open-banking.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([BankConnection, BankAccount, BankTransaction]),
  ],
  controllers: [OpenBankingController, OpenBankingCallbackController],
  providers: [OpenBankingService, GoCardlessService],
  exports: [OpenBankingService],
})
export class OpenBankingModule {}
