import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import type { Account } from '../auth/entities/account.entity';
import { BankAccount } from './entities/bank-account.entity';
import { BankConnection } from './entities/bank-connection.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankConnectionStatus } from './enums/bank-connection-status.enum';
import {
  GoCardlessInstitution,
  GoCardlessService,
} from './gocardless/gocardless.service';

const LINKED_STATUSES = new Set(['LN']);
const EXPIRED_STATUSES = new Set(['EX']);
// SA (suspended), RJ (rejected), GA (given up) y otros terminales negativos.
const ERROR_STATUSES = new Set(['SA', 'RJ', 'GA', 'SU']);

@Injectable()
export class OpenBankingService {
  constructor(
    @InjectRepository(BankConnection)
    private readonly connectionsRepository: Repository<BankConnection>,
    @InjectRepository(BankAccount)
    private readonly bankAccountsRepository: Repository<BankAccount>,
    @InjectRepository(BankTransaction)
    private readonly transactionsRepository: Repository<BankTransaction>,
    private readonly goCardless: GoCardlessService,
    private readonly configService: ConfigService,
  ) {}

  async listInstitutions(): Promise<GoCardlessInstitution[]> {
    return this.goCardless.listInstitutions('at');
  }

  async startLink(
    account: Account,
    institutionId: string,
  ): Promise<{ redirectUrl: string }> {
    const institutions = await this.goCardless.listInstitutions('at');
    const institution = institutions.find((i) => i.id === institutionId);

    const reference = `${account.id}.${randomUUID()}`;
    const appUrl = this.configService.get<string>('billing.appUrl');

    const requisition = await this.goCardless.createRequisition({
      redirectUrl: `${appUrl}/banking/callback`,
      institutionId,
      reference,
      language: 'DE',
    });

    if (!requisition.link) {
      throw new BadRequestException('GoCardless requisition has no link');
    }

    await this.connectionsRepository.save(
      this.connectionsRepository.create({
        accountId: account.id,
        reference,
        requisitionId: requisition.id,
        institutionId,
        institutionName: institution?.name ?? null,
        status: BankConnectionStatus.PENDING,
      }),
    );

    return { redirectUrl: requisition.link };
  }

  async completeLink(
    reference: string,
  ): Promise<{ status: BankConnectionStatus; connectionId: string }> {
    const connection = await this.connectionsRepository.findOne({
      where: { reference },
    });
    if (!connection || !connection.requisitionId) {
      throw new NotFoundException('Bank connection not found');
    }

    const requisition = await this.goCardless.getRequisition(
      connection.requisitionId,
    );
    const status = this.mapStatus(requisition.status);

    connection.status = status;
    connection.errorMessage =
      status === BankConnectionStatus.ERROR
        ? `GoCardless status: ${requisition.status}`
        : null;
    await this.connectionsRepository.save(connection);

    if (status === BankConnectionStatus.LINKED) {
      for (const externalAccountId of requisition.accounts ?? []) {
        const details = await this.goCardless.getAccountDetails(
          externalAccountId,
        );
        const existing = await this.bankAccountsRepository.findOne({
          where: { externalAccountId },
        });

        await this.bankAccountsRepository.save(
          this.bankAccountsRepository.create({
            ...existing,
            connectionId: connection.id,
            externalAccountId,
            iban: details.account?.iban ?? null,
            currency: details.account?.currency ?? null,
            ownerName:
              details.account?.ownerName ?? details.account?.name ?? null,
          }),
        );
      }
    }

    return { status: connection.status, connectionId: connection.id };
  }

  async syncTransactions(
    account: Account,
    connectionId: string,
  ): Promise<{ imported: number }> {
    const connection = await this.getOwnedConnection(account, connectionId);
    const bankAccounts = await this.bankAccountsRepository.find({
      where: { connectionId: connection.id },
    });

    let imported = 0;
    for (const bankAccount of bankAccounts) {
      const response = await this.goCardless.getAccountTransactions(
        bankAccount.externalAccountId,
      );
      const booked = response.transactions?.booked ?? [];

      const values = booked
        .filter((txn) => !!txn.transactionId)
        .map((txn) => ({
          bankAccountId: bankAccount.id,
          externalTransactionId: txn.transactionId as string,
          bookingDate: txn.bookingDate ?? null,
          amount: txn.transactionAmount?.amount ?? '0',
          currency: txn.transactionAmount?.currency ?? 'EUR',
          remittanceInfo: txn.remittanceInformationUnstructured ?? null,
          counterpartyName: txn.creditorName ?? txn.debtorName ?? null,
          rawPayload: txn as Record<string, unknown>,
        }));

      if (values.length > 0) {
        // TypeORM's QueryDeepPartialEntity no soporta bien columnas jsonb
        // tipadas como Record<string, unknown> (rawPayload) -- cast puntual.
        const result = await this.transactionsRepository
          .createQueryBuilder()
          .insert()
          .into(BankTransaction)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .values(values as any)
          .orIgnore()
          .execute();
        imported += result.identifiers.length;
      }

      bankAccount.lastSyncedAt = new Date();
      await this.bankAccountsRepository.save(bankAccount);
    }

    return { imported };
  }

  async listConnections(account: Account): Promise<BankConnection[]> {
    return this.connectionsRepository.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
    });
  }

  async listTransactions(
    account: Account,
    connectionId?: string,
  ): Promise<BankTransaction[]> {
    const connections = connectionId
      ? [await this.getOwnedConnection(account, connectionId)]
      : await this.listConnections(account);

    const connectionIds = connections.map((c) => c.id);
    if (connectionIds.length === 0) {
      return [];
    }

    const bankAccounts = await this.bankAccountsRepository
      .createQueryBuilder('ba')
      .where('ba."connectionId" IN (:...connectionIds)', { connectionIds })
      .getMany();

    const bankAccountIds = bankAccounts.map((a) => a.id);
    if (bankAccountIds.length === 0) {
      return [];
    }

    return this.transactionsRepository
      .createQueryBuilder('t')
      .where('t."bankAccountId" IN (:...bankAccountIds)', { bankAccountIds })
      .orderBy('t."bookingDate"', 'DESC')
      .getMany();
  }

  private async getOwnedConnection(
    account: Account,
    connectionId: string,
  ): Promise<BankConnection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
    });
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }
    if (connection.accountId !== account.id) {
      throw new ForbiddenException(
        'This bank connection does not belong to your account',
      );
    }
    return connection;
  }

  private mapStatus(gocardlessStatus: string): BankConnectionStatus {
    if (LINKED_STATUSES.has(gocardlessStatus)) {
      return BankConnectionStatus.LINKED;
    }
    if (EXPIRED_STATUSES.has(gocardlessStatus)) {
      return BankConnectionStatus.EXPIRED;
    }
    if (ERROR_STATUSES.has(gocardlessStatus)) {
      return BankConnectionStatus.ERROR;
    }
    return BankConnectionStatus.PENDING;
  }
}
