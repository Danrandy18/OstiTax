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
    setPassword: jest.fn(),
    setPasswordResetToken: jest.fn(),
    updateLocale: jest.fn(),
  };
  const mail = {
    sendPasswordReset: jest.fn(),
    sendPasswordChanged: jest.fn(),
    isConfigured: jest.fn(() => !!config['mailConfigured']),
  };
  const configService = {
    get: (key: string, fallback?: unknown) => config[key] ?? fallback,
  } as unknown as ConfigService;
  const jwt = { sign: jest.fn(() => 'new-token') };
  const service = new AuthService(
    accounts as never,
    jwt as never,
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
    expect(accounts.setPassword).not.toHaveBeenCalled();
  });

  it('con código y sin correo, forgotPassword pide el código sin buscar la cuenta', async () => {
    const { service, accounts, mail } = build(withCode);
    expect(await service.forgotPassword('a@b.com')).toBe('code');
    expect(accounts.findByEmail).not.toHaveBeenCalled();
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('con Resend configurado el código se ignora aunque la variable siga puesta', async () => {
    const { service, accounts } = build({
      ...withCode,
      mailConfigured: true,
    });
    expect(service.isTestCodeResetEnabled()).toBe(false);
    await expect(
      service.resetPasswordWithTestCode('a@b.com', TEST_CODE, 'nueva-clave-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(accounts.setPassword).not.toHaveBeenCalled();
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
    expect(accounts.setPassword).toHaveBeenCalledWith(
      'acc-1',
      'hashed:nueva-clave-1',
      expect.any(Date),
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
    expect(accounts.setPassword).not.toHaveBeenCalled();
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

    expect(accounts.setPassword).not.toHaveBeenCalled();
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
    expect(accounts.setPassword).not.toHaveBeenCalled();
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
    expect(accounts.setPassword).toHaveBeenCalledWith(
      'acc-2',
      'hashed:nueva-clave-1',
      expect.any(Date),
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

describe('AuthService — cambiar contraseña con sesión iniciada', () => {
  const compare = bcrypt.compare as jest.Mock;
  beforeEach(() => jest.clearAllMocks());

  const account = () =>
    ({
      id: 'acc-9',
      email: 'ana@example.com',
      passwordHash: 'old-hash',
      locale: 'es',
    }) as never;

  it('con la contraseña actual correcta la cambia, avisa por correo y da un token nuevo', async () => {
    const { service, accounts, mail } = build({});
    compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await service.changePassword(
      account(),
      'vieja',
      'nueva-clave-9',
    );

    expect(accounts.setPassword).toHaveBeenCalledWith(
      'acc-9',
      'hashed:nueva-clave-9',
      expect.any(Date),
    );
    const [[, , changedAt]] = accounts.setPassword.mock.calls as [
      [string, string, Date],
    ];
    // Redondeado al segundo: el token nuevo (iat en segundos) sigue valiendo.
    expect(changedAt.getMilliseconds()).toBe(0);
    expect(mail.sendPasswordChanged).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', locale: 'es' }),
      changedAt,
    );
    expect(result.accessToken).toBe('new-token');
  });

  it('con la contraseña actual equivocada no cambia nada', async () => {
    const { service, accounts, mail } = build({});
    compare.mockResolvedValue(false);

    await expect(
      service.changePassword(account(), 'mal', 'nueva-clave-9'),
    ).rejects.toMatchObject({ response: { code: 'WRONG_PASSWORD' } });
    expect(accounts.setPassword).not.toHaveBeenCalled();
    expect(mail.sendPasswordChanged).not.toHaveBeenCalled();
  });

  it('rechaza repetir la misma contraseña', async () => {
    const { service, accounts } = build({});
    compare.mockResolvedValue(true);

    await expect(
      service.changePassword(account(), 'igual', 'igual-1234'),
    ).rejects.toMatchObject({ response: { code: 'SAME_PASSWORD' } });
    expect(accounts.setPassword).not.toHaveBeenCalled();
  });

  it('bloquea tras 5 intentos con la contraseña actual equivocada', async () => {
    const { service } = build({});
    compare.mockResolvedValue(false);
    for (let i = 0; i < 5; i++) {
      await expect(
        service.changePassword(account(), `mal-${i}`, 'nueva-clave-9'),
      ).rejects.toMatchObject({ response: { code: 'WRONG_PASSWORD' } });
    }
    await expect(
      service.changePassword(account(), 'vieja', 'nueva-clave-9'),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('las cuentas solo de Google no tienen contraseña que cambiar', async () => {
    const { service } = build({});
    await expect(
      service.changePassword(
        { id: 'g', passwordHash: null } as never,
        'x',
        'nueva-clave-9',
      ),
    ).rejects.toMatchObject({ response: { code: 'NO_PASSWORD' } });
  });

  it('"olvidé mi contraseña" solo se ofrece si puede completarse', () => {
    expect(build({}).service.isPasswordResetAvailable()).toBe(false);
    expect(
      build({ mailConfigured: true }).service.isPasswordResetAvailable(),
    ).toBe(true);
    expect(build(withCode).service.isPasswordResetAvailable()).toBe(true);
  });

  it('el correo de recuperación sale en el idioma de la página que lo pidió', async () => {
    const { service, accounts, mail } = build({
      mailConfigured: true,
      'billing.appUrl': 'https://xn--stitax-vxa.at',
    });
    const acc = {
      id: 'acc-1',
      email: 'a@b.com',
      passwordHash: 'h',
      locale: 'de',
    };
    accounts.findByEmail.mockResolvedValue(acc);

    await service.forgotPassword('a@b.com', 'tr');

    expect(accounts.updateLocale).toHaveBeenCalledWith(acc, 'tr');
    expect(mail.sendPasswordReset).toHaveBeenCalledWith(
      acc,
      expect.stringMatching(
        /^https:\/\/xn--stitax-vxa\.at\/reset-password\?token=[0-9a-f]{64}$/,
      ),
      60,
    );
  });
});
