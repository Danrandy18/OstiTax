import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module';
import { AccountsService } from './accounts.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Account } from './entities/account.entity';
import { AccountAuthGuard } from './guards/account-auth.guard';
import { OptionalAccountAuthGuard } from './guards/optional-account-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwtExpiresIn') as never,
        },
      }),
    }),
    forwardRef(() => BillingModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountsService, AccountAuthGuard, OptionalAccountAuthGuard],
  exports: [AccountsService, AccountAuthGuard, OptionalAccountAuthGuard, JwtModule],
})
export class AuthModule {}
