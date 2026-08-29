import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SubscriptionProvider, UserPlan } from './enums/user-plan.enum';

const ACTIVE_STRIPE_STATUSES = new Set(['active', 'trialing', 'past_due']);
const ACTIVE_PAYPAL_STATUSES = new Set(['ACTIVE', 'APPROVED']);

export interface ActivateProParams {
  provider: SubscriptionProvider;
  subscriptionId: string;
  status: string;
  currentPeriodEnd?: Date | null;
  stripeCustomerId?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findOrCreateByDeviceId(deviceId: string): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { deviceId } });
    if (existing) {
      return this.refreshExpiredPro(existing);
    }

    const freeAttempts = this.configService.get<number>(
      'billing.freeAttempts',
      3,
    );

    return this.usersRepository.save(
      this.usersRepository.create({
        deviceId,
        plan: UserPlan.FREE,
        freeAttemptsRemaining: freeAttempts,
      }),
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByStripeCustomerId(customerId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });
  }

  async findByStripeSubscriptionId(
    subscriptionId: string,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });
  }

  async findByPaypalSubscriptionId(
    subscriptionId: string,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { paypalSubscriptionId: subscriptionId },
    });
  }

  isPro(user: User): boolean {
    if (user.plan !== UserPlan.PRO) {
      return false;
    }

    if (
      user.subscriptionCurrentPeriodEnd &&
      user.subscriptionCurrentPeriodEnd.getTime() < Date.now()
    ) {
      return false;
    }

    if (!user.subscriptionStatus) {
      return false;
    }

    if (user.subscriptionProvider === SubscriptionProvider.STRIPE) {
      return ACTIVE_STRIPE_STATUSES.has(user.subscriptionStatus);
    }

    if (user.subscriptionProvider === SubscriptionProvider.PAYPAL) {
      return ACTIVE_PAYPAL_STATUSES.has(user.subscriptionStatus);
    }

    return false;
  }

  async decrementFreeAttempt(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    if (this.isPro(user) || user.freeAttemptsRemaining <= 0) {
      return user;
    }

    user.freeAttemptsRemaining -= 1;
    return this.usersRepository.save(user);
  }

  async activatePro(userId: string, params: ActivateProParams): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    user.plan = UserPlan.PRO;
    user.subscriptionProvider = params.provider;
    user.subscriptionStatus = params.status;
    user.subscriptionCurrentPeriodEnd = params.currentPeriodEnd ?? null;

    if (params.provider === SubscriptionProvider.STRIPE) {
      user.stripeSubscriptionId = params.subscriptionId;
      if (params.stripeCustomerId) {
        user.stripeCustomerId = params.stripeCustomerId;
      }
      user.paypalSubscriptionId = null;
    } else {
      user.paypalSubscriptionId = params.subscriptionId;
      user.stripeSubscriptionId = null;
    }

    return this.usersRepository.save(user);
  }

  async updateSubscriptionStatus(
    userId: string,
    status: string,
    currentPeriodEnd?: Date | null,
  ): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    user.subscriptionStatus = status;
    if (currentPeriodEnd !== undefined) {
      user.subscriptionCurrentPeriodEnd = currentPeriodEnd;
    }

    const stillPro =
      user.subscriptionProvider === SubscriptionProvider.STRIPE
        ? ACTIVE_STRIPE_STATUSES.has(status)
        : user.subscriptionProvider === SubscriptionProvider.PAYPAL
          ? ACTIVE_PAYPAL_STATUSES.has(status)
          : false;

    if (!stillPro) {
      user.plan = UserPlan.FREE;
    }

    return this.usersRepository.save(user);
  }

  /** Solo para pruebas manuales en desarrollo (ver DeviceUserGuard + NODE_ENV en el controller). */
  async resetFreeAttemptsForTesting(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    user.freeAttemptsRemaining = this.configService.get<number>(
      'billing.freeAttempts',
      3,
    );
    return this.usersRepository.save(user);
  }

  async downgradeToFree(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    user.plan = UserPlan.FREE;
    user.subscriptionProvider = null;
    user.subscriptionStatus = null;
    user.subscriptionCurrentPeriodEnd = null;
    user.stripeSubscriptionId = null;
    user.paypalSubscriptionId = null;

    return this.usersRepository.save(user);
  }

  async setStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });
    user.stripeCustomerId = stripeCustomerId;
    return this.usersRepository.save(user);
  }

  private async refreshExpiredPro(user: User): Promise<User> {
    if (user.plan === UserPlan.PRO && !this.isPro(user)) {
      return this.downgradeToFree(user.id);
    }
    return user;
  }
}
