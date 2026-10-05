import { ForbiddenException } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';

// Solo se usan como tokens; los paquetes de auth cargan ESM que Jest no procesa.
jest.mock('../auth/accounts.service', () => ({ AccountsService: class {} }));
jest.mock('../auth/guards/account-auth.guard', () => ({
  AccountAuthGuard: class {},
}));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

function build(isPro: boolean) {
  const accounts = { isPro: jest.fn().mockReturnValue(isPro) };
  const receipts = {
    list: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockImplementation((_id: string, dto: object) =>
        Promise.resolve({ id: 'r-1', ...dto }),
      ),
    import: jest.fn().mockResolvedValue(2),
    remove: jest.fn().mockResolvedValue(undefined),
    removeAll: jest.fn().mockResolvedValue(undefined),
  };
  return {
    controller: new ReceiptsController(accounts as never, receipts as never),
    receipts,
  };
}

const account = { id: 'a-1' } as never;
const receiptId = 'b0c6c2a4-1b4f-4f43-9d1e-7a3c0a7f1e11';

function expectProRequired(fn: () => unknown): void {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ForbiddenException);
  expect((caught as ForbiddenException).getResponse()).toMatchObject({
    code: 'PRO_REQUIRED',
  });
}

describe('ReceiptsController', () => {
  it('sin Pro responde 403 con el codigo PRO_REQUIRED', () => {
    const { controller } = build(false);
    expectProRequired(() => controller.parse(account, { text: 'Summe 5,00' }));
  });

  it('con Pro devuelve los campos extraidos', () => {
    const { controller } = build(true);

    const result = controller.parse(account, {
      text: 'ÖBB Personenverkehr AG\nDatum 21.06.2026\nPreis inkl. 10% USt 27,90\nZu zahlen 27,90',
    });

    expect(result.total.value).toBe(27.9);
    expect(result.category).toBe('travel');
  });

  it('guardar e importar exigen Pro', async () => {
    const { controller, receipts } = build(false);
    expectProRequired(() => controller.create(account, { category: 'other' }));
    await expect(
      controller.import(account, { receipts: [] }),
    ).rejects.toMatchObject({ response: { code: 'PRO_REQUIRED' } });
    expect(receipts.create).not.toHaveBeenCalled();
    expect(receipts.import).not.toHaveBeenCalled();
  });

  it('sin Pro se pueden ver y borrar los recibos ya guardados (RGPD)', async () => {
    const { controller, receipts } = build(false);
    await controller.list(account, { year: 2026 });
    await controller.remove(account, receiptId);
    await controller.removeAll(account);
    expect(receipts.list).toHaveBeenCalledWith('a-1', 2026);
    expect(receipts.remove).toHaveBeenCalledWith('a-1', receiptId);
    expect(receipts.removeAll).toHaveBeenCalledWith('a-1');
  });

  it('con Pro guarda el recibo en la cuenta del usuario', async () => {
    const { controller, receipts } = build(true);
    await controller.create(account, { category: 'travel', total: 27.9 });
    expect(receipts.create).toHaveBeenCalledWith('a-1', {
      category: 'travel',
      total: 27.9,
    });
  });
});
