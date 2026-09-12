import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../auth/decorators/current-account.decorator';
import type { Account } from '../auth/entities/account.entity';
import { AccountAuthGuard } from '../auth/guards/account-auth.guard';
import { StartLinkDto } from './dto/start-link.dto';
import { OpenBankingService } from './open-banking.service';

@Controller('open-banking')
@UseGuards(AccountAuthGuard)
export class OpenBankingController {
  constructor(private readonly openBankingService: OpenBankingService) {}

  @Get('institutions')
  listInstitutions() {
    return this.openBankingService.listInstitutions();
  }

  @Post('link')
  startLink(@CurrentAccount() account: Account, @Body() dto: StartLinkDto) {
    return this.openBankingService.startLink(account, dto.institutionId);
  }

  @Post('connections/:id/sync')
  syncTransactions(
    @CurrentAccount() account: Account,
    @Param('id') connectionId: string,
  ) {
    return this.openBankingService.syncTransactions(account, connectionId);
  }

  @Get('connections')
  listConnections(@CurrentAccount() account: Account) {
    return this.openBankingService.listConnections(account);
  }

  @Get('transactions')
  listTransactions(
    @CurrentAccount() account: Account,
    @Query('connectionId') connectionId?: string,
  ) {
    return this.openBankingService.listTransactions(account, connectionId);
  }
}
