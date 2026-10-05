import { SubscriptionProvider, UserPlan } from '../users/enums/user-plan.enum';
import { AccountsService } from './accounts.service';
import { issuedBeforePasswordChange } from './guards/account-auth.guard';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('./mail.service', () => ({ MailService: class {} }));
// Solo se necesita la funcion pura del guard; sus dependencias cargan ESM que Jest no procesa.
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));

const future = () => new Date(Date.now() + 30 * 86_400_000);

function build(stored: Record<string, unknown>) {
  const repo = {
    findOneOrFail: jest.fn(() => Promise.resolve({ ...stored })),
    save: jest.fn((account: unknown) => Promise.resolve(account)),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
  const mail = { sendProWelcome: jest.fn() };
  return {
    service: new AccountsService(repo as never, mail as never),
    repo,
    mail,
  };
}

const activation = {
  provider: SubscriptionProvider.STRIPE,
  subscriptionId: 'sub_1',
  status: 'active',
  currentPeriodEnd: future(),
};

describe('AccountsService — bienvenida a Pro', () => {
  it('se envia al pasar de gratis a Pro, en el idioma de la cuenta', async () => {
    const { service, mail } = build({
      id: 'a-1',
      email: 'ana@example.com',
      locale: 'tr',
      plan: UserPlan.FREE,
    });

    await service.activatePro('a-1', activation);

    expect(mail.sendProWelcome).toHaveBeenCalledTimes(1);
    expect(mail.sendProWelcome).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', locale: 'tr' }),
      activation.currentPeriodEnd,
    );
  });

  it('no se repite en las renovaciones (ya era Pro)', async () => {
    const { service, mail } = build({
      id: 'a-1',
      plan: UserPlan.PRO,
      subscriptionProvider: SubscriptionProvider.STRIPE,
      subscriptionStatus: 'active',
      subscriptionCurrentPeriodEnd: future(),
    });

    await service.activatePro('a-1', activation);

    expect(mail.sendProWelcome).not.toHaveBeenCalled();
  });

  it('si otro webhook ya la reclamo, no se envia dos veces', async () => {
    const { service, repo, mail } = build({ id: 'a-1', plan: UserPlan.FREE });
    repo.update.mockResolvedValueOnce({ affected: 0 });

    await service.activatePro('a-1', activation);

    expect(mail.sendProWelcome).not.toHaveBeenCalled();
  });

  it('guarda si la suscripcion esta cancelada a fin de periodo', async () => {
    const { service, repo } = build({ id: 'a-1', plan: UserPlan.FREE });
    await service.activatePro('a-1', {
      ...activation,
      cancelAtPeriodEnd: true,
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionCancelAtPeriodEnd: true }),
    );
  });
});

describe('AccountsService — idioma', () => {
  it('solo acepta los 6 idiomas de la UI', async () => {
    const { service, repo } = build({});
    const account = { id: 'a-1', locale: 'de' } as never;

    await service.updateLocale(account, 'fr');
    await service.updateLocale(account, undefined);
    expect(repo.update).not.toHaveBeenCalled();

    await service.updateLocale(account, 'uk');
    expect(repo.update).toHaveBeenCalledWith({ id: 'a-1' }, { locale: 'uk' });
  });
});

describe('sesiones tras cambiar la contraseña', () => {
  const changedAt = new Date('2026-10-05T10:00:00Z');
  const iat = changedAt.getTime() / 1000;

  it('los tokens anteriores al cambio dejan de valer; el nuevo sigue valiendo', () => {
    const account = { passwordChangedAt: changedAt };
    expect(issuedBeforePasswordChange({ iat: iat - 60 }, account)).toBe(true);
    expect(issuedBeforePasswordChange({ iat }, account)).toBe(false);
    expect(issuedBeforePasswordChange({ iat: iat + 5 }, account)).toBe(false);
  });

  it('sin cambio de contraseña no se invalida nada', () => {
    expect(
      issuedBeforePasswordChange({ iat: 1 }, { passwordChangedAt: null }),
    ).toBe(false);
  });
});
