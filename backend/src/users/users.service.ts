import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  isStatusStillActive,
  isSubscriptionActive,
} from '../common/utils/subscription-status.util';
import { User } from './entities/user.entity';
import { SubscriptionProvider, UserPlan } from './enums/user-plan.enum';

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
    const existing = await this.usersRepository.findOne({
      where: { deviceId },
    });
    if (existing) {
      return this.refreshFreeAttempts(await this.refreshExpiredPro(existing));
    }

    return this.usersRepository.save(
      this.usersRepository.create({
        deviceId,
        plan: UserPlan.FREE,
        freeAttemptsRemaining: this.freeAttemptsLimit(),
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
    return isSubscriptionActive(user);
  }

  async decrementFreeAttempt(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
    });

    if (this.isPro(user) || user.freeAttemptsRemaining <= 0) {
      return user;
    }

    user.freeAttemptsRemaining -= 1;
    // El primer intento gastado abre la ventana de reinicio.
    user.freeAttemptsWindowStartedAt ??= new Date();
    return this.usersRepository.save(user);
  }

  /** Cuando se restauraran los intentos gratis, o null si no se ha gastado ninguno. */
  freeAttemptsResetAt(user: User): string | null {
    if (
      !user.freeAttemptsWindowStartedAt ||
      user.freeAttemptsRemaining >= this.freeAttemptsLimit()
    ) {
      return null;
    }
    return new Date(
      user.freeAttemptsWindowStartedAt.getTime() + this.freeAttemptsResetMs(),
    ).toISOString();
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

    const stillPro = isStatusStillActive(user.subscriptionProvider, status);

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

    user.freeAttemptsRemaining = this.freeAttemptsLimit();
    user.freeAttemptsWindowStartedAt = null;
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

  private freeAttemptsLimit(): number {
    return this.configService.get<number>('billing.freeAttempts', 3);
  }

  private freeAttemptsResetMs(): number {
    const hours = this.configService.get<number>(
      'billing.freeAttemptsResetHours',
      24,
    );
    return hours * 60 * 60 * 1000;
  }

  /**
   * Los intentos gratis se restauran solos al pasar el plazo desde el primer intento gastado.
   * Se aplica al cargar al usuario (todos los endpoints pasan por aqui), sin tareas programadas.
   */
  private async refreshFreeAttempts(user: User): Promise<User> {
    if (
      this.isPro(user) ||
      user.freeAttemptsRemaining >= this.freeAttemptsLimit()
    ) {
      return user;
    }

    const now = Date.now();
    if (!user.freeAttemptsWindowStartedAt) {
      // Gasto intentos antes de existir la ventana: el plazo cuenta desde ahora, asi que no queda
      // bloqueado para siempre.
      user.freeAttemptsWindowStartedAt = new Date(now);
      return this.usersRepository.save(user);
    }

    if (
      now - user.freeAttemptsWindowStartedAt.getTime() >=
      this.freeAttemptsResetMs()
    ) {
      user.freeAttemptsRemaining = this.freeAttemptsLimit();
      user.freeAttemptsWindowStartedAt = null;
      return this.usersRepository.save(user);
    }

    return user;
  }

  private async refreshExpiredPro(user: User): Promise<User> {
    if (user.plan === UserPlan.PRO && !this.isPro(user)) {
      return this.downgradeToFree(user.id);
    }
    return user;
  }
}
