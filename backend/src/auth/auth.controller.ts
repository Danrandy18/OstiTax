import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthService, type PasswordResetMode } from './auth.service';
import { CurrentAccount } from './decorators/current-account.decorator';
import { AccountStatusDto } from './dto/account-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import type { Account } from './entities/account.entity';
import { AccountAuthGuard } from './guards/account-auth.guard';
import { BillingService } from '../billing/billing.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => BillingService))
    private readonly billingService: BillingService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { accessToken, account } = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
      dto.locale,
    );
    return this.toResponse(accessToken, account);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { accessToken, account } = await this.authService.login(
      dto.email,
      dto.password,
      dto.locale,
    );
    return this.toResponse(accessToken, account);
  }

  @Post('google')
  async google(@Body() dto: GoogleLoginDto) {
    const { accessToken, account } = await this.authService.googleLogin(
      dto.idToken,
      dto.locale,
    );
    return this.toResponse(accessToken, account);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ ok: true; mode: PasswordResetMode }> {
    const mode = await this.authService.forgotPassword(dto.email, dto.locale);
    return { ok: true, mode };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ ok: true }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Post('reset-password/code')
  @HttpCode(200)
  async resetPasswordWithCode(
    @Body() dto: ResetPasswordWithCodeDto,
  ): Promise<{ ok: true }> {
    await this.authService.resetPasswordWithTestCode(
      dto.email,
      dto.code,
      dto.password,
    );
    return { ok: true };
  }

  /** Lo que los clientes deben mostrar segun la configuracion del servidor. */
  @Get('config')
  config(): { passwordReset: boolean; passwordResetByEmail: boolean } {
    return {
      passwordReset: this.authService.isPasswordResetAvailable(),
      // La app solo tiene el flujo por correo (no el del codigo de prueba).
      passwordResetByEmail: this.authService.isPasswordResetByEmail(),
    };
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AccountAuthGuard)
  async changePassword(
    @CurrentAccount() account: Account,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(
      account,
      dto.currentPassword,
      dto.newPassword,
    );
    return this.toResponse(result.accessToken, result.account);
  }

  /** El cliente avisa al cambiar de idioma: los correos siguientes salen en ese idioma. */
  @Patch('me')
  @UseGuards(AccountAuthGuard)
  async updateMe(
    @CurrentAccount() account: Account,
    @Body() dto: UpdateMeDto,
  ): Promise<AccountStatusDto> {
    const updated = await this.accountsService.updateLocale(
      account,
      dto.locale,
    );
    return AccountStatusDto.fromEntity(
      updated,
      this.accountsService.isPro(updated),
    );
  }

  @Get('me')
  @UseGuards(AccountAuthGuard)
  me(@CurrentAccount() account: Account): AccountStatusDto {
    return AccountStatusDto.fromEntity(
      account,
      this.accountsService.isPro(account),
    );
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(AccountAuthGuard)
  async deleteMe(@CurrentAccount() account: Account): Promise<void> {
    await this.billingService.cancelActiveSubscription(account);
    await this.accountsService.delete(account.id);
  }

  private toResponse(accessToken: string, account: Account) {
    return {
      accessToken,
      account: AccountStatusDto.fromEntity(
        account,
        this.accountsService.isPro(account),
      ),
    };
  }
}
