import { intervalFromPeriod } from '../billing-interval.util';
import { StripeBillingService } from './stripe-billing.service';

// Solo se usan como tokens de inyeccion; los paquetes cargan ESM que Jest no procesa.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('../../auth/accounts.service', () => ({ AccountsService: class {} }));
jest.mock('../../auth/mail.service', () => ({ MailService: class {} }));
jest.mock('../webhooks/webhook-events.service', () => ({
  WebhookEventsService: class {},
}));

const future = Math.floor(Date.now() / 1000) + 20 * 86_400;
const account = {
  id: 'a-1',
  email: 'ana@example.com',
  locale: 'es',
  stripeCustomerId: 'cus_1',
  subscriptionCancelAtPeriodEnd: false,
};

function build() {
  const accounts = {
    findByStripeSubscriptionId: jest.fn(() => Promise.resolve({ ...account })),
    findByStripeCustomerId: jest.fn(() => Promise.resolve({ ...account })),
    findById: jest.fn(() => Promise.resolve({ ...account })),
    activatePro: jest.fn((_id: string, p: { cancelAtPeriodEnd?: boolean }) =>
      Promise.resolve({
        ...account,
        subscriptionCancelAtPeriodEnd: p.cancelAtPeriodEnd ?? false,
        subscriptionCurrentPeriodEnd: new Date(future * 1000),
      }),
    ),
    downgradeToFree: jest.fn(),
    updateSubscriptionStatus: jest.fn(),
  };
  const mail = {
    sendSubscriptionCanceled: jest.fn(),
    sendPaymentReceipt: jest.fn(),
  };
  const events = { markProcessedIfNew: jest.fn(() => Promise.resolve(true)) };
  const service = new StripeBillingService(
    { get: () => undefined } as never,
    accounts as never,
    events as never,
    mail as never,
  );
  return { service, accounts, mail };
}

const subscription = (over: Record<string, unknown> = {}) => ({
  id: 'sub_1',
  status: 'active',
  customer: 'cus_1',
  metadata: {},
  cancel_at_period_end: false,
  cancel_at: null,
  items: { data: [{ current_period_end: future }] },
  ...over,
});

function event(type: string, object: unknown, previous?: unknown) {
  return {
    id: `evt_${Math.random()}`,
    type,
    data: { object, previous_attributes: previous },
  } as never;
}

describe('StripeBillingService — correos', () => {
  it('confirma la cancelacion una vez, al programarla, con la fecha hasta la que sigue Pro', async () => {
    const { service, accounts, mail } = build();

    await service.handleWebhookEvent(
      event(
        'customer.subscription.updated',
        subscription({ cancel_at_period_end: true }),
        { cancel_at_period_end: false },
      ),
    );

    expect(accounts.activatePro).toHaveBeenCalledWith(
      'a-1',
      expect.objectContaining({ cancelAtPeriodEnd: true }),
    );
    expect(mail.sendSubscriptionCanceled).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com' }),
      new Date(future * 1000),
    );
  });

  it('tambien detecta la cancelacion con fecha fija del portal de Stripe', async () => {
    const { service, mail } = build();
    await service.handleWebhookEvent(
      event(
        'customer.subscription.updated',
        subscription({ cancel_at: future }),
        { cancel_at: null },
      ),
    );
    expect(mail.sendSubscriptionCanceled).toHaveBeenCalledTimes(1);
  });

  it('una renovacion u otro cambio no envia correo de cancelacion', async () => {
    const { service, mail } = build();
    await service.handleWebhookEvent(
      event('customer.subscription.updated', subscription(), {
        items: {},
      }),
    );
    expect(mail.sendSubscriptionCanceled).not.toHaveBeenCalled();
  });

  it('al terminar una cancelacion ya avisada no se repite el correo', async () => {
    const { service, accounts, mail } = build();
    accounts.findByStripeSubscriptionId.mockResolvedValueOnce({
      ...account,
      subscriptionCancelAtPeriodEnd: true,
    });
    await service.handleWebhookEvent(
      event('customer.subscription.deleted', subscription()),
    );
    expect(accounts.downgradeToFree).toHaveBeenCalledWith('a-1');
    expect(mail.sendSubscriptionCanceled).not.toHaveBeenCalled();
  });

  it('una cancelacion inmediata avisa con Pro ya terminado', async () => {
    const { service, mail } = build();
    await service.handleWebhookEvent(
      event('customer.subscription.deleted', subscription()),
    );
    expect(mail.sendSubscriptionCanceled).toHaveBeenCalledWith(
      expect.anything(),
      null,
    );
  });

  it('cada cobro envia el recibo con importe, plan y enlaces a la factura', async () => {
    const { service, mail } = build();
    const start = 1_790_000_000;
    await service.handleWebhookEvent(
      event('invoice.paid', {
        amount_paid: 399,
        currency: 'eur',
        customer: 'cus_1',
        number: 'OST-0001',
        hosted_invoice_url: 'https://invoice.stripe.com/i/x',
        invoice_pdf: 'https://pay.stripe.com/invoice/x/pdf',
        status_transitions: { paid_at: start },
        parent: { subscription_details: { subscription: 'sub_1' } },
        lines: {
          data: [{ period: { start, end: start + 31 * 86_400 } }],
        },
      }),
    );
    expect(mail.sendPaymentReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com' }),
      expect.objectContaining({
        amount: 3.99,
        currency: 'eur',
        interval: 'monthly',
        invoiceNumber: 'OST-0001',
        provider: 'Stripe',
        invoiceUrl: 'https://invoice.stripe.com/i/x',
        invoicePdfUrl: 'https://pay.stripe.com/invoice/x/pdf',
      }),
    );
  });

  it('una factura de 0 € (p. ej. prueba gratis) no envia recibo', async () => {
    const { service, mail } = build();
    await service.handleWebhookEvent(
      event('invoice.paid', { amount_paid: 0, currency: 'eur' }),
    );
    expect(mail.sendPaymentReceipt).not.toHaveBeenCalled();
  });
});

describe('intervalFromPeriod', () => {
  const day = 86_400_000;
  const start = new Date('2026-01-01T00:00:00Z');
  it.each([
    [31, 'monthly'],
    [28, 'monthly'],
    [181, 'semiannual'],
    [365, 'yearly'],
    [10, null],
  ])('%i dias -> %s', (days, expected) => {
    expect(
      intervalFromPeriod(start, new Date(start.getTime() + days * day)),
    ).toBe(expected);
  });
});
