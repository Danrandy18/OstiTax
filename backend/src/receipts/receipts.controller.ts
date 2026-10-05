import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AccountsService } from '../auth/accounts.service';
import { CurrentAccount } from '../auth/decorators/current-account.decorator';
import type { Account } from '../auth/entities/account.entity';
import { AccountAuthGuard } from '../auth/guards/account-auth.guard';
import {
  ExportReceiptsQueryDto,
  ListReceiptsQueryDto,
} from './dto/export-receipts.dto';
import { ParseReceiptDto } from './dto/parse-receipt.dto';
import { ImportReceiptsDto, SaveReceiptDto } from './dto/save-receipt.dto';
import type { Receipt } from './entities/receipt.entity';
import { buildReceiptsCsv, buildReceiptsPdf } from './receipt-export';
import { parseReceipt, type ParsedReceipt } from './receipt-parser';
import { ReceiptsService } from './receipts.service';

/**
 * Recibos (funcion Pro). El cliente hace el OCR en el dispositivo y envia solo el texto; aqui se
 * extraen los campos y se sugiere la categoria fiscal, en un unico sitio para web y mobile.
 *
 * Escanear y guardar exige Pro. Ver, exportar y borrar lo ya guardado no: son datos del usuario
 * y debe poder llevarselos o eliminarlos aunque el abono haya terminado (RGPD, arts. 15-17 y 20).
 */
@Controller('receipts')
@UseGuards(AccountAuthGuard)
export class ReceiptsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  @Post('parse')
  @HttpCode(200)
  parse(
    @CurrentAccount() account: Account,
    @Body() dto: ParseReceiptDto,
  ): ParsedReceipt {
    this.assertPro(account);
    return parseReceipt(dto.text);
  }

  @Get()
  list(
    @CurrentAccount() account: Account,
    @Query() query: ListReceiptsQueryDto,
  ): Promise<Receipt[]> {
    return this.receiptsService.list(account.id, query.year);
  }

  @Post()
  create(
    @CurrentAccount() account: Account,
    @Body() dto: SaveReceiptDto,
  ): Promise<Receipt> {
    this.assertPro(account);
    return this.receiptsService.create(account.id, dto);
  }

  /** Sube los recibos que la web guardaba antes solo en el navegador. */
  @Post('import')
  async import(
    @CurrentAccount() account: Account,
    @Body() dto: ImportReceiptsDto,
  ): Promise<{ imported: number }> {
    this.assertPro(account);
    return {
      imported: await this.receiptsService.import(account.id, dto.receipts),
    };
  }

  @Get('export')
  async export(
    @CurrentAccount() account: Account,
    @Query() query: ExportReceiptsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const receipts = await this.receiptsService.list(account.id, query.year);
    const name = `OestiTax-Belege${query.year ? `-${query.year}` : ''}`;
    if (query.format === 'csv') {
      res
        .type('text/csv; charset=utf-8')
        .attachment(`${name}.csv`)
        .send(buildReceiptsCsv(receipts));
      return;
    }
    const pdf = await buildReceiptsPdf(receipts, { year: query.year });
    res.type('application/pdf').attachment(`${name}.pdf`).send(pdf);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentAccount() account: Account,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.receiptsService.remove(account.id, id);
  }

  @Delete()
  @HttpCode(204)
  removeAll(@CurrentAccount() account: Account): Promise<void> {
    return this.receiptsService.removeAll(account.id);
  }

  private assertPro(account: Account): void {
    if (!this.accountsService.isPro(account)) {
      throw new ForbiddenException({
        code: 'PRO_REQUIRED',
        message: 'Receipt scanning is a Pro feature.',
      });
    }
  }
}
