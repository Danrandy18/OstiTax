import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import type { SaveReceiptDto } from './dto/save-receipt.dto';
import { Receipt } from './entities/receipt.entity';
import { requiresDepreciation } from './receipt-parser';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptsRepository: Repository<Receipt>,
  ) {}

  /** Recibos de la cuenta, del mas reciente al mas antiguo; opcionalmente solo un ano. */
  list(accountId: string, year?: number): Promise<Receipt[]> {
    return this.receiptsRepository.find({
      where: {
        accountId,
        ...(year ? { date: Between(`${year}-01-01`, `${year}-12-31`) } : {}),
      },
      order: { date: { direction: 'DESC', nulls: 'LAST' }, createdAt: 'DESC' },
    });
  }

  create(accountId: string, dto: SaveReceiptDto): Promise<Receipt> {
    return this.receiptsRepository.save(this.toEntity(accountId, dto));
  }

  async import(accountId: string, dtos: SaveReceiptDto[]): Promise<number> {
    if (dtos.length === 0) return 0;
    await this.receiptsRepository.save(
      dtos.map((dto) => this.toEntity(accountId, dto)),
    );
    return dtos.length;
  }

  async remove(accountId: string, id: string): Promise<void> {
    const result = await this.receiptsRepository.delete({ id, accountId });
    if (!result.affected) throw new NotFoundException('Receipt not found');
  }

  async removeAll(accountId: string): Promise<void> {
    await this.receiptsRepository.delete({ accountId });
  }

  private toEntity(accountId: string, dto: SaveReceiptDto): Receipt {
    const total = dto.total ?? null;
    return this.receiptsRepository.create({
      accountId,
      merchant: dto.merchant?.trim() ?? '',
      date: dto.date ? dto.date.slice(0, 10) : null,
      total,
      vatRate: dto.vatRate ?? null,
      vatAmount: dto.vatAmount ?? null,
      documentNumber: dto.documentNumber?.trim() ?? '',
      category: dto.category,
      // Se decide aqui y no en el cliente: el backend es la unica fuente de la regla GWG.
      depreciation: requiresDepreciation(dto.category, total),
    });
  }
}
