import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { CalcModule } from './calc/calc.module';
import { CommonModule } from './common/common.module';
import authConfig from './config/auth.config';
import billingConfig from './config/billing.config';
import databaseConfig from './config/database.config';
import finanzonlineConfig from './config/finanzonline.config';
import { FinanzOnlineModule } from './finanzonline/finanzonline.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, billingConfig, authConfig, finanzonlineConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    BillingModule,
    CalcModule,
    FinanzOnlineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
