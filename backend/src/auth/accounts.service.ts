import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { isSubscriptionActive } from '../common/utils/subscription-status.util';
import { SubscriptionProvider, UserPlan } from '../users/enums/user-plan.enum';
import { Account } from './entities/account.entity';
import { MailService } from './mail.service';
import { toMailLocale } from './mail/mail-i18n';

/** Tras una cancelacion y una nueva alta, se vuelve a dar la bienvenida pasado este tiempo. */
const PRO_WELCOME_COOLDOWN_MS = 24 * 60 * 60_000;

export interface ActivateAccountProParams {
  provider: SubscriptionProvider;
  subscriptionId: string;
  status: string;
  currentPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
  cancelAtPeriodEnd?: boolean;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly mailService: MailService,
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

  async findByPasswordResetTokenHash(
    tokenHash: string,
  ): Promise<Account | null> {
    return this.accountsRepository.findOne({
      where: { passwordResetTokenHash: tokenHash },
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
    locale?: string | null;
  }): Promise<Account> {
    return this.accountsRepository.save(
      this.accountsRepository.create({
        email: params.email.toLowerCase(),
        passwordHash: params.passwordHash ?? null,
        googleId: params.googleId ?? null,
        name: params.name ?? null,
        plan: UserPlan.FREE,
        locale: toMailLocale(params.locale),
      }),
    );
  }

  /**
   * Guarda el idioma con el que el usuario usa la app, para escribirle en ese idioma. Un valor
   * desconocido se ignora (nunca cae a ingles por accidente).
   */
  async updateLocale(
    account: Account,
    locale: string | null | undefined,
  ): Promise<Account> {
    if (
      !locale ||
      toMailLocale(locale) !== locale ||
      account.locale === locale
    ) {
      return account;
    }
    await this.accountsRepository.update({ id: account.id }, { locale });
    account.locale = locale;
    return account;
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
    const wasPro = this.isPro(account);

    account.plan = UserPlan.PRO;
    account.subscriptionCancelAtPeriodEnd = params.cancelAtPeriodEnd ?? false;
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

    const saved = await this.accountsRepository.save(account);
    if (
      !wasPro &&
      this.isPro(saved) &&
      (await this.claimProWelcome(saved.id))
    ) {
      await this.mailService.sendProWelcome(
        saved,
        saved.subscriptionCurrentPeriodEnd,
      );
    }
    return saved;
  }

  /**
   * Marca la bienvenida como enviada en una sola sentencia: si dos webhooks llegan a la vez,
   * solo uno la gana y el correo sale una vez.
   */
  private async claimProWelcome(accountId: string): Promise<boolean> {
    const now = new Date();
    const result = await this.accountsRepository.update(
      [
        { id: accountId, proWelcomeSentAt: IsNull() },
        {
          id: accountId,
          proWelcomeSentAt: LessThan(
            new Date(now.getTime() - PRO_WELCOME_COOLDOWN_MS),
          ),
        },
      ],
      { proWelcomeSentAt: now },
    );
    return (result.affected ?? 0) > 0;
  }

  async setCancelAtPeriodEnd(accountId: string, value: boolean): Promise<void> {
    await this.accountsRepository.update(
      { id: accountId },
      { subscriptionCancelAtPeriodEnd: value },
    );
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
    account.subscriptionCancelAtPeriodEnd = false;
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

  async setPasswordResetToken(
    accountId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.accountsRepository.update(
      { id: accountId },
      { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    );
  }

  /** Nueva contrasena: invalida enlaces de recuperacion y las sesiones abiertas antes. */
  async setPassword(
    accountId: string,
    passwordHash: string,
    changedAt: Date,
  ): Promise<void> {
    await this.accountsRepository.update(
      { id: accountId },
      {
        passwordHash,
        passwordChangedAt: changedAt,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    );
  }
}
