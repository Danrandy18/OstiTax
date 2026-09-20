import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UserPlan } from './enums/user-plan.enum';

// Solo se usan como tokens de inyeccion; ambos paquetes se cargan como ESM y Jest no los procesa.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

const HOUR = 60 * 60 * 1000;

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u-1',
    deviceId: 'dev-1',
    plan: UserPlan.FREE,
    freeAttemptsRemaining: 3,
    freeAttemptsWindowStartedAt: null,
    subscriptionProvider: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    ...overrides,
  };
}

function build(config: Record<string, number> = {}) {
  const repo = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(async (user: unknown) => user),
    create: jest.fn((user: unknown) => user),
  };
  const configService = {
    get: (key: string, fallback?: number) => config[key] ?? fallback,
  } as unknown as ConfigService;
  const service = new UsersService(repo as never, configService);
  return { service, repo };
}

describe('UsersService — reinicio de intentos gratis', () => {
  beforeEach(() => jest.clearAllMocks());

  it('un usuario nuevo empieza con 3 intentos y sin ventana', async () => {
    const { service, repo } = build();
    repo.findOne.mockResolvedValue(null);

    const user = await service.findOrCreateByDeviceId('nuevo');

    expect(user.freeAttemptsRemaining).toBe(3);
    expect(service.freeAttemptsResetAt(user)).toBeNull();
  });

  it('el primer intento gastado abre la ventana de 24 h', async () => {
    const { service, repo } = build();
    repo.findOneOrFail.mockResolvedValue(makeUser());

    const before = Date.now();
    const user = await service.decrementFreeAttempt('u-1');

    expect(user.freeAttemptsRemaining).toBe(2);
    expect(user.freeAttemptsWindowStartedAt).toBeInstanceOf(Date);
    const resetAt = new Date(service.freeAttemptsResetAt(user)!).getTime();
    expect(resetAt).toBeGreaterThanOrEqual(before + 24 * HOUR);
    expect(resetAt).toBeLessThan(Date.now() + 24 * HOUR + 1000);
  });

  it('gastar más intentos no mueve el inicio de la ventana', async () => {
    const { service, repo } = build();
    const started = new Date(Date.now() - 3 * HOUR);
    repo.findOneOrFail.mockResolvedValue(
      makeUser({
        freeAttemptsRemaining: 2,
        freeAttemptsWindowStartedAt: started,
      }),
    );

    const user = await service.decrementFreeAttempt('u-1');

    expect(user.freeAttemptsRemaining).toBe(1);
    expect(user.freeAttemptsWindowStartedAt).toBe(started);
  });

  it('antes de las 24 h los intentos siguen agotados', async () => {
    const { service, repo } = build();
    repo.findOne.mockResolvedValue(
      makeUser({
        freeAttemptsRemaining: 0,
        freeAttemptsWindowStartedAt: new Date(Date.now() - 23 * HOUR),
      }),
    );

    const user = await service.findOrCreateByDeviceId('dev-1');

    expect(user.freeAttemptsRemaining).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('pasadas las 24 h se restauran los 3 intentos y se cierra la ventana', async () => {
    const { service, repo } = build();
    repo.findOne.mockResolvedValue(
      makeUser({
        freeAttemptsRemaining: 0,
        freeAttemptsWindowStartedAt: new Date(Date.now() - 24 * HOUR - 1000),
      }),
    );

    const user = await service.findOrCreateByDeviceId('dev-1');

    expect(user.freeAttemptsRemaining).toBe(3);
    expect(user.freeAttemptsWindowStartedAt).toBeNull();
    expect(service.freeAttemptsResetAt(user)).toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('quien gastó intentos antes de esta función no queda bloqueado: la ventana empieza ahora', async () => {
    const { service, repo } = build();
    repo.findOne.mockResolvedValue(
      makeUser({ freeAttemptsRemaining: 0, freeAttemptsWindowStartedAt: null }),
    );

    const user = await service.findOrCreateByDeviceId('dev-1');

    expect(user.freeAttemptsRemaining).toBe(0);
    expect(user.freeAttemptsWindowStartedAt).toBeInstanceOf(Date);
    expect(service.freeAttemptsResetAt(user)).not.toBeNull();
  });

  it('respeta un plazo distinto configurado (FREE_ATTEMPTS_RESET_HOURS)', async () => {
    const { service, repo } = build({ 'billing.freeAttemptsResetHours': 1 });
    repo.findOne.mockResolvedValue(
      makeUser({
        freeAttemptsRemaining: 0,
        freeAttemptsWindowStartedAt: new Date(Date.now() - 2 * HOUR),
      }),
    );

    const user = await service.findOrCreateByDeviceId('dev-1');

    expect(user.freeAttemptsRemaining).toBe(3);
  });

  it('un usuario Pro no se toca', async () => {
    const { service, repo } = build();
    repo.findOne.mockResolvedValue(
      makeUser({
        plan: UserPlan.PRO,
        subscriptionProvider: 'stripe',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 10 * 24 * HOUR),
        freeAttemptsRemaining: 0,
        freeAttemptsWindowStartedAt: new Date(Date.now() - 48 * HOUR),
      }),
    );

    const user = await service.findOrCreateByDeviceId('dev-1');

    expect(user.freeAttemptsRemaining).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
