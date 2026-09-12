import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789250219508 implements MigrationInterface {
    name = 'InitialSchema1789250219508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "bank_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "reference" character varying NOT NULL, "requisitionId" character varying, "institutionId" character varying NOT NULL, "institutionName" character varying, "status" character varying(16) NOT NULL DEFAULT 'pending', "errorMessage" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_80bc987f4f3885e48f524ce493e" UNIQUE ("reference"), CONSTRAINT "PK_e819ec14a4c20543aec5749da80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bank_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "connectionId" uuid NOT NULL, "externalAccountId" character varying NOT NULL, "iban" character varying, "currency" character varying(8), "ownerName" character varying, "lastSyncedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2815f9cdb8d25ae835ec6d0bc47" UNIQUE ("externalAccountId"), CONSTRAINT "PK_c872de764f2038224a013ff25ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bank_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bankAccountId" uuid NOT NULL, "externalTransactionId" character varying NOT NULL, "bookingDate" date, "amount" numeric(12,2) NOT NULL, "currency" character varying(8) NOT NULL, "remittanceInfo" text, "counterpartyName" character varying, "rawPayload" jsonb NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6ab63b54efe8bda50a766037b2e" UNIQUE ("bankAccountId", "externalTransactionId"), CONSTRAINT "PK_123cc87304eefb2c497b4acdd10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying, "googleId" character varying, "name" character varying, "plan" character varying(16) NOT NULL DEFAULT 'free', "stripeCustomerId" character varying, "stripeSubscriptionId" character varying, "paypalSubscriptionId" character varying, "subscriptionProvider" character varying(16), "subscriptionStatus" character varying, "subscriptionCurrentPeriodEnd" TIMESTAMP WITH TIME ZONE, "passwordResetTokenHash" character varying, "passwordResetExpiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email"), CONSTRAINT "UQ_e322f63d8a83674653cfc442025" UNIQUE ("googleId"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "processed_webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying(16) NOT NULL, "eventId" character varying NOT NULL, "processedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f4abb2ffccb64d209e96f49869f" UNIQUE ("provider", "eventId"), CONSTRAINT "PK_80f4f20ca1cace20dd6e3a714c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deviceId" character varying NOT NULL, "plan" character varying(16) NOT NULL DEFAULT 'free', "freeAttemptsRemaining" integer NOT NULL DEFAULT '3', "stripeCustomerId" character varying, "stripeSubscriptionId" character varying, "paypalSubscriptionId" character varying, "subscriptionProvider" character varying(16), "subscriptionStatus" character varying, "subscriptionCurrentPeriodEnd" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_838d3c4a6792bbb0dc90031c2c1" UNIQUE ("deviceId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "processed_webhook_events"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "bank_transactions"`);
        await queryRunner.query(`DROP TABLE "bank_accounts"`);
        await queryRunner.query(`DROP TABLE "bank_connections"`);
    }

}
