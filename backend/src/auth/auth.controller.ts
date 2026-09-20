import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthService, type PasswordResetMode } from './auth.service';
import { CurrentAccount } from './decorators/current-account.decorator';
import { AccountStatusDto } from './dto/account-status.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordWithCodeDto } from './dto/reset-password-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
    );
    return this.toResponse(accessToken, account);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { accessToken, account } = await this.authService.login(
      dto.email,
      dto.password,
    );
    return this.toResponse(accessToken, account);
  }

  @Post('google')
  async google(@Body() dto: GoogleLoginDto) {
    const { accessToken, account } = await this.authService.googleLogin(
      dto.idToken,
    );
    return this.toResponse(accessToken, account);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ ok: true; mode: PasswordResetMode }> {
    const mode = await this.authService.forgotPassword(dto.email);
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
