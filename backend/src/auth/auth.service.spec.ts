import { BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
  compare: jest.fn(),
}));
// El servicio solo usa estas clases como tokens de inyeccion; @nestjs/config es ESM y Jest no lo carga.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
jest.mock('./accounts.service', () => ({ AccountsService: class {} }));
jest.mock('./mail.service', () => ({ MailService: class {} }));

const TEST_CODE = 'TEST-CODE-0123456789';

function build(config: Record<string, unknown>) {
  const accounts = {
    findByEmail: jest.fn(),
    resetPassword: jest.fn(),
    setPasswordResetToken: jest.fn(),
  };
  const mail = { sendPasswordResetEmail: jest.fn() };
  const configService = {
    get: (key: string, fallback?: unknown) => config[key] ?? fallback,
  } as unknown as ConfigService;
  const service = new AuthService(
    accounts as never,
    {} as never,
    configService,
    mail as never,
  );
  return { service, accounts, mail };
}

const withCode = { 'auth.passwordResetTestCode': TEST_CODE };

describe('AuthService — restablecer contraseña con código de prueba', () => {
  beforeEach(() => jest.clearAllMocks());

  it('está apagado por defecto: sin variable no hay modo código', async () => {
    const { service, accounts } = build({});
    expect(service.isTestCodeResetEnabled()).toBe(false);
    expect(await service.forgotPassword('a@b.com')).toBe('email');
    await expect(
      service.resetPasswordWithTestCode('a@b.com', TEST_CODE, 'nueva-clave-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(accounts.resetPassword).not.toHaveBeenCalled();
  });

  it('con código y sin SMTP, forgotPassword pide el código sin buscar la cuenta', async () => {
    const { service, accounts, mail } = build(withCode);
    expect(await service.forgotPassword('a@b.com')).toBe('code');
    expect(accounts.findByEmail).not.toHaveBeenCalled();
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('con SMTP configurado el código se ignora aunque la variable siga puesta', async () => {
    const { service, accounts } = build({
      ...withCode,
      'auth.smtp.host': 'smtp.example.com',
    });
    expect(service.isTestCodeResetEnabled()).toBe(false);
    await expect(
      service.resetPasswordWithTestCode('a@b.com', TEST_CODE, 'nueva-clave-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(accounts.resetPassword).not.toHaveBeenCalled();
  });

  it('con el código correcto cambia la contraseña', async () => {
    const { service, accounts } = build(withCode);
    accounts.findByEmail.mockResolvedValue({
      id: 'acc-1',
      passwordHash: 'old',
    });

    await service.resetPasswordWithTestCode(
      'A@B.com ',
      ` ${TEST_CODE} `,
      'nueva-clave-1',
    );

    expect(accounts.findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('nueva-clave-1', 12);
    expect(accounts.resetPassword).toHaveBeenCalledWith(
      'acc-1',
      'hashed:nueva-clave-1',
    );
  });

  it('con un código incorrecto no cambia nada y da el error genérico', async () => {
    const { service, accounts } = build(withCode);
    accounts.findByEmail.mockResolvedValue({
      id: 'acc-1',
      passwordHash: 'old',
    });

    await expect(
      service.resetPasswordWithTestCode(
        'a@b.com',
        'otro-codigo',
        'nueva-clave-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'INVALID_RESET_CODE' } });
    expect(accounts.resetPassword).not.toHaveBeenCalled();
  });

  it('cuenta inexistente o solo Google: mismo error que un código malo', async () => {
    const { service, accounts } = build(withCode);

    accounts.findByEmail.mockResolvedValueOnce(null);
    await expect(
      service.resetPasswordWithTestCode(
        'no@existe.com',
        TEST_CODE,
        'nueva-clave-1',
      ),
    ).rejects.toMatchObject({ response: { code: 'INVALID_RESET_CODE' } });

    accounts.findByEmail.mockResolvedValueOnce({
      id: 'g-1',
      passwordHash: null,
    });
    await expect(
      service.resetPasswordWithTestCode('g@b.com', TEST_CODE, 'nueva-clave-1'),
    ).rejects.toMatchObject({ response: { code: 'INVALID_RESET_CODE' } });

    expect(accounts.resetPassword).not.toHaveBeenCalled();
  });

  it('bloquea tras 5 fallos por correo, incluso con el código correcto', async () => {
    const { service, accounts } = build(withCode);
    accounts.findByEmail.mockResolvedValue({
      id: 'acc-1',
      passwordHash: 'old',
    });

    for (let i = 0; i < 5; i++) {
      await expect(
        service.resetPasswordWithTestCode(
          'a@b.com',
          `mal-${i}`,
          'nueva-clave-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }

    const blocked = service.resetPasswordWithTestCode(
      'a@b.com',
      TEST_CODE,
      'nueva-clave-1',
    );
    await expect(blocked).rejects.toBeInstanceOf(HttpException);
    await expect(blocked).rejects.toMatchObject({ status: 429 });
    expect(accounts.resetPassword).not.toHaveBeenCalled();
  });

  it('el bloqueo de un correo no afecta a otro', async () => {
    const { service, accounts } = build(withCode);
    accounts.findByEmail.mockResolvedValue({
      id: 'acc-2',
      passwordHash: 'old',
    });

    for (let i = 0; i < 5; i++) {
      await expect(
        service.resetPasswordWithTestCode(
          'a@b.com',
          `mal-${i}`,
          'nueva-clave-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }

    await service.resetPasswordWithTestCode(
      'otro@b.com',
      TEST_CODE,
      'nueva-clave-1',
    );
    expect(accounts.resetPassword).toHaveBeenCalledWith(
      'acc-2',
      'hashed:nueva-clave-1',
    );
  });

  it('un tope global frena a quien prueba con muchos correos distintos', async () => {
    const { service } = build(withCode);

    for (let i = 0; i < 30; i++) {
      await expect(
        service.resetPasswordWithTestCode(
          `u${i}@b.com`,
          'mal',
          'nueva-clave-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }

    await expect(
      service.resetPasswordWithTestCode('nuevo@b.com', 'mal', 'nueva-clave-1'),
    ).rejects.toMatchObject({ status: 429 });
  });
});
