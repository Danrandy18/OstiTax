import { NotFoundException } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

function build() {
  const repo = {
    create: jest.fn((entity: object) => entity),
    save: jest.fn((entity: unknown) => Promise.resolve(entity)),
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  return { service: new ReceiptsService(repo as never), repo };
}

describe('ReceiptsService', () => {
  it('decide la amortizacion (GWG) en el servidor, no en el cliente', async () => {
    const { service } = build();

    const laptop = await service.create('a-1', {
      category: 'workEquipment',
      total: 1299,
    });
    const mouse = await service.create('a-1', {
      category: 'workEquipment',
      total: 29.9,
    });
    const course = await service.create('a-1', {
      category: 'training',
      total: 1500,
    });

    expect(laptop.depreciation).toBe(true);
    expect(mouse.depreciation).toBe(false);
    expect(course.depreciation).toBe(false);
  });

  it('normaliza los campos y siempre asigna la cuenta del token', async () => {
    const { service } = build();

    const saved = await service.create('a-1', {
      category: 'other',
      merchant: '  Libro AG  ',
      date: '2026-06-21T10:00:00Z',
    });

    expect(saved).toMatchObject({
      accountId: 'a-1',
      merchant: 'Libro AG',
      date: '2026-06-21',
      total: null,
      vatRate: null,
      documentNumber: '',
    });
  });

  it('filtra por ano', async () => {
    const { service, repo } = build();
    await service.list('a-1', 2026);
    const [[{ where }]] = repo.find.mock.calls as [
      [{ where: { accountId: string; date: { value: string[] } } }],
    ];
    expect(where.accountId).toBe('a-1');
    expect(where.date.value).toEqual(['2026-01-01', '2026-12-31']);
  });

  it('solo borra recibos de la propia cuenta', async () => {
    const { service, repo } = build();
    repo.delete.mockResolvedValueOnce({ affected: 0 });

    await expect(service.remove('a-1', 'ajeno')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.delete).toHaveBeenCalledWith({ id: 'ajeno', accountId: 'a-1' });
  });

  it('importar una lista vacia no toca la base de datos', async () => {
    const { service, repo } = build();
    expect(await service.import('a-1', [])).toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
