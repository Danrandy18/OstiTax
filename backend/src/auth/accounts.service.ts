import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isSubscriptionActive } from '../common/utils/subscription-status.util';
import { SubscriptionProvider, UserPlan } from '../users/enums/user-plan.enum';
import { Account } from './entities/account.entity';

export interface ActivateAccountProParams {
  provider: SubscriptionProvider;
  subscriptionId: string;
  status: string;
  currentPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async findById(id: string): Promise<Account | null> {
    return this.accountsRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountsRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByGoogleId(googleId: string): Promise<Account | null> {
    return this.accountsRepository.findOne({ where: { googleId } });
  }

  async findByStripeCustomerId(customerId: string): Promise<Account | null> {
    return this.accountsRepository.findOne({
      where: { stripeCustomerId: customerId },
    });
  }

  async findByStripeSubscriptionId(
    subscriptionId: string,
  ): Promise<Account | null> {
    return this.accountsRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });
  }

  async findByPaypalSubscriptionId(
    subscriptionId: string,
  ): Promise<Account | null> {
    return this.accountsRepository.findOne({
      where: { paypalSubscriptionId: subscriptionId },
    });
  }

  isPro(account: Account): boolean {
    return isSubscriptionActive(account);
  }

  async create(params: {
    email: string;
    passwordHash?: string | null;
    googleId?: string | null;
    name?: string | null;
  }): Promise<Account> {
    return this.accountsRepository.save(
      this.accountsRepository.create({
        email: params.email.toLowerCase(),
        passwordHash: params.passwordHash ?? null,
        googleId: params.googleId ?? null,
        name: params.name ?? null,
        plan: UserPlan.FREE,
      }),
    );
  }

  async linkGoogleId(accountId: string, googleId: string): Promise<Account> {
    const account = await this.accountsRepository.findOneOrFail({
      where: { id: accountId },
    });
    account.googleId = googleId;
    return this.accountsRepository.save(account);
  }

  async activatePro(
    accountId: string,
    params: ActivateAccountProParams,
  ): Promise<Account> {
    const account = await this.accountsRepository.findOneOrFail({
      where: { id: accountId },
    });

    account.plan = UserPlan.PRO;
    account.subscriptionProvider = params.provider;
    account.subscriptionStatus = params.status;
    account.subscriptionCurrentPeriodEnd = params.currentPeriodEnd ?? null;

    if (params.provider === SubscriptionProvider.STRIPE) {
      account.stripeSubscriptionId = params.subscriptionId;
      if (params.stripeCustomerId) {
        account.stripeCustomerId = params.stripeCustomerId;
      }
      account.paypalSubscriptionId = null;
    } else {
      account.paypalSubscriptionId = params.subscriptionId;
      account.stripeSubscriptionId = null;
    }

    return this.accountsRepository.save(account);
  }

  async updateSubscriptionStatus(
    accountId: string,
    status: string,
    currentPeriodEnd?: Date | null,
  ): Promise<Account> {
    const account = await this.accountsRepository.findOneOrFail({
      where: { id: accountId },
    });

    account.subscriptionStatus = status;
    if (currentPeriodEnd !== undefined) {
      account.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }

    if (!this.isPro(account)) {
      account.plan = UserPlan.FREE;
    }

    return this.accountsRepository.save(account);
  }

  async downgradeToFree(accountId: string): Promise<Account> {
    const account = await this.accountsRepository.findOneOrFail({
      where: { id: accountId },
    });

    account.plan = UserPlan.FREE;
    account.subscriptionProvider = null;
    account.subscriptionStatus = null;
    account.subscriptionCurrentPeriodEnd = null;
    account.stripeSubscriptionId = null;
    account.paypalSubscriptionId = null;

    return this.accountsRepository.save(account);
  }

  async setStripeCustomerId(
    accountId: string,
    stripeCustomerId: string,
  ): Promise<Account> {
    const account = await this.accountsRepository.findOneOrFail({
      where: { id: accountId },
    });
    account.stripeCustomerId = stripeCustomerId;
    return this.accountsRepository.save(account);
  }

  async delete(accountId: string): Promise<void> {
    await this.accountsRepository.delete({ id: accountId });
  }
}
