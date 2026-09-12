import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionProvider } from '../../users/enums/user-plan.enum';
import { ProcessedWebhookEvent } from '../entities/processed-webhook-event.entity';

const POSTGRES_UNIQUE_VIOLATION = '23505';

/** Deduplica eventos de webhook (Stripe/PayPal reentregan el mismo evento si no reciben 200 a tiempo). */
@Injectable()
export class WebhookEventsService {
  constructor(
    @InjectRepository(ProcessedWebhookEvent)
    private readonly repository: Repository<ProcessedWebhookEvent>,
  ) {}

  /** Devuelve true la primera vez que ve el evento; false si ya fue procesado. */
  async markProcessedIfNew(
    provider: SubscriptionProvider,
    eventId: string,
  ): Promise<boolean> {
    try {
      await this.repository.insert({ provider, eventId });
      return true;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
