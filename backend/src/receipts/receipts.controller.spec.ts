import { ForbiddenException } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';

// Solo se usan como tokens; los paquetes de auth cargan ESM que Jest no procesa.
jest.mock('../auth/accounts.service', () => ({ AccountsService: class {} }));
jest.mock('../auth/guards/account-auth.guard', () => ({
  AccountAuthGuard: class {},
}));

function build(isPro: boolean) {
  const accounts = { isPro: jest.fn().mockReturnValue(isPro) };
  return new ReceiptsController(accounts as never);
}

const account = { id: 'a-1' } as never;

describe('ReceiptsController', () => {
  it('sin Pro responde 403 con el codigo PRO_REQUIRED', () => {
    const controller = build(false);

    expect(() => controller.parse(account, { text: 'Summe 5,00' })).toThrow(
      ForbiddenException,
    );
    try {
      controller.parse(account, { text: 'Summe 5,00' });
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: 'PRO_REQUIRED',
      });
    }
  });

  it('con Pro devuelve los campos extraidos', () => {
    const controller = build(true);

    const result = controller.parse(account, {
      text: 'ÖBB Personenverkehr AG\nDatum 21.06.2026\nPreis inkl. 10% USt 27,90\nZu zahlen 27,90',
    });

    expect(result.total.value).toBe(27.9);
    expect(result.category).toBe('travel');
  });
});
