import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from '../auth/accounts.service';
import { CurrentAccount } from '../auth/decorators/current-account.decorator';
import type { Account } from '../auth/entities/account.entity';
import { AccountAuthGuard } from '../auth/guards/account-auth.guard';
import { ParseReceiptDto } from './dto/parse-receipt.dto';
import { parseReceipt, type ParsedReceipt } from './receipt-parser';

/**
 * Lectura de recibos (funcion Pro). El cliente hace el OCR en el dispositivo y envia solo el
 * texto; aqui se extraen los campos y se sugiere la categoria fiscal, en un unico sitio.
 */
@Controller('receipts')
@UseGuards(AccountAuthGuard)
export class ReceiptsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('parse')
  @HttpCode(200)
  parse(
    @CurrentAccount() account: Account,
    @Body() dto: ParseReceiptDto,
  ): ParsedReceipt {
    if (!this.accountsService.isPro(account)) {
      throw new ForbiddenException({
        code: 'PRO_REQUIRED',
        message: 'Receipt scanning is a Pro feature.',
      });
    }
    return parseReceipt(dto.text);
  }
}
